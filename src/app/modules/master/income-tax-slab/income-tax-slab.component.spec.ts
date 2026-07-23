import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeTaxSlabComponent } from './income-tax-slab.component';

describe('IncomeTaxSlabComponent', () => {
  let component: IncomeTaxSlabComponent;
  let fixture: ComponentFixture<IncomeTaxSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IncomeTaxSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IncomeTaxSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
