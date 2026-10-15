import { AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-pricing-header-zilmoney',
  standalone: true,
  imports: [],
  templateUrl: './pricing-header-zilmoney.component.html',
  styleUrl: './pricing-header-zilmoney.component.scss'
})
export class PricingHeaderZilmoneyComponent implements AfterViewInit {

  accountsPayable = [
    { name: 'Send Payments', url: 'https://zilmoney.com/send-money-online/' },
    { name: 'Bill Payment', url: 'https://zilmoney.com/bill-payment/' },
    { name: 'Mass/Bulk Payments', url: 'https://zilmoney.com/make-payment/' },
    { name: 'Print Checks Yourself Now', url: 'https://zilmoney.com/print-checks/' },
    { name: 'Mail Checks USPS/FedEx', url: 'https://zilmoney.com/check-mailing/' },
    { name: 'eChecks', url: 'https://zilmoney.com/echecks/' },
    { name: 'International Payments', url: 'https://zilmoney.com/international-payments/' },
    { name: 'ACH/Direct Deposit', url: 'https://zilmoney.com/ach-payment/' },
    { name: 'Real Time Payments', url: 'https://zilmoney.com/rtp/' },
    { name: 'Virtual Card', url: 'https://zilmoney.com/virtual-card-api/' },
    { name: 'Pay Vendor By Credit Card', url: 'https://zilmoney.com/pay-by-credit-card/' },
    { name: 'Pay Rent by Credit Card', url: 'https://zilmoney.com/pay-rent-with-credit-card/' },
    { name: 'Pay Payroll by Credit Card', url: 'https://zilmoney.com/payroll-by-credit-card/' },
    { name: 'Wire Transfer', url: 'https://zilmoney.com/wire-transfer/' },
    { name: 'Email to Bill', url: 'https://zilmoney.com/bill-inbox' },
  ];

  accountsReceivable = [
    { name: 'Receive Payment', url: 'https://zilmoney.com/receive-payment/' },
    { name: 'Request Payments', url: 'https://zilmoney.com/get-my-payment/' },
    { name: 'Invoice Automation', url: 'https://zilmoney.com/invoice-management/' },
    { name: 'Check Draft', url: 'https://zilmoney.com/check-draft/' },
    { name: 'Deposit Slip', url: 'https://zilmoney.com/deposit-slip/' },
  ];

  tools = [
    { name: 'Payment Solution', url: 'https://zilmoney.com/online-banking/' },
    { name: 'Send Payment', url: 'https://zilmoney.com/make-payment/' },
    { name: 'Receive Payments', url: 'https://zilmoney.com/receive-payment/' }
  ];

  headerItems = [
    { name: 'Pricing', url: '#', id: 'redirect-pricing' }, // '#' used for pointer; 'id' for redirect functionality
    { name: 'FAQ', url: 'https://zilmoney.com/faq/' },
    { name: 'About Us', url: 'https://zilmoney.com/about/' },
    { name: 'Contact', url: 'https://zilmoney.com/contact/' },
    // { name: 'API', url: 'https://zilmoney.com/zil-money-api/' },
    // { name: "What's New", url: 'https://zilmoney.com/whats-new/' },
    // { name: 'Integration', url: 'https://zilmoney.com/integration/' },
  ];


  otherCapabilities = [
    { name: 'Integrations', url: 'https://zilmoney.com/integration/' },
    { name: 'Digital Wallet', url: 'https://zilmoney.com/digital-wallet/' },
    { name: 'Developer API', url: 'https://zilmoney.com/zil-money-api/' },
    { name: 'Positive Pay', url: 'https://zilmoney.com/positive-pay/' },
    { name: 'Shipping Label', url: 'https://zilmoney.com/shipping-label/' },
    { name: 'Document Mailing', url: 'https://zilmoney.com/document-mailing/' },
  ];

