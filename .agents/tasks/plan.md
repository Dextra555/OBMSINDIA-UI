# Implementation Plan: Fix Save/Update Button Access Control Logic

## Background

Most pages use a broken `*ngIf` pattern that shows the Save/Update button whenever the user has
either `createAccess` OR `updateAccess`. A user with only `createAccess` (New checkbox) must NOT
see the Update button when editing an existing record, and vice versa.

### Fix rule
- **New mode** (ID == 0 / isEdit == false / etc.): show button if `createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'`
- **Edit mode** (ID != 0 / isEdit == true / etc.): show button ONLY if `updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'`
- **Special — always-new** (registration, transfer, batch operations): only `createAccess` check
- **Special — always-update** (recycle-bin restore, cheque-status deposit/return): only `updateAccess` check
- **Special — Delete button on acc-gl-data-list**: Delete is always an update-class operation → use `updateAccess` only
- All files use `this.userAccessModel.createAccess` / `this.userAccessModel.updateAccess` prefix

---

## Files to SKIP (already fixed or correct)

| File | Reason |
|------|--------|
| `master/branch-master/new-branch/new-branch.component.html` | Already fixed (confirmed by grep) |
| `finance/credit-note/credit-note.component.html` | Already uses correct `selectedID`-based split with `admin` guard |
| `finance/debit-note/debit-note.component.html` | Already uses correct `selectedID`-based split with `admin` guard |
| All **list-view** pages (branch-master.component.html, epf-slab.component.html, etc.) | Their `createAccess` usage is on a "New" navigation button, which is correct — createAccess only |
| `administration/user-access-rights/new-user-access-rights/new-user-access-rights.component.html` | Already uses `canUseUpdateButton` / `canUseNewButton` computed properties |
| `administration/user-registration/user-registration.component.html` | "New" navigation button only — correct |

---

## Files to Fix

### Group A — Mode detected via form field `ID == 0` (new) vs `ID != 0` (edit)

---

