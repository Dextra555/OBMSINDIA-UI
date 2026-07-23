import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceCollectionStatusReportComponent } from './invoice-collection-status-report.component';

describe('InvoiceCollectionStatusReportComponent', () => {
  let component: InvoiceCollectionStatusReportComponent;
  let fixture: ComponentFixture<InvoiceCollectionStatusReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceCollectionStatusReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceCollectionStatusReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
