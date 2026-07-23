import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { QuotationService } from "../quotation.service";
import { AgreementService } from "../agreement.service";
import { DatasharingService } from "../../../service/datasharing.service";
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { ServiceTypeService } from "../../../service/service-type.service";
import { PdfExportService } from 'src/app/service/pdf-export.service';
import { Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import Swal from "sweetalert2";

export interface IQuotation {
  ID: number,
  BranchName: string;
  ClientName: string;
  QuotationDate: string;
  Status?: string;
  AddedDate?: string;
}


@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.css']
})
export class QuotationsComponent {
  displayedColumns: string[] = ['SNo', 'QuotationID', 'BranchName', 'ClientName', 'QuotationDate', 'AddedDate', 'Status', 'action'];
  dataSource!: MatTableDataSource<IQuotation>;
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

  constructor(private _liveAnnouncer: LiveAnnouncer, public service: QuotationService,
    private _dataService: DatasharingService, private _masterService: MastermoduleService,
    private _pdfService: PdfExportService, private _serviceTypeService: ServiceTypeService,
    private _router: Router, private _agreementService: AgreementService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Quotation');
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
    this.getQuotations(this.currentUser, '0', false);
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
            this.getQuotations(this.currentUser, "0", true);
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
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
  }

  getQuotations(userId: string, branchId: string, load: boolean = false) {
    this.service.getQuotations(userId, branchId, load).subscribe((d: any) => {
      if (load) {
        this.getBranchMasterListByUser(this.currentUser);
      }
      // API returns quotations directly as an array
      const quotationsData = d['quotations'] || [];
      this.dataSource = new MatTableDataSource(quotationsData);

      // Custom filter predicate for ID + Text search
      this.dataSource.filterPredicate = (data: IQuotation, filter: string) => {
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

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;

      if (load) {
        this.getMasterData();
      }
      this.hideLoadingSpinner();
    })
  }

  getMasterData() {
    this.service.getQuotationMaster(this.currentUser).subscribe((data: any) => {
      this.branchList = data['branchList'];
      this.clientList = data['clientList'];
    });
    this._serviceTypeService.getAllServiceTypes().subscribe((data: any) => this.serviceTypes = data);
  }

  changeBranch(value: any) {
    this.selectedBranch = value;
    this.getQuotations(this.currentUser, value);
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
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }

  deleteQuotation(quotationId: number, clientName: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the quotation for ${clientName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showLoadingSpinner = true;
        this.service.deleteQuotationById(quotationId).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Quotation has been deleted successfully.',
              confirmButtonColor: '#3085d6'
            });
            this.getQuotations(this.currentUser, "0", false);
          },
          error: (error) => {
            this.handleErrors(error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to delete quotation. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    });
  }

  viewDetails(id: number) {
    this.showLoadingSpinner = true;
    this.service.getQuotationByID(id).subscribe({
      next: (res: any) => {
        const resultPayload = res.Result || res.result || res;
        const quotation = resultPayload.quotation || resultPayload;
        const details = resultPayload.details || resultPayload.quotationDetails || [];
        const branchObj = this.branchList?.find((b: any) => b.Code == quotation.Branch);
        const clientObj = this.clientList?.find((c: any) => c.Code == quotation.Client);

        // Open in new tab
        this._pdfService.exportQuotationPDF(details, branchObj, clientObj, this.serviceTypes, quotation.ID, quotation.QuotationDate, false);
        this.hideLoadingSpinner();
      },
      error: (err: any) => {
        this.handleErrors(err);
        Swal.fire('Error', 'Failed to fetch quotation details', 'error');
      }
    });
  }

  generateAgreement(id: number) {
    Swal.fire({
      title: 'Generate Agreement?',
      text: "This will automatically create an agreement from this quotation and close the quotation.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, generate it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showLoadingSpinner = true;

        // 1. Fetch Quotation and Details
        this.service.getQuotationByID(id).subscribe({
          next: (res: any) => {
            const resultPayload = res.Result || res.result || res;
            const quotation = resultPayload.quotation || resultPayload;
            const quotationDetails = resultPayload.quotationDetails || resultPayload.details || [];

            if (quotation.Status === 'Closed') {
              Swal.fire('Warning', 'This quotation is already converted to an agreement.', 'warning');
              this.hideLoadingSpinner();
              return;
            }

            // 2. Transform to Agreement Format
            const agreementData = {
              ...quotation,
              ID: 0, // New Agreement
              QuotationID: quotation.ID,
              AgreementDate: this.returnDate(quotation.QuotationDate),
              AgreementEndDate: this.returnDate(quotation.QuotationEndDate),
              agreementDetails: quotationDetails.map((qd: any) => ({
                ...qd,
                ID: 0,
                AgreementID: 0,
                IsTaxable: !!qd.IsTaxable
              }))
            };

            // 3. Save Agreement
            this._agreementService.save(agreementData).subscribe({
              next: (saveRes: any) => {
                // 4. Update Quotation Status to 'Closed'
                const updatedQuotation = { ...quotation, Status: 'Closed' };
                this.service.saveAndUpdateQuotation(updatedQuotation).subscribe({
                  next: () => {
                    Swal.fire('Success', 'Agreement generated successfully!', 'success');
                    this.getQuotations(this.currentUser, "0", false);
                  },
                  error: (err) => {
                    console.error('Error updating quotation status:', err);
                    Swal.fire('Success', 'Agreement generated, but failed to update quotation status.', 'info');
                    this.getQuotations(this.currentUser, "0", false);
                  }
                });
              },
              error: (err) => {
                this.handleErrors(err);
                Swal.fire('Error', 'Failed to generate agreement. Please try again.', 'error');
              }
            });
          },
          error: (err) => {
            this.handleErrors(err);
            Swal.fire('Error', 'Failed to fetch quotation details.', 'error');
          }
        });
      }
    });
  }

  exportToPDF(id: number) {
    this.showLoadingSpinner = true;
    this.service.getQuotationByID(id).subscribe({
      next: (res: any) => {
        const resultPayload = res.Result || res.result || res;
        const quotation = resultPayload.quotation || resultPayload;
        const details = resultPayload.details || resultPayload.quotationDetails || [];

        const branchObj = this.branchList?.find((b: any) => b.Code == quotation.Branch);
        const clientObj = this.clientList?.find((c: any) => c.Code == quotation.Client);

        // Download file
        this._pdfService.exportQuotationPDF(details, branchObj, clientObj, this.serviceTypes, quotation.ID, quotation.QuotationDate, true);
        this.hideLoadingSpinner();
      },
      error: (err: any) => {
        this.handleErrors(err);
        Swal.fire('Error', 'Failed to fetch quotation details', 'error');
      }
    });
  }
}
