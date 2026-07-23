import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSipSlabComponent } from './new-sip-slab.component';

describe('NewSipSlabComponent', () => {
  let component: NewSipSlabComponent;
  let fixture: ComponentFixture<NewSipSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewSipSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewSipSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
