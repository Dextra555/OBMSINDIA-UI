import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from "../../../../service/inventory.service";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSMaster } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-new-supplier',
  templateUrl: './new-supplier.component.html',
  styleUrls: ['./new-supplier.component.css']
})
export class NewSupplierComponent implements OnInit {

  frm!: FormGroup;
  stateList: any;
  isEdit: boolean = false;
  ID: any;
  Code: any;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  tdsMasterList: TDSMaster[] = [];

  constructor(private fb: FormBuilder, public dialog: MatDialog, private route: Router, private activatedRoute: ActivatedRoute, private service: InventoryService,
    private _dataService: DatasharingService, private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

    this.frm = this.fb.group({
      Id: [0],
      Code: [''],
      Name: ['', Validators.required],
      Address1: ['', Validators.required],
      Address2: ['', Validators.required],
      PostCode: ['', Validators.required],
      City: ['', Validators.required],
      State: [''],
      Phone: ['', Validators.required],
      Fax: [''],
      ContactPerson: ['', Validators.required],
      CreditLimit: [0],
      Category: [''],
      Status: ['A'],
      LastUpdatedBy: [''],
      LASTUPDATE: [new Date()],
      IsTax: [false],
      GSTNo: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/)]],
      PanNo: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)]],
      IsTDS: [false],
      TDSPercentage: [null]
    });

  }

  ngOnInit(): void {
    this.ID = this.activatedRoute.snapshot.params['ID'];
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Supplier Master');

    // Load TDS Master list for dropdown
    this._masterService.getTDSMasterList().subscribe((list: TDSMaster[]) => {
      this.tdsMasterList = list.filter(t => t.IsActive);
    });

    this.service.getSupplierCode().subscribe((d: any) => {
      this.Code = d['Code'];
      this.stateList = d['stateList'];
    }, () => {
    },
      () => {
        if (this.ID == 0 || this.ID == undefined) {
          this.frm.get('Code')?.setValue(this.Code);
        }
      });

    if (this.ID != 0 && this.ID != undefined) {
      this.isEdit = true;
      this.service.getSupplierByID(this.ID).subscribe((d: any) => {
        this.frm.patchValue({
          Id: d.id ?? d.Id,
          Code: d.code ?? d.Code,
          Name: d.name ?? d.Name,
          Address1: d.address1 ?? d.Address1,
          Address2: d.address2 ?? d.Address2,
          PostCode: d.postCode ?? d.PostCode,
          City: d.city ?? d.City,
          State: d.state ?? d.State,
          Phone: d.phone ?? d.Phone,
          Fax: d.fax ?? d.Fax,
          ContactPerson: d.contactPerson ?? d.ContactPerson,
          CreditLimit: d.creditLimit ?? d.CreditLimit,
          Category: d.category ?? d.Category,
          Status: d.status ?? d.Status,
          LastUpdatedBy: d.lastUpdatedBy ?? d.LastUpdatedBy,
          LASTUPDATE: d.lASTUPDATE ?? d.LASTUPDATE,
          IsTax: d.isTax ?? d.IsTax ?? false,
          GSTNo: d.gSTNo ?? d.gstNo ?? d.GSTNo ?? '',
          PanNo: d.panNo ?? d.PanNo ?? '',
          IsTDS: d.isTDS ?? d.IsTDS ?? false,
          TDSPercentage: d.tDSPercentage ?? d.tdsPercentage ?? d.TDSPercentage ?? null
        });
      });
    }

    this.frm.get('Code')?.disable({ onlySelf: true })

    // When IsTax toggles, add/remove required validators for GSTNo & PanNo
    this.frm.get('IsTax')?.valueChanges.subscribe((checked: boolean) => {
      const gstControl = this.frm.get('GSTNo');
      const panControl = this.frm.get('PanNo');
      if (checked) {
        gstControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/)]);
        panControl?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)]);
      } else {
        gstControl?.setValidators([Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/)]);
        panControl?.setValidators([Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)]);
      }
      gstControl?.updateValueAndValidity();
      panControl?.updateValueAndValidity();
    });

  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onSubmit() {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      return;
    }
    let data = this.frm.getRawValue();
    data.LastUpdatedBy = this.currentUser;
    data.LASTUPDATE = new Date();
    this.service.saveSupplier(data).subscribe((d: any) => {
      this.showMessage("Supplier Saved/Updated Successfully", 'success', 'Success Message');
      this.frm.reset();
      this.route.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
        this.route.navigate(['/inventory/supplier-master']);
      });
    });
  }

  get isTaxChecked(): boolean {
    return this.frm.get('IsTax')?.value === true;
  }

  get isTDSChecked(): boolean {
    return this.frm.get('IsTDS')?.value === true;
  }

  onCancelClick() {
    this.ID = 0;
    this.isEdit = false;
    this.frm.reset();
    this.route.navigate(['/inventory/supplier-master/new-supplier']);
  }

  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px',
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideLoadingSpinner();
    return;
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

}
