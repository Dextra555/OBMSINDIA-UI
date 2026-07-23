import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentVoucherSummaryComponent } from './payment-voucher-summary.component';

describe('PaymentVoucherSummaryComponent', () => {
  let component: PaymentVoucherSummaryComponent;
  let fixture: ComponentFixture<PaymentVoucherSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentVoucherSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentVoucherSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
