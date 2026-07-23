import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocsoSlabComponent } from './socso-slab.component';

describe('SocsoSlabComponent', () => {
  let component: SocsoSlabComponent;
  let fixture: ComponentFixture<SocsoSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocsoSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocsoSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
