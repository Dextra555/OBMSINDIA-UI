import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort, Sort} from '@angular/material/sort';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {AgreementService} from "../agreement.service";
import {DatasharingService} from "../../../service/datasharing.service";
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { PdfExportService } from 'src/app/service/pdf-export.service';
import { ServiceTypeService } from 'src/app/service/service-type.service';
import Swal from 'sweetalert2';

export interface IAgreement {
  ID: number,
  BranchName: string;
  ClientName: string;
  WorkPlace: string;
  AgreementDate: string;
  Status?: string;
  AddedDate?: string;
}


@Component({
  selector: 'app-agreements',
  templateUrl: './agreements.component.html',
  styleUrls: ['./agreements.component.css']
})
export class AgreementsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['SNo', 'AgreementID', 'BranchName', 'ClientName', 'WorkPlace', 'AgreementDate', 'AddedDate', 'QuotationID', 'Status', 'action'];

  dataSource: MatTableDataSource<IAgreement> = new MatTableDataSource<IAgreement>([]);
  branchList: any;
  clientList: any;
  serviceTypes: any[] = [];
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  searchID: string = '';
  searchString: string = '';
  selectedBranch: string = '0';

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, public service: AgreementService, 
    private _dataService: DatasharingService, private _masterService: MastermoduleService,
    private _pdfService: PdfExportService, private _serviceTypeService: ServiceTypeService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess:false,
      deleteAccess:false,
      createAccess:false,
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Agreement');   
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchString = filterValue.trim().toLowerCase();
    this.applyAllFilters();
  }

  applyIDFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchID = filterValue.trim().toLowerCase();
    this.applyAllFilters();
  }

  applyAllFilters() {
    this.dataSource.filter = JSON.stringify({
      id: this.searchID,
      text: this.searchString
    });
  }

  clearFilters() {
    this.searchID = '';
    this.searchString = '';
    this.selectedBranch = '0';
    if (this.dataSource) {
      this.dataSource.filter = '';
    }
    this.getAgreements(this.currentUser, '0', false);
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  getUserAccessRights(userName: string, screenName: string) {   
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin' || this.currentUser == 'admin') {
            this.warningMessage = '';
            this.getAgreements(this.currentUser, "0", true);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
                      this.hideLoadingSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
      if (isNaN(currentDate.getTime())) {
        return 'N/A';
      }
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
  }

  getAgreements(userId: string, branchId: string, load: boolean = false) {
    this.service.getAgreements(userId, branchId, load).subscribe((d: any) => {
      if (load) {
        this.getBranchMasterListByUser(this.currentUser);
      }
      // Handle the nested Result array if it exists
      const agreementsData = d['agreements']?.['Result'] || d['agreements'] || [];
      this.dataSource = new MatTableDataSource(agreementsData);
      
      // Custom filter predicate for ID + Text search
      this.dataSource.filterPredicate = (data: IAgreement, filter: string) => {
        if (!filter) return true;

        let filters;
        try {
          filters = JSON.parse(filter);
        } catch (e) {
          return true;
        }

        const searchID = filters.id;
        const searchString = filters.text;

        const matchesID = searchID ? data.ID.toString().toLowerCase().includes(searchID) : true;
        
        const dataStr = `${data.BranchName} ${data.ClientName} ${data.Status}`.toLowerCase();
        const matchesText = searchString ? dataStr.includes(searchString) : true;

        return matchesID && matchesText;
      };

      setTimeout(() => {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
      
      if (load) {
        this.getMasterData();
      }
      this.hideLoadingSpinner();
    })
  }

  getMasterData() {
    this.service.getAgreementMaster(this.currentUser).subscribe((data: any) => {
      this.branchList = data['branchList'];
      this.clientList = data['clientList'];
    });
    this._serviceTypeService.getAllServiceTypes().subscribe((data: any) => this.serviceTypes = data);
  }

  changeBranch(value: any) {
    this.selectedBranch = value;
    this.getAgreements(this.currentUser, value);
  }

  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchList = data
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner(){
    this.showLoadingSpinner = false
  }

  deleteAgreement(agreementId: number, clientName: string) {
    // First check if invoices are posted for this agreement
    this.service.getFinalInvoiceDate(agreementId).subscribe((finalInvoiceDate: any) => {
      if (Array.isArray(finalInvoiceDate) && finalInvoiceDate.length > 0) {
        Swal.fire({
          title: 'Cannot Delete',
          text: 'This agreement has posted invoices. Cannot delete agreements with posted invoices.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: `Do you want to delete the agreement for ${clientName}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
          if (result.isConfirmed) {
            this.showLoadingSpinner = true;
            this.service.DeleteAgreementById(agreementId).subscribe({
              next: (response) => {
                Swal.fire('Deleted!', 'Agreement has been deleted successfully.', 'success');
                this.getAgreements(this.currentUser, "0", false);
              },
              error: (error) => {
                this.handleErrors(error);
                Swal.fire('Error!', 'Failed to delete agreement.', 'error');
              }
            });
          }
        });
      }
    });
  }

  cancelAgreement(agreementId: number, clientName: string) {
    Swal.fire({
      title: 'Cancel Agreement?',
      text: `Are you sure you want to cancel the agreement for ${clientName}? This will mark the agreement as closed and re-open the associated quotation.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showLoadingSpinner = true;
        this.service.CancelAgreement(agreementId).subscribe({
          next: (response) => {
            Swal.fire('Cancelled!', 'Agreement has been cancelled and marked as closed.', 'success');
            this.getAgreements(this.currentUser, "0", false);
          },
          error: (error) => {
            this.handleErrors(error);
            Swal.fire('Error!', 'Failed to cancel agreement.', 'error');
          }
        });
      }
    });
  }

  viewDetails(id: number) {
    this.showLoadingSpinner = true;
    this.service.getAgreementById(id).subscribe({
      next: (res: any) => {
        // Handle direct dict (after await fix), Task.Result wrapper, or camelCase task wrapper
        const result = res.agreement ? res : (res.Result || res.result || res);
        const agreement = result.agreement || result.Agreement;
        const details = result.agreementDetails || result.AgreementDetails || result.details || [];

        if (!agreement) {
          Swal.fire('Error', 'Agreement data not found', 'error');
          this.hideLoadingSpinner();
          return;
        }

        const branchObj = this.branchList?.find((b: any) => b.Code == agreement.Branch);
        const clientObj = this.clientList?.find((c: any) => c.Code == agreement.Client);

        this._pdfService.exportAgreementPDF(details, branchObj, clientObj, this.serviceTypes, agreement.ID, agreement.AgreementDate, false);
        this.hideLoadingSpinner();
      },
      error: (err: any) => {
        this.handleErrors(err);
        Swal.fire('Error', 'Failed to fetch agreement details', 'error');
      }
    });
  }

  exportToPDF(id: number) {
    this.showLoadingSpinner = true;
    this.service.getAgreementById(id).subscribe({
      next: (res: any) => {
        // Handle direct dict (after await fix), Task.Result wrapper, or camelCase task wrapper
        const result = res.agreement ? res : (res.Result || res.result || res);
        const agreement = result.agreement || result.Agreement;
        const details = result.agreementDetails || result.AgreementDetails || result.details || [];

        if (!agreement) {
          Swal.fire('Error', 'Agreement data not found', 'error');
          this.hideLoadingSpinner();
          return;
        }

        const branchObj = this.branchList?.find((b: any) => b.Code == agreement.Branch);
        const clientObj = this.clientList?.find((c: any) => c.Code == agreement.Client);

        // Download file
        this._pdfService.exportAgreementPDF(details, branchObj, clientObj, this.serviceTypes, agreement.ID, agreement.AgreementDate, true);
        this.hideLoadingSpinner();
      },
      error: (err: any) => {
        this.handleErrors(err);
        Swal.fire('Error', 'Failed to fetch agreement details', 'error');
      }
    });
  }

  exportToWord(id: number) {
    this.showLoadingSpinner = true;
    this.service.getAgreementById(id).subscribe({
      next: (res: any) => {
        // Handle direct dict (after await fix), Task.Result wrapper, or camelCase task wrapper
        const result = res.agreement ? res : (res.Result || res.result || res);
        const agreement = result.agreement || result.Agreement;
        const details = result.agreementDetails || result.AgreementDetails || result.details || [];

        if (!agreement) {
          Swal.fire('Error', 'Agreement data not found', 'error');
          this.hideLoadingSpinner();
          return;
        }

        const branchObj = this.branchList?.find((b: any) => b.Code == agreement.Branch);
        const clientObj = this.clientList?.find((c: any) => c.Code == agreement.Client);

        // Download Word file
        this._pdfService.exportAgreementWord(details, branchObj, clientObj, this.serviceTypes, agreement.ID, agreement.AgreementDate, true);
        this.hideLoadingSpinner();
      },
      error: (err: any) => {
        this.handleErrors(err);
        Swal.fire('Error', 'Failed to fetch agreement details', 'error');
      }
    });
  }
}