- [ ] 1. Fix `master/socso-slab/new-socso-slab/new-socso-slab.component.html`

  **Current (line 57–58):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
  class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{socsoForm.get('socso_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `socsoForm.get('socso_id')?.value` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  <button *ngIf="(socsoForm.get('socso_id')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (socsoForm.get('socso_id')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{socsoForm.get('socso_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/master/socso-slab/new-socso-slab/new-socso-slab.component.html`  
  **Verify:** Open app, log in as a user with only `createAccess` on Socso Slab. Click an existing record to edit it — Update button must NOT appear. Click New — Save button must appear.

---

- [ ] 2. Fix `master/sip-slab/new-sip-slab/new-sip-slab.component.html`

  **Current (line 50–51):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
   class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{sipForm.get('SIP_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `sipForm.get('SIP_id')?.value` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  <button *ngIf="(sipForm.get('SIP_id')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (sipForm.get('SIP_id')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
   class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{sipForm.get('SIP_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/master/sip-slab/new-sip-slab/new-sip-slab.component.html`  
  **Verify:** Same as item 1, for SIP Slab page.

---

- [ ] 3. Fix `master/epf-slab/new-epf-slab/new-epf-slab.component.html`

  **Current (line 82–83):**
  ```html
  <button *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser== 'superadmin')"
  class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{epfForm.get('epf_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `epfForm.get('epf_id')?.value` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  <button *ngIf="(epfForm.get('epf_id')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (epfForm.get('epf_id')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"> {{epfForm.get('epf_id')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/master/epf-slab/new-epf-slab/new-epf-slab.component.html`

---

- [ ] 4. Fix `master/salary-slab/new-salary-slab/new-salary-slab.component.html`

  **Current (line 246):**
  ```html
  <button *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser== 'superadmin')"
  class="btn wlt-c-furg-btn-primary" (click)="saveSalary()" [disabled]="salaryForm.invalid">
    Save</button>
  ```
  **Mode variable:** `salaryID` component property (set from route params; 0 = new, != 0 = edit).  
  **Fix:**
  ```html
  <button *ngIf="(salaryID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (salaryID != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" (click)="saveSalary()" [disabled]="salaryForm.invalid">
    Save</button>
  ```
  **Files:** `src/app/modules/master/salary-slab/new-salary-slab/new-salary-slab.component.html`

---

- [ ] 5. Fix `master/income-tax-slab/new-income-tax-slab/new-income-tax-slab.component.html`

  **Current (lines 190 + 192):**
  - Line 190: Cancel button incorrectly has `*ngIf` with the broken access pattern (it should always show).
  - Line 192: The actual Save/Update button has **no `*ngIf` at all**.

  **Current:**
  ```html
  <button *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser== 'superadmin')"
  class="btn wlt-c-furg-btn-gray mr-3" mat-dialog-close (click)="clearIncomeTaxDetails()"> Cancel</button>
  <button class="btn wlt-c-furg-btn-primary"  (click)="savebuttonClick()"> {{incomeTaxForm.get('IT_ID')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `incomeTaxForm.get('IT_ID')?.value` (0 = new, != 0 = edit). Initial value is `'0'` (string).  
  **Fix:**
  1. Remove the `*ngIf` from the Cancel button (Cancel should always be visible).
  2. Add the correct `*ngIf` to the Save/Update button:
  ```html
  <button class="btn wlt-c-furg-btn-gray mr-3" mat-dialog-close (click)="clearIncomeTaxDetails()"> Cancel</button>
  <button *ngIf="(incomeTaxForm.get('IT_ID')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (incomeTaxForm.get('IT_ID')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"  (click)="savebuttonClick()"> {{incomeTaxForm.get('IT_ID')?.value === 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/master/income-tax-slab/new-income-tax-slab/new-income-tax-slab.component.html`

---

- [ ] 6. Fix `administration/bank-list/new-bank-list/new-bank-list.component.html`

  **Current (line 40–41):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="bankListForm.invalid" (click)="savebuttonClick()"> {{bankListForm.get('ID')?.value == 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `bankListForm.get('ID')?.value` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  <button *ngIf="(bankListForm.get('ID')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (bankListForm.get('ID')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="bankListForm.invalid" (click)="savebuttonClick()"> {{bankListForm.get('ID')?.value == 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/administration/bank-list/new-bank-list/new-bank-list.component.html`

---

- [ ] 7. Fix `administration/bank-master/new-bank-master/new-bank-master.component.html`

  **Current (line 65–66):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="bankMasterForm.invalid" (click)="savebuttonClick()"> {{bankMasterForm.get('ID')?.value == 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `bankMasterForm.get('ID')?.value` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  <button *ngIf="(bankMasterForm.get('ID')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (bankMasterForm.get('ID')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="bankMasterForm.invalid" (click)="savebuttonClick()"> {{bankMasterForm.get('ID')?.value == 0 ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/administration/bank-master/new-bank-master/new-bank-master.component.html`

---

- [ ] 8. Fix `administration/user-bank-access/new-user-bank-access/new-user-bank-access.component.html`

  **Current (line 55–57):**
  ```html
  <button *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary"
  (click)="savebuttonClick()"> {{userBankAccessForm.get('ID')?.value == 0 ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `userBankAccessTitle` string (`'new'` / `'edit'`) set in TS. The form ID field is `userBankAccessForm.get('ID')` but since multiple rows can have different IDs (it's an array of bank permissions), use the title string.  
  **Fix:**
  ```html
  <button *ngIf="(userBankAccessTitle == 'new' && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (userBankAccessTitle != 'new' && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"
  (click)="savebuttonClick()"> {{userBankAccessTitle == 'new' ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/administration/user-bank-access/new-user-bank-access/new-user-bank-access.component.html`

---

- [ ] 9. Fix `administration/user-branch-access/new-user-branch-access/new-user-branch-access.component.html`

  **Current (line 50–52):**
  ```html
  <button *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" 
   (click)="savebuttonClick()"> {{userBranchAccessTitle == 'new' ? 'Save' : 'Update' }}</button>
  ```
  **Mode variable:** `userBranchAccessTitle` string (`'new'` / `'edit'`) set in TS.  
  **Fix:**
  ```html
  <button *ngIf="(userBranchAccessTitle == 'new' && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (userBranchAccessTitle != 'new' && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" 
   (click)="savebuttonClick()"> {{userBranchAccessTitle == 'new' ? 'Save' : 'Update' }}</button>
  ```
  **Files:** `src/app/modules/administration/user-branch-access/new-user-branch-access/new-user-branch-access.component.html`

---

- [ ] 10. Fix `master/client-master/new-client/new-client-master.component.html`

  **Current (line 451–455):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true 
  || currentUser == 'superadmin'" class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"
      [disabled]="clientForm.invalid"> {{clientForm.get('Id')?.value === 0 ? 'Save' : 'Update'
      }}</button>
  ```
  **Mode variable:** `clientForm.get('Id')?.value` (0 = new, != 0 = edit). Note: field is `Id` not `ID`.  
  **Fix:**
  ```html
  <button *ngIf="(clientForm.get('Id')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (clientForm.get('Id')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" (click)="savebuttonClick()"
      [disabled]="clientForm.invalid"> {{clientForm.get('Id')?.value === 0 ? 'Save' : 'Update'
      }}</button>
  ```
  **Files:** `src/app/modules/master/client-master/new-client/new-client-master.component.html`

---

- [ ] 11. Fix `payroll/misc-transctions/new-misc-transactions/new-misc-transactions.component.html`

  **Current (line 122–124):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="miscTransForm.invalid || miscTransForm.get('BranchCode')?.value === 0"
      (click)="savebuttonClick()"> {{miscTransForm.get('ID')?.value === 0 ? 'Save' : 'Update'
      }}</button>
  ```
  **Mode variable:** `miscTransForm.get('ID')?.value` (0 = new, != 0 = edit). Form group has `ID: [0]` as initial value.  
  **Fix:**
  ```html
  <button *ngIf="(miscTransForm.get('ID')?.value == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (miscTransForm.get('ID')?.value != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="miscTransForm.invalid || miscTransForm.get('BranchCode')?.value === 0"
      (click)="savebuttonClick()"> {{miscTransForm.get('ID')?.value === 0 ? 'Save' : 'Update'
      }}</button>
  ```
  **Files:** `src/app/modules/payroll/misc-transctions/new-misc-transactions/new-misc-transactions.component.html`

---

### Group B — Mode detected via `isEdit` boolean

---

- [ ] 12. Fix `finance/legal-demand-action/new-legal-demand-action/new-legal-demand-action.component.html`

  **Current (line 79–80):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary" [disabled]="frm.invalid" (click)="onSaveClick()"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="frm.invalid" (click)="onSaveClick()"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/finance/legal-demand-action/new-legal-demand-action/new-legal-demand-action.component.html`

---

- [ ] 13. Fix `master/employee-master/new-employee/new-employee.component.html`

  **Current (line 2553–2555):**
  ```html
  <button
    *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin')"
    class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  <button
    *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
        || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
    class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/master/employee-master/new-employee/new-employee.component.html`

---

- [ ] 14. Fix `inventory/asset-master/new-asset/new-asset.component.html`

  **Current (line 76–77):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/inventory/asset-master/new-asset/new-asset.component.html`

---

- [ ] 15. Fix `inventory/category-master/new-catergory/new-catergory.component.html`

  **Current (line 76–77):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary">  {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  <button *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary">  {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/inventory/category-master/new-catergory/new-catergory.component.html`

---

- [ ] 16. Fix `inventory/item-master/new-item/new-item.component.html`

  **Current (line 101–102):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary">  {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  <button *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary">  {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/inventory/item-master/new-item/new-item.component.html`

---

- [ ] 17. Fix `inventory/recepient-master/new-recepient/new-recepient.component.html`

  **Current (line 143–144):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/inventory/recepient-master/new-recepient/new-recepient.component.html`

---

- [ ] 18. Fix `inventory/supplier-master/new-supplier/new-supplier.component.html`

  **Current (line 129–130):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true|| this.userAccessModel.updateAccess == true  || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/inventory/supplier-master/new-supplier/new-supplier.component.html`

---

- [ ] 19. Fix `quotation-and-agreement/agreement-termination/new-agreement-termination/new-agreement-termination.component.html`

  **Current (line 66–67):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Mode variable:** `isEdit` boolean  
  **Fix:**
  ```html
  <button *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"> {{isEdit ? 'Update' : 'Save'}}</button>
  ```
  **Files:** `src/app/modules/quotation-and-agreement/agreement-termination/new-agreement-termination/new-agreement-termination.component.html`

---

- [ ] 20. Fix `payroll/employee-loan/new-employee-loan.component.html`

  **Current (line 154–158):**
  ```html
  *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeLoanForm.invalid"
  (click)="savebuttonClick()"> {{salaryAdvanceID == 0 ? 'Save': 'Update'}}</button>
  ```
  **Mode variable:** `isEdit` boolean (also `salaryAdvanceID` which mirrors it; use `isEdit` for clarity).  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeLoanForm.invalid"
  (click)="savebuttonClick()"> {{salaryAdvanceID == 0 ? 'Save': 'Update'}}</button>
  ```
  **Files:** `src/app/modules/payroll/employee-loan/new-employee-loan.component.html`

---

- [ ] 21. Fix `payroll/employee-uniform-loan/new-employee-uniform-loan.component.html`

  **Current (line 249–253):**
  ```html
  *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeUniformLoanForm.invalid"
  (click)="savebuttonClick()"> {{advanceID == 0 ? 'Save': 'Update'}}</button>
  ```
  **Mode variable:** `isEdit` boolean (also `advanceID`; use `isEdit`).  
  **Fix:**
  ```html
  *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeUniformLoanForm.invalid"
  (click)="savebuttonClick()"> {{advanceID == 0 ? 'Save': 'Update'}}</button>
  ```
  **Files:** `src/app/modules/payroll/employee-uniform-loan/new-employee-uniform-loan.component.html`

---

### Group C — Mode detected via dedicated ID property (`receiptID`, `paymentID`, `invoiceID`, `attendanceID`, `advanceID`)

---

- [ ] 22. Fix `finance/receipts/new-receipt/new-receipt.component.html`

  **Current (line 304–305):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary" (click)="onSubmit()" [disabled]="frm.invalid"> {{ receiptID > 0 ?
  ```
  **Mode variable:** `receiptID` (0 = new, > 0 = edit)  
  **Fix:**
  ```html
  *ngIf="(receiptID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (receiptID > 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" (click)="onSubmit()" [disabled]="frm.invalid"> {{ receiptID > 0 ?
  ```
  **Files:** `src/app/modules/finance/receipts/new-receipt/new-receipt.component.html`

---

- [ ] 23. Fix `finance/payments/payments.component.html`

  **Current (line 242–243):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true ||this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary" [disabled]="hasInvalidPayment" (click)="onSubmit()"> {{ paymentID > 0 ?
  ```
  **Mode variable:** `paymentID` (0 = new, > 0 = edit)  
  **Fix:**
  ```html
  *ngIf="(paymentID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (paymentID > 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="hasInvalidPayment" (click)="onSubmit()"> {{ paymentID > 0 ?
  ```
  **Files:** `src/app/modules/finance/payments/payments.component.html`

---

- [ ] 24. Fix `finance/invoice/invoice.component.html`

  **Current (line 133–134):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true ||this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
  class="btn wlt-c-furg-btn-primary" type="submit"> {{ isEditMode ? 'Update' : 'Save' }}</button>
  ```
  **Mode variable:** `isEditMode` boolean  
  **Fix:**
  ```html
  <button *ngIf="(!isEditMode && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEditMode && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))" 
  class="btn wlt-c-furg-btn-primary" type="submit"> {{ isEditMode ? 'Update' : 'Save' }}</button>
  ```
  **Files:** `src/app/modules/finance/invoice/invoice.component.html`

---

- [ ] 25. Fix `inventory/utility-bills/utility-bills.component.html`

  **Current (line 204–206):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser =='superadmin'"
  class="btn wlt-c-furg-btn-primary mr-2" (click)="onSubmit()"> {{ invoiceID > 0 ? 'Update' : 'Save' }}</button>
  ```
  **Mode variable:** `invoiceID` (0 = new, > 0 = edit)  
  **Fix:**
  ```html
  *ngIf="(invoiceID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (invoiceID > 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary mr-2" (click)="onSubmit()"> {{ invoiceID > 0 ? 'Update' : 'Save' }}</button>
  ```
  **Files:** `src/app/modules/inventory/utility-bills/utility-bills.component.html`

---

- [ ] 26. Fix `payroll/attendance/new-attendance/new-attendance.component.html`

  **Current (line 613–618):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true 
  || currentUser == 'superadmin') && dynamicEditable == 'set'" class="btn wlt-c-furg-btn-primary"
      [disabled]="attendanceForm.invalid" (click)="saveAttendance()">{{attendanceForm.value.ID ==
      0 ? 'Save':'Update'}} </button>
  ```
  **Mode variable:** `attendanceForm.value.ID` (0 = new, != 0 = edit). The `dynamicEditable == 'set'` condition must be preserved.  
  **Fix:**
  ```html
  <button *ngIf="((attendanceForm.value.ID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (attendanceForm.value.ID != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin')))
      && dynamicEditable == 'set'" class="btn wlt-c-furg-btn-primary"
      [disabled]="attendanceForm.invalid" (click)="saveAttendance()">{{attendanceForm.value.ID ==
      0 ? 'Save':'Update'}} </button>
  ```
  **Files:** `src/app/modules/payroll/attendance/new-attendance/new-attendance.component.html`

---

- [ ] 27. Fix `payroll/new-employee-daily-advance/new-employee-daily-advance.component.html`

  **Current (line 145–149):**
  ```html
  *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeDailyForm.invalid"
  (click)="savebuttonClick()"> {{advanceID == 0 ? 'Save' : 'Update'
  }}</button>
  ```
  **Mode variable:** `advanceID` (0 = new, != 0 = edit)  
  **Fix:**
  ```html
  *ngIf="(advanceID == 0 && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (advanceID != 0 && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary" [disabled]="employeeDailyForm.invalid"
  (click)="savebuttonClick()"> {{advanceID == 0 ? 'Save' : 'Update'
  }}</button>
  ```
  **Files:** `src/app/modules/payroll/new-employee-daily-advance/new-employee-daily-advance.component.html`

---

### Group D — Employee Monthly Advance (special — uses `employeeAdvanceTitleStatus`)

---

- [ ] 28. Fix `payroll/employee-monthly-advance/new-employee-monthly-advance/new-employee-monthly-advance.component.html`

  **Current (line 188–193):**
  ```html
  *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary"
  (click)="savebuttonClick()">
  {{isEmployeeIdValid() === false ? 'Save' :
  'Update' }}</button>
  ```
  **Mode variable:** `employeeAdvanceTitleStatus` string (`'new'` / `'edit'`). The `isEmployeeIdValid()` is a helper that returns `false` when no employee ID is present (i.e., new mode), so it mirrors the status string.  
  **Fix:** Use `employeeAdvanceTitleStatus` directly for the access guard (same semantics, more reliable than the helper):
  ```html
  *ngIf="(employeeAdvanceTitleStatus == 'new' && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (employeeAdvanceTitleStatus != 'new' && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
  class="btn wlt-c-furg-btn-primary"
  (click)="savebuttonClick()">
  {{isEmployeeIdValid() === false ? 'Save' :
  'Update' }}</button>
  ```
  **Files:** `src/app/modules/payroll/employee-monthly-advance/new-employee-monthly-advance/new-employee-monthly-advance.component.html`

---

### Group E — Special: Recycle-bin / Restore pages (always `updateAccess` — restoring is an update operation)

---

- [ ] 29. Fix `finance/invoice-recycle-bin/invoice-recycle-bin.component.html`

  **Current (line 62–63):**
  ```html
  <a *ngIf="this.userAccessModel.createAccess == true ||this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
  class="btn wlt-c-furg-btn-primary" (click)="restoreSubmit()"> Restore</a>
  ```
  **Special case:** Restore is always an update operation (un-deleting = updating soft-delete flag).  
  **Fix:**
  ```html
  <a *ngIf="this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'" 
  class="btn wlt-c-furg-btn-primary" (click)="restoreSubmit()"> Restore</a>
  ```
  **Files:** `src/app/modules/finance/invoice-recycle-bin/invoice-recycle-bin.component.html`

---

- [ ] 30. Fix `finance/payments-recycle-bin/payments-recycle-bin.component.html`

  **Current (lines 84–87):**
  ```html
  <div class="text-right" *ngIf="this.userAccessModel.createAccess == true">
      <button class="btn wlt-c-furg-btn-gray mr-3" mat-dialog-close> Cancel</button>
      <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
      class="btn wlt-c-furg-btn-primary" (click)="restoreSelectedPayments()"> Restore</button>
  ```
  **Special case:** Restore is always an update operation. The outer `*ngIf` on the container div also needs fixing.  
  **Fix:**
  ```html
  <div class="text-right" *ngIf="this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'">
      <button class="btn wlt-c-furg-btn-gray mr-3" mat-dialog-close> Cancel</button>
      <button *ngIf="this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
      class="btn wlt-c-furg-btn-primary" (click)="restoreSelectedPayments()"> Restore</button>
  ```
  **Files:** `src/app/modules/finance/payments-recycle-bin/payments-recycle-bin.component.html`

---

### Group F — Special: Cheque-Status and Finance-Cheque-Master (always-update operations)

---

- [ ] 31. Fix `finance/cheque-status/cheque-status.component.html`

  **Current (line 143–144):**
  ```html
  *ngIf="this.userAccessModel.createAccess == true ||this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
  class="btn wlt-c-furg-btn-primary" [disabled]="dataSource?.length <= 0"
  (click)="onSubmitClick()"> {{ frm.get('chequeStatus')?.value == 'D' ? 'Return' : 'Deposite' }}</button>
  ```
  **Special case:** Depositing or returning a cheque is always an update on existing cheque records. This is never a "create new cheque" action.  
  **Fix:**
  ```html
  *ngIf="this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
  class="btn wlt-c-furg-btn-primary" [disabled]="dataSource?.length <= 0"
  (click)="onSubmitClick()"> {{ frm.get('chequeStatus')?.value == 'D' ? 'Return' : 'Deposite' }}</button>
  ```
  **Files:** `src/app/modules/finance/cheque-status/cheque-status.component.html`

---

- [ ] 32. Fix `finance/finance-cheque-master/finance-cheque-master.component.html`

  **Current (line 120):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Note:** The form has no reactive formGroup — it is a static stub form. There is no ID field visible.  
  **Special case:** Based on the form design (running number is auto-populated, disabled), this page creates new cheque master records only. Use `createAccess` only.  
  **Fix:**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'" 
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Files:** `src/app/modules/finance/finance-cheque-master/finance-cheque-master.component.html`

---

### Group G — Special: Batch Invoice and Salary Processing (always-new / process operations)

---

- [ ] 33. Fix `finance/batch-invoice/batch-invoice.component.html`

  **Current (line 67–69):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true ||this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
   class="btn wlt-c-furg-btn-primary" (click)="save()"> Save</button>
  ```
  **Special case:** Batch invoice always generates new invoice records (`ID: ?? 0` pattern in TS shows it re-uses or creates rows, but the operation is always "save batch"). Only `createAccess` is needed.  
  **Fix:**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
   class="btn wlt-c-furg-btn-primary" (click)="save()"> Save</button>
  ```
  **Files:** `src/app/modules/finance/batch-invoice/batch-invoice.component.html`

---

- [ ] 34. Fix `payroll/salary-processing/salary-processing.component.html`

  **Current (line 133–136):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary" [disabled]="salaryProcessingForm.invalid"
  (click)="onProcessClick()">
      Process</button>
  ```
  **Special case:** Salary Processing is a batch operation that creates salary records. Use `createAccess` only.  
  **Fix:**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
  class="btn wlt-c-furg-btn-primary" [disabled]="salaryProcessingForm.invalid"
  (click)="onProcessClick()">
      Process</button>
  ```
  **Files:** `src/app/modules/payroll/salary-processing/salary-processing.component.html`

---

### Group H — Employee Transfer (always-new operation)

---

- [ ] 35. Fix `master/employee-transfer/employee-transfer.component.html`

  **Current (line 96):**
  ```html
  *ngIf="(this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin')"
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Special case:** Employee transfer is always a new operation (it creates a transfer record; there is no edit transfer flow — the TS has no ID routing).  
  **Fix:**
  ```html
  *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Files:** `src/app/modules/master/employee-transfer/employee-transfer.component.html`

---

### Group I — Administration Cheque Master (always-new stub form)

---

- [ ] 36. Fix `administration/cheque-master/new-cheque-master/new-cheque-master.component.html`

  **Current (line 58–59):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')" 
  class="btn wlt-c-furg-btn-primary" [disabled]="chequeMasterForm.invalid" (click)="savebuttonClick()"> Save</button>
  ```
  **Note:** The label is always "Save" with no Update label, suggesting this is always-new. Check the TS for confirmation — if an ID form field exists and can be non-zero, this should use the ID-based split pattern instead.  
  **Action:** Read `new-cheque-master.component.ts` first. If `chequeMasterForm.get('ID')?.value` exists and can be non-zero (edit mode), apply the ID-based split. If no ID field or always 0, apply `createAccess`-only fix:
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'" 
  class="btn wlt-c-furg-btn-primary" [disabled]="chequeMasterForm.invalid" (click)="savebuttonClick()"> Save</button>
  ```
  **Files:** `src/app/modules/administration/cheque-master/new-cheque-master/new-cheque-master.component.html`

---

### Group J — Accounting GL Data List (Save creates; Delete requires updateAccess)

---

- [ ] 37. Fix `Accounting/acc-gl-data-list/acc-gl-data-list.component.html`

  **Current (lines 75–83):**
  ```html
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
      class="btn wlt-c-furg-btn-danger mr-3" (click)="deleteClickButton()" [disabled]="frm.invalid"> Delete</button>
  <button *ngIf="(this.userAccessModel.updateAccess == true || this.userAccessModel.createAccess == true || currentUser == 'superadmin')"
      class="btn wlt-c-furg-btn-primary"
      [disabled]="frm.invalid || ..."
      (click)="btnSaveandUpdateClick()">
      Save</button>
  ```
  **Special case:** The Save button calls `addGLRecord` (creates new GL data). The Delete button removes existing GL records. These are separate access concerns.  
  **Fix:**
  - **Delete button** → `updateAccess` only (deleting is a form of updating existing data)
  - **Save button** → `createAccess` only
  ```html
  <button *ngIf="this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
      class="btn wlt-c-furg-btn-danger mr-3" (click)="deleteClickButton()" [disabled]="frm.invalid"> Delete</button>
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'"
      class="btn wlt-c-furg-btn-primary"
      [disabled]="frm.invalid || frm.controls['Branchcode'].value === 0 || frm.controls['Branchcode'].value === undefined"
      (click)="btnSaveandUpdateClick()">
      Save</button>
  ```
  **Files:** `src/app/modules/Accounting/acc-gl-data-list/acc-gl-data-list.component.html`

---

### Group K — User Registration (always-new)

---

- [ ] 38. Fix `user/rigistration/registration.component.html`

  **Current (line 86–87):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" mat-button class="btn btn-block wlt-c-furg-btn-primary mb-3"
    [disabled]="registerForm.invalid">Register</button>
  ```
  **Special case:** Registration is always a new-user creation. No edit mode exists on this page.  
  **Fix:**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'" mat-button class="btn btn-block wlt-c-furg-btn-primary mb-3"
    [disabled]="registerForm.invalid">Register</button>
  ```
  **Files:** `src/app/modules/user/rigistration/registration.component.html`

---

### Group L — Inventory: Material Issue and Purchase Bills (isEdit boolean)

---

- [ ] 39. Fix `inventory/material-issue/material-issue.component.html`

  **Current (line 174–177):**
  ```html
  <button *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'" 
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Mode variable:** `isEdit` boolean (confirmed in TS).  
  **Fix:**
  ```html
  <button *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
      || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))" 
  class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Note:** The button label is always "Save" but apply the mode-split based on `isEdit`. Consider also updating the label to `{{isEdit ? 'Update' : 'Save'}}` for consistency, but this is optional.  
  **Files:** `src/app/modules/inventory/material-issue/material-issue.component.html`

---

- [ ] 40. Fix `inventory/purchase-bills/purchase-bills.component.html`

  **Current (line 243–245):**
  ```html
  <button
    *ngIf="this.userAccessModel.createAccess == true || this.userAccessModel.updateAccess == true || currentUser == 'superadmin'"
    class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Mode variable:** `isEdit` boolean (confirmed in TS).  
  **Fix:**
  ```html
  <button
    *ngIf="(!isEdit && (this.userAccessModel.createAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))
        || (isEdit && (this.userAccessModel.updateAccess == true || currentUser == 'superadmin' || currentUser == 'admin'))"
    class="btn wlt-c-furg-btn-primary"> Save</button>
  ```
  **Files:** `src/app/modules/inventory/purchase-bills/purchase-bills.component.html`

---

## Verification

After all fixes are applied, run the Angular build to ensure there are no template compilation errors:

```
cd "c:\Users\admin\Documents\India FWG\OBMSINDIA-UI"
ng build --configuration=production
```

Expected: Build completes with 0 errors. Template type-checking will surface any typos in variable names introduced during the fix.

For runtime verification, test with a user account that has:
- Only `createAccess = true`, `updateAccess = false` for a given page → New button visible on new form, NOT visible when editing an existing record
- Only `updateAccess = true`, `createAccess = false` for a given page → Update button visible when editing, NOT visible on new form
- `superadmin` or `admin` → buttons always visible in both modes

---

## Summary Table

| # | File (relative to src/app/modules/) | Group | Mode Variable | Fix Type |
|---|-------------------------------------|-------|---------------|----------|
| 1 | master/socso-slab/new-socso-slab/new-socso-slab.component.html | A | `socsoForm.get('socso_id')?.value` | ID-based split |
| 2 | master/sip-slab/new-sip-slab/new-sip-slab.component.html | A | `sipForm.get('SIP_id')?.value` | ID-based split |
| 3 | master/epf-slab/new-epf-slab/new-epf-slab.component.html | A | `epfForm.get('epf_id')?.value` | ID-based split |
| 4 | master/salary-slab/new-salary-slab/new-salary-slab.component.html | A | `salaryID` (component property) | ID-based split |
| 5 | master/income-tax-slab/new-income-tax-slab/new-income-tax-slab.component.html | A | `incomeTaxForm.get('IT_ID')?.value` | ID-based split + fix Cancel button |
| 6 | administration/bank-list/new-bank-list/new-bank-list.component.html | A | `bankListForm.get('ID')?.value` | ID-based split |
| 7 | administration/bank-master/new-bank-master/new-bank-master.component.html | A | `bankMasterForm.get('ID')?.value` | ID-based split |
| 8 | administration/user-bank-access/new-user-bank-access/new-user-bank-access.component.html | A | `userBankAccessTitle` | title-string split |
| 9 | administration/user-branch-access/new-user-branch-access/new-user-branch-access.component.html | A | `userBranchAccessTitle` | title-string split |
| 10 | master/client-master/new-client/new-client-master.component.html | A | `clientForm.get('Id')?.value` | ID-based split |
| 11 | payroll/misc-transctions/new-misc-transactions/new-misc-transactions.component.html | A | `miscTransForm.get('ID')?.value` | ID-based split |
| 12 | finance/legal-demand-action/new-legal-demand-action/new-legal-demand-action.component.html | B | `isEdit` | isEdit split |
| 13 | master/employee-master/new-employee/new-employee.component.html | B | `isEdit` | isEdit split |
| 14 | inventory/asset-master/new-asset/new-asset.component.html | B | `isEdit` | isEdit split |
| 15 | inventory/category-master/new-catergory/new-catergory.component.html | B | `isEdit` | isEdit split |
| 16 | inventory/item-master/new-item/new-item.component.html | B | `isEdit` | isEdit split |
| 17 | inventory/recepient-master/new-recepient/new-recepient.component.html | B | `isEdit` | isEdit split |
| 18 | inventory/supplier-master/new-supplier/new-supplier.component.html | B | `isEdit` | isEdit split |
| 19 | quotation-and-agreement/agreement-termination/new-agreement-termination/new-agreement-termination.component.html | B | `isEdit` | isEdit split |
| 20 | payroll/employee-loan/new-employee-loan.component.html | B | `isEdit` | isEdit split |
| 21 | payroll/employee-uniform-loan/new-employee-uniform-loan.component.html | B | `isEdit` | isEdit split |
| 22 | finance/receipts/new-receipt/new-receipt.component.html | C | `receiptID` | ID>0 split |
| 23 | finance/payments/payments.component.html | C | `paymentID` | ID>0 split |
| 24 | finance/invoice/invoice.component.html | C | `isEditMode` | isEditMode split |
| 25 | inventory/utility-bills/utility-bills.component.html | C | `invoiceID` | ID>0 split |
| 26 | payroll/attendance/new-attendance/new-attendance.component.html | C | `attendanceForm.value.ID` | ID-based split + preserve dynamicEditable |
| 27 | payroll/new-employee-daily-advance/new-employee-daily-advance.component.html | C | `advanceID` | ID-based split |
| 28 | payroll/employee-monthly-advance/new-employee-monthly-advance/new-employee-monthly-advance.component.html | D | `employeeAdvanceTitleStatus` | title-string split |
| 29 | finance/invoice-recycle-bin/invoice-recycle-bin.component.html | E | always-update | updateAccess only |
| 30 | finance/payments-recycle-bin/payments-recycle-bin.component.html | E | always-update | updateAccess only (2 occurrences) |
| 31 | finance/cheque-status/cheque-status.component.html | F | always-update | updateAccess only |
| 32 | finance/finance-cheque-master/finance-cheque-master.component.html | F | always-create | createAccess only |
| 33 | finance/batch-invoice/batch-invoice.component.html | G | always-create | createAccess only |
| 34 | payroll/salary-processing/salary-processing.component.html | G | always-create | createAccess only |
| 35 | master/employee-transfer/employee-transfer.component.html | H | always-create | createAccess only |
| 36 | administration/cheque-master/new-cheque-master/new-cheque-master.component.html | I | confirm in TS | createAccess only (check TS first) |
| 37 | Accounting/acc-gl-data-list/acc-gl-data-list.component.html | J | always-create (Save) / always-update (Delete) | split by button type |
| 38 | user/rigistration/registration.component.html | K | always-create | createAccess only |
| 39 | inventory/material-issue/material-issue.component.html | L | `isEdit` | isEdit split |
| 40 | inventory/purchase-bills/purchase-bills.component.html | L | `isEdit` | isEdit split |
