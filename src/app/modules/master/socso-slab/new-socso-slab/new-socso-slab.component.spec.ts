import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSocsoSlabComponent } from './new-socso-slab.component';

describe('NewSocsoSlabComponent', () => {
  let component: NewSocsoSlabComponent;
  let fixture: ComponentFixture<NewSocsoSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewSocsoSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewSocsoSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
