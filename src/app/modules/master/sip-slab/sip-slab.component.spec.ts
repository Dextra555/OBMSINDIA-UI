import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SipSlabComponent } from './sip-slab.component';

describe('SipSlabComponent', () => {
  let component: SipSlabComponent;
  let fixture: ComponentFixture<SipSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SipSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SipSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
