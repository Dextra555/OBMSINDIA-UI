import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSalarySlabComponent } from './new-salary-slab.component';

describe('NewSalarySlabComponent', () => {
  let component: NewSalarySlabComponent;
  let fixture: ComponentFixture<NewSalarySlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewSalarySlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewSalarySlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
