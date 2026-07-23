import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalarySlabComponent } from './salary-slab.component';

describe('SalarySlabComponent', () => {
  let component: SalarySlabComponent;
  let fixture: ComponentFixture<SalarySlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalarySlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SalarySlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
