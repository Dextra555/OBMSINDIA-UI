import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceAgeingComponent } from './invoice-ageing.component';

describe('InvoiceAgeingComponent', () => {
  let component: InvoiceAgeingComponent;
  let fixture: ComponentFixture<InvoiceAgeingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceAgeingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceAgeingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
