import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopifyHomeComponent } from './shopify-home.component';

describe('ShopifyHomeComponent', () => {
  let component: ShopifyHomeComponent;
  let fixture: ComponentFixture<ShopifyHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopifyHomeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopifyHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
