import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSSlabConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-tds-slab',
  templateUrl: './tds-slab.component.html',
  styleUrls: ['./tds-slab.component.css']
})
export class TdsSlabComponent implements AfterViewInit {
  tdsConfigurations: TDSSlabConfiguration[] = [];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['minIncome', 'maxIncome', 'taxRate', 'isActive', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel: UserAccessModel = {
    readAccess: false,
    updateAccess: false,
    deleteAccess: false,
    createAccess: false,
  };

  constructor(
    private _masterService: MastermoduleService,
    private _datasharingService: DatasharingService,
    private _dialog: MatDialog,
    private _router: Router,
    private _liveAnnouncer: LiveAnnouncer
  ) {
    this.warningMessage = '';
    this.errorMessage = '';
    this.showLoadingSpinner = false;
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username') || '';
    this._datasharingService.getUsername().subscribe((username: string) => {
      if (username) {
        this.currentUser = username;
      }
      if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
        this.userAccessModel.readAccess = true;
        this.userAccessModel.createAccess = true;
        this.userAccessModel.updateAccess = true;
        this.userAccessModel.deleteAccess = true;
        this.getTDSConfigurationList();
      } else {
        this.getUserAccessRights(this.currentUser, 'TDS Slab');
      }
    });
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
            this.getTDSConfigurationList();
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

  getTDSConfigurationList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getTDSConfigurationList().subscribe(
      (data: TDSSlabConfiguration[]) => {
        console.log('TDS Data received:', data);
        if (data && data.length > 0) {
          this.tdsConfigurations = data;
          this.dataSource = new MatTableDataSource(data);
          console.log('First TDS row data:', data[0]);
          setTimeout(() => {
            if (this.dataSource != null && this.dataSource != undefined) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = `No TDS configuration data available. Please add TDS configuration.`;
        }
        this.hideSpinner();
      },
      (error: any) => {
        console.log('Error loading TDS data:', error);
        this.errorMessage = 'Error loading TDS configuration';
        this.hideSpinner();
      }
    );
  }

  hideSpinner(): void {
    setTimeout(() => {
      this.showLoadingSpinner = false;
    }, 1000);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    if (this.sort) {
      this.sort.sortChange.subscribe(() => this._liveAnnouncer.announce('Sort changed.'));
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  deleteTDSSlab(tdsId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this._masterService.deleteTDSSlabById(tdsId).subscribe(
          (data: any) => {
            Swal.fire({
              title: 'Deleted!',
              text: 'TDS configuration has been deleted.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.getTDSConfigurationList();
          },
          (error: any) => {
            console.log(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Something went wrong while deleting the TDS configuration!',
            });
          }
        );
      }
    });
  }

  editTDSSlab(tdsConfig: TDSSlabConfiguration): void {
    // Navigate to edit page or open dialog
    const id = (tdsConfig as any).Id ?? (tdsConfig as any).id ?? tdsConfig.id;
    this._router.navigate(['/master/tds-slab/edit', id]);
  }

  addNewTDSSlab(): void {
    // Navigate to add page or open dialog
    this._router.navigate(['/master/tds-slab/add']);
  }

  viewTDSSlabDetails(tdsConfig: TDSSlabConfiguration): void {
    // Navigate to details page or open dialog
    const id = (tdsConfig as any).Id ?? (tdsConfig as any).id ?? tdsConfig.id;
    this._router.navigate(['/master/tds-slab/details', id]);
  }

  exportToExcel(): void {
    // Export functionality
    console.log('Export to Excel functionality to be implemented');
  }

  refreshData(): void {
    this.getTDSConfigurationList();
  }
}
