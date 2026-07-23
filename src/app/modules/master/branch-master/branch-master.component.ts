import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { BranchResponseModel } from 'src/app/model/branchResponseModel';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BranchModel } from 'src/app/model/branchModel';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';


@Component({
  selector: 'app-branch-master',
  templateUrl: './branch-master.component.html',
  styleUrls: ['./branch-master.component.css']
})
export class BranchMasterComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  branchModel!: BranchModel[];
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  errorMessage: string = '';
  displayedColumns: string[] = ['code', 'name', 'address1', 'state', 'parentBranch', 'personIncharge', 'action'];
  dataSource: any;
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  // State filtering properties
  availableStates: any[] = [];
  selectedState: string = '';
  originalBranchData: any[] = [];
  isStateFilterActive: boolean = false;

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router
    , private _dataService: DatasharingService) { 
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
    console.log(this.dataSource);
  }

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
  ngOnInit() {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
      this.getUserAccessRights(this.currentUser, 'Branch Master');
  }
  getBranchMasterList() {
    this.showLoadingSpinner = true;
    this._masterService.getBranchMasterList().subscribe(
      (data) => {
        this.handleDataBinding(data);
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.handleDataBinding(data);
      },
      (error) => {
        this.handleErrors(error);
      }
    );
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

          if(this.currentUser == 'admin' || this.currentUser == 'superadmin'){
            this.getBranchMasterList();
          }else{
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
              this.getBranchMasterListByUser(this.currentUser);
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
              this.showLoadingSpinner = false;
            }
          }  
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  handleDataBinding(data: any) {
    console.log('Data received in handleDataBinding:', data);
    console.log('Data type:', typeof data);
    console.log('Data length:', data.length);
    
    if(data && Array.isArray(data) && data.length > 0){
      this.originalBranchData = data;
      this.dataSource = new MatTableDataSource<BranchModel>(data);
      this.ngAfterViewInit();
      this.loadAvailableStates();          
    }else if(data && Array.isArray(data) && data.length === 0){
      this.errorMessage = `No branch data available for <span style="color: black;">${this.currentUser}</span>.`;
    }else{
      this.errorMessage = `Invalid data received from server. Please try again later.`;
    }
    this.hideSpinner();
    
  }
  onEditClick(data: any): void {
    this._router.navigate(['/master/branch-master/new-branch'], { queryParams: { code: data.Code }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(code: string): void {
    this.showLoadingSpinner = true;
    this.branchCode = code;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this branch details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {       
        if (result.confirmDialog) {
          this._masterService.deleteBranchMasterByCode(this.branchCode).subscribe((response: any) => {
            this.getBranchMasterListByUser(this.currentUser);
            this._dataService.setUsername(this.currentUser);
            Swal.fire({
              toast: true,
              position: 'top',
              showConfirmButton: false,
              title: 'Success',
              text: response.Message || 'Successfully deleted branch details',
              icon: 'success',
              showCloseButton: false,
              timer: 3000,
            });
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.hideSpinner();
        }
      });

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

  getParentBranchName(element: any): string {
    if (!element.ParentBranch || element.ParentBranch === 'HQ') {
      return 'HQ';
    }
    // Find the parent branch name from the available branches
    const parentBranch = this.dataSource?.data?.find((branch: any) => branch.Code === element.ParentBranch);
    return parentBranch ? parentBranch.Name : element.ParentBranch;
  }

  // State filtering methods
  loadAvailableStates(): void {
    // Extract unique states from branch data
    const states = [...new Set(this.originalBranchData.map((branch: any) => branch.State).filter((state: string) => state && state.trim() !== ''))];
    this.availableStates = states.sort();
  }

  onStateFilterChange(event: any): void {
    // Extract the actual value from MatSelectChange object
    this.selectedState = event.value || (event && event.target ? event.target.value : event);
    this.applyStateFilter();
  }

  applyStateFilter(): void {
    if (!this.selectedState || this.selectedState === '') {
      // Show all branches
      this.dataSource.data = this.originalBranchData;
      this.isStateFilterActive = false;
    } else {
      // Filter by selected state
      const filteredData = this.originalBranchData.filter((branch: any) => 
        branch.State === this.selectedState
      );
      this.dataSource.data = filteredData;
      this.isStateFilterActive = true;
    }
    
    // Reapply pagination and sorting
    this.ngAfterViewInit();
  }

  clearStateFilter(): void {
    this.selectedState = '';
    this.applyStateFilter();
  }

  getStateFilterCount(): number {
    if (!this.selectedState || this.selectedState === '') {
      return this.originalBranchData.length;
    }
    return this.originalBranchData.filter((branch: any) => branch.State === this.selectedState).length;
  }

  getStateDisplayName(state: string): string {
    const count = this.originalBranchData.filter((branch: any) => branch.State === state).length;
    return `${state} (${count})`;
  }
}