  industries = [
    { name: 'Government', url: 'https://zilmoney.com/government-payments/' },
    { name: 'Utilities', url: 'https://zilmoney.com/utility-payments/' },
    { name: 'Healthcare Industry', url: 'https://zilmoney.com/medical-practices/' },
    { name: 'Education', url: 'https://zilmoney.com/education-industry-payments/' },
    { name: 'Call Centers', url: 'https://zilmoney.com/call-center-payments/' },
    { name: 'Insurance', url: 'https://zilmoney.com/insurance/' },
    { name: 'Mass Transit', url: 'https://zilmoney.com/mass-transit/' },
    { name: 'Membership Clubs', url: 'https://zilmoney.com/membership-club-payments/' },
    { name: 'Retail', url: 'https://zilmoney.com/retail/' },
    { name: 'Billing Services', url: 'https://zilmoney.com/billing-service/' },
    { name: 'Professional Services', url: 'https://zilmoney.com/professional-services/' },
    { name: 'Food & Beverage', url: 'https://zilmoney.com/food-and-beverage/' },
    { name: 'Wine & Spirits', url: 'https://zilmoney.com/wine-and-spirits/' },
    { name: 'Construction', url: 'https://zilmoney.com/construction-payments/' },
    { name: 'Charitable', url: 'https://zilmoney.com/charitable-giving/' },
    { name: 'Logistics', url: 'https://zilmoney.com/logistics-payments/' },
    { name: 'Wholesale', url: 'https://zilmoney.com/wholesale-payments/' },
  ];

  isOpen = false;

  bookDemo(): void {
    window.open('https://calendly.com/zmn/demo?utm_source=zm-heade&utm_campaign=pricing', '_blank');
  }

  @ViewChild('menuProducts') productList!: ElementRef;
  @ViewChild('mobileMenu') mobileProductList!: ElementRef;
  @ViewChild('megaBox') megaBox!: ElementRef;
  @ViewChild('showMega') showMegaCheckbox!: ElementRef;

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  ngAfterViewInit() {
    this.renderer.listen(document, 'click', (event) => this.onDocumentClick(event));
  }

  onProductListClick(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      this.toggleMenu();
    }
  }

  onMobileProductListClick(event: Event): void {
    event.stopPropagation();
    this.isOpen = false;
    this.toggleMenu();
  }

  onShowMegaCheckboxChange(): void {
    this.megaBox.nativeElement.style.display = this.showMegaCheckbox.nativeElement.checked ? 'block' : 'none';
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    this.renderer.setStyle(this.productList.nativeElement, 'display', this.isOpen ? 'block' : 'none');
    this.renderer.setStyle(this.mobileProductList.nativeElement, 'display', this.isOpen ? 'block' : 'none');
    this.renderer.setStyle(this.megaBox.nativeElement, 'display', this.isOpen ? 'block' : 'none');
  }

  redirectWithCurrentRoute(): void {
    const currentRoute = encodeURIComponent(window.location.pathname + window.location.search);
    const newUrl = `https://app.zilmoney.com/outside/pricing-plan?from=zm&page=${currentRoute}`;
    window.location.href = newUrl;
  }

  onDocumentClick(event: PointerEvent): void {
    const targetDiv = this.elRef.nativeElement.querySelector('#mega');
    if (event.target !== targetDiv && !targetDiv.contains(event.target) && event.pointerType === 'touch') {
      if (window.innerWidth < 970 && this.isOpen) {
        this.isOpen = false;
        this.toggleMenu();
      } else if (this.isOpen) {
        this.toggleMenu();
      }
    }
  }



  onClick(url: string): void {
    if(url === '#'){
      return;
    }
    window.open(url, '_blank');
  }

  buttonClick(type: string) {
    window.open(`https://app.zilmoney.com/${type}`, '_blank');
  }

  toggleMenuSection(event: Event): void {
    const heading = event.currentTarget as HTMLElement;
    const menuItem = heading.closest('.ocw_menu_item');
    
    if (menuItem) {
      menuItem.classList.toggle('expanded');
      heading.classList.toggle('active');
    }
  }

}
