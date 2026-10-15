import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterTransactionsComponent } from './inter-transactions.component';

describe('InterTransactionsComponent', () => {
  let component: InterTransactionsComponent;
  let fixture: ComponentFixture<InterTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterTransactionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InterTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
