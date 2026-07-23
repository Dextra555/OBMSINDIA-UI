import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearlyPaySheetComponent } from './yearly-pay-sheet.component';

describe('YearlyPaySheetComponent', () => {
  let component: YearlyPaySheetComponent;
  let fixture: ComponentFixture<YearlyPaySheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YearlyPaySheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YearlyPaySheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
