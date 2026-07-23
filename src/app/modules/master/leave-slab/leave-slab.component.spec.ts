import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveSlabComponent } from './leave-slab.component';

describe('LeaveSlabComponent', () => {
  let component: LeaveSlabComponent;
  let fixture: ComponentFixture<LeaveSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeaveSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
