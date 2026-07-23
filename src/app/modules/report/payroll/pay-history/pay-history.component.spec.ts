import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayHistoryComponent } from './pay-history.component';

describe('PayHistoryComponent', () => {
  let component: PayHistoryComponent;
  let fixture: ComponentFixture<PayHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PayHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
