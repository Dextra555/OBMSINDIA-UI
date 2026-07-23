import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MiscTransModel } from 'src/app/model/miscTransModel';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-misc-transctions',
  templateUrl: './misc-transctions.component.html',
  styleUrls: ['./misc-transctions.component.css']
})
export class MiscTransctionsComponent implements OnInit {

  miscTrans!: MiscTransModel[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['TransDate', 'TransType', 'Amount', 'Particulars',  'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _payrollService: PayrollModuleService, private _router: Router,
    private _dataService: DatasharingService,private _masterService: MastermoduleService) {
      this.userAccessModel = {
        readAccess: false,
        updateAccess:false,
        deleteAccess:false,
        createAccess:false,
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
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
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
    this.getUserAccessRights(this.currentUser, 'Misc Transactions');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getMiscTransList();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
                      this.hideSpinner(); 
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  getMiscTransList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getMiscTransList().subscribe(
      (data) => {
        if(data.length  > 0){
          this.dataSource = new MatTableDataSource<MiscTransModel>(data);
        this.ngAfterViewInit();        
        }else{
          this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
        }
        this.hideSpinner();       
      },
      (error) => {
        console.log(error);
      }
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/payroll/new-misc-transactions'], { queryParams: { id: data.ID }, queryParamsHandling: 'merge' });
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }
  hideSpinner(){
    this.showLoadingSpinner = false;
  }
}
