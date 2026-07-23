import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditNoteSummaryComponent } from './credit-note-summary.component';

describe('CreditNoteSummaryComponent', () => {
  let component: CreditNoteSummaryComponent;
  let fixture: ComponentFixture<CreditNoteSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditNoteSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditNoteSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
