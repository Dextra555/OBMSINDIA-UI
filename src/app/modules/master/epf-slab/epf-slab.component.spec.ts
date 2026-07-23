import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpfSlabComponent } from './epf-slab.component';

describe('EpfSlabComponent', () => {
  let component: EpfSlabComponent;
  let fixture: ComponentFixture<EpfSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EpfSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EpfSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
