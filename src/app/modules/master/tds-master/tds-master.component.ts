import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSMaster } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-tds-master',
  templateUrl: './tds-master.component.html',
  styleUrls: ['./tds-master.component.css']
})
export class TdsMasterComponent implements OnInit, AfterViewInit {

  tdsMasterList: TDSMaster[] = [];
  dataSource: any;
  showLoadingSpinner = false;
  errorMessage = '';
  warningMessage = '';
  currentUser = '';

  displayedColumns: string[] = ['tDSName', 'tDSPercentage', 'isActive', 'action'];

  userAccessModel: UserAccessModel = {
    readAccess: false,
    updateAccess: false,
    deleteAccess: false,
    createAccess: false,
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _masterService: MastermoduleService,
    private _datasharingService: DatasharingService,
    private _router: Router,
    private _liveAnnouncer: LiveAnnouncer
  ) {}

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username') ?? '';
    if (!this.currentUser) {
      this._datasharingService.getUsername().subscribe((u: string) => {
        this.currentUser = u;
      });
    }
    if (this.currentUser === 'admin' || this.currentUser === 'superadmin') {
      this.loadTDSMasterList();
    } else {
      this.getUserAccessRights(this.currentUser, 'TDS Master');
    }
  }

  getUserAccessRights(userName: string, screenName: string): void {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data: any) => {
        if (data) {
          this.userAccessModel.readAccess   = data.Read;
          this.userAccessModel.createAccess = data.Create;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.deleteAccess = data.Delete;

          if (this.userAccessModel.readAccess) {
            this.warningMessage = '';
            this.loadTDSMasterList();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              Please contact administrator.`;
            this.showLoadingSpinner = false;
          }
        }
      },
      (error: any) => {
        this.errorMessage = error;
        this.showLoadingSpinner = false;
      }
    );
  }

  loadTDSMasterList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getTDSMasterList().subscribe(
      (data: TDSMaster[]) => {
        if (data && data.length > 0) {
          this.tdsMasterList = data;
          this.dataSource = new MatTableDataSource(data);
          setTimeout(() => {
            if (this.dataSource) {
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            }
          }, 0);
        } else {
          this.errorMessage = 'No TDS Master records found. Click "New TDS Category" to add one.';
        }
        this.hideSpinner();
      },
      (error: any) => {
        this.errorMessage = 'Error loading TDS Master data.';
        this.hideSpinner();
      }
    );
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    if (this.sort) {
      this.sort.sortChange.subscribe(() => this._liveAnnouncer.announce('Sort changed.'));
    }
  }

  announceSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addNew(): void {
    this._router.navigate(['/master/tds-master/new']);
  }

  editTDSMaster(row: TDSMaster): void {
    this._router.navigate(['/master/tds-master/edit', row.ID]);
  }

  deleteTDSMaster(id: number): void {
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
        this._masterService.deleteTDSMasterById(id).subscribe(
          () => {
            Swal.fire({ title: 'Deleted!', text: 'TDS category deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
            this.loadTDSMasterList();
          },
          (error: any) => {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Something went wrong while deleting!' });
          }
        );
      }
    });
  }

  hideSpinner(): void {
    setTimeout(() => { this.showLoadingSpinner = false; }, 800);
  }
}
