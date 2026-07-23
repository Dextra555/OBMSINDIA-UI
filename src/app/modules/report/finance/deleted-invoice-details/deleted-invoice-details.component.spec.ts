import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedInvoiceDetailsComponent } from './deleted-invoice-details.component';

describe('DeletedInvoiceDetailsComponent', () => {
  let component: DeletedInvoiceDetailsComponent;
  let fixture: ComponentFixture<DeletedInvoiceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeletedInvoiceDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletedInvoiceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
