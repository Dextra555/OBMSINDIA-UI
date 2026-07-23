import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementTerminationComponent } from './agreement-termination.component';

describe('AgreementTerminationComponent', () => {
  let component: AgreementTerminationComponent;
  let fixture: ComponentFixture<AgreementTerminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgreementTerminationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgreementTerminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
