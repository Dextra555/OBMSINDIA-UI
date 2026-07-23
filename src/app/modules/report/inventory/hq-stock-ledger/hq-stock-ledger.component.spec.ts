import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HQStockLedgerComponent } from './hq-stock-ledger.component';

describe('HQStockLedgerComponent', () => {
  let component: HQStockLedgerComponent;
  let fixture: ComponentFixture<HQStockLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HQStockLedgerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HQStockLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
