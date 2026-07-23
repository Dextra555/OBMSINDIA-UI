import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ClientModel } from 'src/app/model/clientModel';
import { IndianClientModel } from 'src/app/model/indian-client.model';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { IndianComplianceService } from 'src/app/service/indian-compliance.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';


@Component({
  selector: 'app-client-master',
  templateUrl: './client-master.component.html',
  styleUrls: ['./client-master.component.css']
})
export class ClientMasterComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)   
  sort!: MatSort;
  clientModel!: ClientModel[];
  showLoadingSpinner: boolean = false;
  clientCode:string = 'null';
  displayedColumns: string[] = ['client_code','branch_code', 'client_name', 'person_incharge', 'Status', 'indian_state', 'compliance_status', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  branchList: any[] = [];
  selectedBranch: string = '';
  searchText: string = '';

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    private _masterService: MastermoduleService, private _router: Router, 
    public dialogo: MatDialog,private _dataService: DatasharingService,
    private _indianComplianceService: IndianComplianceService) { 
      this.userAccessModel = {
        readAccess: false,
        updateAccess:false,
        deleteAccess:false,
        createAccess:false,
      }
    }

  applyFilter(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyAllFilters();
  }

  onBranchFilterChange() {
    this.applyAllFilters();
  }

  applyAllFilters() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const f = JSON.parse(filter);
      const matchesBranch = f.branch ? data.Branch === f.branch : true;
      const matchesText = f.text ? `${data.Code} ${data.Name} ${data.PersonIncharge}`.toLowerCase().includes(f.text) : true;
      return matchesBranch && matchesText;
    };
    this.dataSource.filter = JSON.stringify({ branch: this.selectedBranch, text: this.searchText });
  }


  ngAfterViewInit() {
    this.assignPaginatorAndSort();
  }

  assignPaginatorAndSort() {
    if (this.dataSource) {
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
    this.getUserAccessRights(this.currentUser, 'Client Master');
    
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
            this.getClientMasterList('null','Active');
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });
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
        this.handleErrors(error);
      }
    );
  }
  getClientMasterList(code:string,status:string): void {
    this.showLoadingSpinner = true;
    this._masterService.getClienthMaster(code,status).subscribe(
      (data) => {
        if(data && data.length > 0){
          this.dataSource = new MatTableDataSource<ClientModel>(data);
          setTimeout(() => {
            this.assignPaginatorAndSort();
          });
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
  statusSelectionChanged(event: MatRadioChange) {
    this._masterService.getClientMsterListByStatus(event.value).subscribe(
      (data) => {
        this.dataSource =  new MatTableDataSource<ClientModel>(data);        
        this. ngAfterViewInit();
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/master/client-master/new-client'], { queryParams: { code: data.Code, status: data.Status }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(code: string,status:string): void {
    this.showLoadingSpinner = true;
    this.clientCode = code;

    this.dialogo
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this client details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {       
        if (result.confirmDialog) {
          this._masterService.deleteClientMasterByCode(this.clientCode).subscribe((response) => {
            this.clientCode = 'null';
            this.getClientMasterList('null',status);           
              Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                title: 'Success',
                text: response.Headers[0].Value,
                icon: 'success',
                showCloseButton: false,
                timer: 3000,
              });            
            this.showLoadingSpinner = false;
          },
            (error) => this.handleErrors(error)
          );
        }else{
          this.showLoadingSpinner = false;
        }
      });
  }
getOverallComplianceStatus(element: any): string {
    const complianceStatus = element.ClientComplianceStatus || 'non_compliance_client';
    
    if (complianceStatus === 'compliance_client') {
      return 'Compliance Client';
    } else {
      return 'Non-Compliance Client';
    }
  }

  getComplianceBadgeClass(status: string): string {
    switch(status) {
      case 'Compliance Client':
        return 'badge-success';
      case 'Non-Compliance Client':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  hideSpinner(){
  this.showLoadingSpinner = false;
}

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

}
