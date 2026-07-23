import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementsDiscountReportComponent } from './agreements-discount-report.component';

describe('AgreementsDiscountReportComponent', () => {
  let component: AgreementsDiscountReportComponent;
  let fixture: ComponentFixture<AgreementsDiscountReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgreementsDiscountReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgreementsDiscountReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
