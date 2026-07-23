import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptVoucherSummaryComponent } from './receipt-voucher-summary.component';

describe('ReceiptVoucherSummaryComponent', () => {
  let component: ReceiptVoucherSummaryComponent;
  let fixture: ComponentFixture<ReceiptVoucherSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptVoucherSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptVoucherSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
