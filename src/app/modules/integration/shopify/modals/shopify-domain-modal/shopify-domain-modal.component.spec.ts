import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ShopifyDomainModalComponent } from './shopify-domain-modal.component';

describe('ShopifyDomainModalComponent', () => {
  let component: ShopifyDomainModalComponent;
  let fixture: ComponentFixture<ShopifyDomainModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopifyDomainModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopifyDomainModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('normalizeDomain', () => {
    it('appends .myshopify.com to a bare store name', () => {
      expect(component.normalizeDomain('mystore')).toBe('mystore.myshopify.com');
    });

    it('leaves a fully qualified domain unchanged', () => {
      expect(component.normalizeDomain('mystore.myshopify.com')).toBe('mystore.myshopify.com');
    });

    it('strips https:// prefix', () => {
      expect(component.normalizeDomain('https://mystore.myshopify.com')).toBe('mystore.myshopify.com');
    });

    it('strips http:// prefix and appends suffix when missing', () => {
      expect(component.normalizeDomain('http://mystore')).toBe('mystore.myshopify.com');
    });

    it('strips trailing slash', () => {
      expect(component.normalizeDomain('mystore.myshopify.com/')).toBe('mystore.myshopify.com');
    });

    it('lowercases the domain', () => {
      expect(component.normalizeDomain('MyStore')).toBe('mystore.myshopify.com');
    });

    it('trims surrounding whitespace', () => {
      expect(component.normalizeDomain('  mystore  ')).toBe('mystore.myshopify.com');
    });
  });
});
