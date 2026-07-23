import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchStockLedgerComponent } from './branch-stock-ledger.component';

describe('BranchStockLedgerComponent', () => {
  let component: BranchStockLedgerComponent;
  let fixture: ComponentFixture<BranchStockLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BranchStockLedgerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BranchStockLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
