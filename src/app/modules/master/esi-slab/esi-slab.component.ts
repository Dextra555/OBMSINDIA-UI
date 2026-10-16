import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { ESIConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-esi-slab',
  templateUrl: './esi-slab.component.html',
  styleUrls: ['./esi-slab.component.css']
})
export class EsiSlabComponent implements AfterViewInit {
  esiConfigurations: ESIConfiguration[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['grossSalaryLimit', 'employeeContributionRate', 'employerContributionRate', 'effectiveDate', 'isActive', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog,
    private _masterService: MastermoduleService,
    private _router: Router,
    private _dataService: DatasharingService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.dataSource != null && this.dataSource != undefined) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.getESIConfigurationList();
    } else {
      this.getUserAccessRights(this.currentUser, 'ESI Slab');
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.createAccess = data.Create;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.deleteAccess = data.Delete;

          if (this.userAccessModel.readAccess === true) {
            this.warningMessage = '';
            this.getESIConfigurationList();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access to this page, Please contact administrator. <br>
              Thank you`;
            this.showLoadingSpinner = false;
          }
        }
      },
      (error) => {
        this.errorMessage = error;
        this.showLoadingSpinner = false;
      }
    );
  }

  getESIConfigurationList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getESIConfigurationList().subscribe(
      (data: ESIConfiguration[]) => {
        console.log('ESI Data received:', data);
        if (data && data.length > 0) {
          this.esiConfigurations = data;
          this.dataSource = new MatTableDataSource(data);
          console.log('First row data:', data[0]);
          setTimeout(() => {
            if (this.dataSource != null && this.dataSource != undefined) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = `No ESI configuration data available. Please add ESI configuration.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading ESI data:', error);
        this.errorMessage = 'Error loading ESI configuration';
        this.hideSpinner();
      }
    );
  }

  onEditClick(data: ESIConfiguration): void {
    this._router.navigate(['/master/esi-slab/new-esi-slab'], { queryParams: { id: data.id }, queryParamsHandling: 'merge' });
  }

  onDeleteClick(id: number): void {
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this ESI configuration?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this.showLoadingSpinner = true;
          this._masterService.deleteESIConfigurationById(id).subscribe(
            () => {
              this.showLoadingSpinner = false;
              Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                title: 'Success',
                text: 'ESI configuration deleted successfully',
                icon: 'success',
                showCloseButton: false,
                timer: 3000,
              });
              this.getESIConfigurationList();
            },
            (error: any) => {
              this.showLoadingSpinner = false;
              console.error('Error deleting ESI configuration:', error);
              Swal.fire('Error', 'Failed to delete ESI configuration. Please try again.', 'error');
            }
          );
        }
      });
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
