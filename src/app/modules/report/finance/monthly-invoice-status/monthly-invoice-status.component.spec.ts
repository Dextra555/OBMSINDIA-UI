import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyInvoiceStatusComponent } from './monthly-invoice-status.component';

describe('MonthlyInvoiceStatusComponent', () => {
  let component: MonthlyInvoiceStatusComponent;
  let fixture: ComponentFixture<MonthlyInvoiceStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyInvoiceStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyInvoiceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
