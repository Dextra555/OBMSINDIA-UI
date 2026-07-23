import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChequeStatusReportComponent } from './cheque-status-report.component';

describe('ChequeStatusReportComponent', () => {
  let component: ChequeStatusReportComponent;
  let fixture: ComponentFixture<ChequeStatusReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChequeStatusReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChequeStatusReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
