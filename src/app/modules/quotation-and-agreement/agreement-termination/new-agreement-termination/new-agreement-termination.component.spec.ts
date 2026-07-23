import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAgreementTerminationComponent } from './new-agreement-termination.component';

describe('NewAgreementTerminationComponent', () => {
  let component: NewAgreementTerminationComponent;
  let fixture: ComponentFixture<NewAgreementTerminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewAgreementTerminationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAgreementTerminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
