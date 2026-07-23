import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaySheetComponent } from './pay-sheet.component';

describe('PaySheetComponent', () => {
  let component: PaySheetComponent;
  let fixture: ComponentFixture<PaySheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaySheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaySheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
