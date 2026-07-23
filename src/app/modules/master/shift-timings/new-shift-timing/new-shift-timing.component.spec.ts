import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewShiftTimingComponent } from './new-shift-timing.component';

describe('NewShiftTimingComponent', () => {
  let component: NewShiftTimingComponent;
  let fixture: ComponentFixture<NewShiftTimingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewShiftTimingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewShiftTimingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
