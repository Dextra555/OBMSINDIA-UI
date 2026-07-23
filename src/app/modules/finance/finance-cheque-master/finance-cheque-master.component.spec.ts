import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceChequeMasterComponent } from './finance-cheque-master.component';

describe('FinanceChequeMasterComponent', () => {
  let component: FinanceChequeMasterComponent;
  let fixture: ComponentFixture<FinanceChequeMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinanceChequeMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceChequeMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
