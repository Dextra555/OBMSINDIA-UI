import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchCollectionsComponent } from './branch-collections.component';

describe('BranchCollectionsComponent', () => {
  let component: BranchCollectionsComponent;
  let fixture: ComponentFixture<BranchCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BranchCollectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BranchCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
