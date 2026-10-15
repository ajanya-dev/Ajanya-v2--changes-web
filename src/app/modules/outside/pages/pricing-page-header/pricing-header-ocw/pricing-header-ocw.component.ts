
import { NgStyle } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pricing-header-ocw',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './pricing-header-ocw.component.html',
  styleUrl: './pricing-header-ocw.component.scss'
})
export class PricingHeaderOcwComponent {

  @ViewChild('navMenu') navMenu!: ElementRef;
  @ViewChild('toggleMenu') toggleMenu!: ElementRef;
  @ViewChild('closeMenu') closeMenu!: ElementRef;

  height = window.innerHeight;
  width = window.innerWidth;

  constructor(private router: Router) { }

  industries = [
    { name: 'Government', url: 'https://onlinecheckwriter.com/government-payment/' },
    { name: 'Utilities', url: 'https://onlinecheckwriter.com/utility-payments/' },
    { name: 'Medical Practices', url: 'https://onlinecheckwriter.com/medical-practices/' },
    { name: 'Legal Service', url: 'https://onlinecheckwriter.com/law-firms/' },
    { name: 'Hospitals', url: 'https://onlinecheckwriter.com/health-care-accounting-software/' },
    { name: 'Education', url: 'https://onlinecheckwriter.com/education/' },
    { name: 'Call Centers', url: 'https://onlinecheckwriter.com/call-center-payments/' },
    { name: 'Insurance', url: 'https://onlinecheckwriter.com/insurance-payments/' },
    { name: 'Mass Transit', url: 'https://onlinecheckwriter.com/mass-transit/' },
    { name: 'Nonprofits', url: 'https://onlinecheckwriter.com/nonprofits/' },
    { name: 'Membership Clubs', url: 'https://onlinecheckwriter.com/membership-club/' },
    { name: 'Retail', url: 'https://onlinecheckwriter.com/retailers/' },
    { name: 'Real Estate', url: 'https://onlinecheckwriter.com/real-estate-business-accounting/' },
    { name: 'Billing Service', url: 'https://onlinecheckwriter.com/bill-pay-service/' }
  ];

  accountsPayable = [
    { name: 'Send Payment', url: 'https://onlinecheckwriter.com/send-payment/' },
    { name: 'Receive Payments', url: 'https://onlinecheckwriter.com/receive-payment/' },
    { name: 'Bill Payments', url: 'https://onlinecheckwriter.com/bill-payment/' },
    { name: 'Mass/Bulk Payments', url: 'https://onlinecheckwriter.com/bulk-payment/' },
    { name: 'Print Checks Yourself Now', url: 'https://onlinecheckwriter.com/print-checks/' },
    { name: 'Mail Check USPS/FedEx', url: 'https://onlinecheckwriter.com/check-mailing/' },
    { name: 'eChecks', url: 'https://onlinecheckwriter.com/echeck/' },
    { name: 'Invoice Management', url: 'https://onlinecheckwriter.com/invoice-management/' },
    { name: 'Integrations', url: 'https://onlinecheckwriter.com/integration/' },
    { name: 'ACH/Direct Deposit', url: 'https://onlinecheckwriter.com/ach-payment/' },
    { name: 'Domestic Wire', url: 'https://onlinecheckwriter.com/domestic-wire-transfer/' },
    { name: 'International Payments', url: 'https://onlinecheckwriter.com/international-payments/' },
    { name: 'Virtual Card', url: 'https://onlinecheckwriter.com/virtual-card/' },
    { name: 'Pay By Credit Card', url: 'https://onlinecheckwriter.com/pay-by-credit-card/' },
    { name: 'Payroll by Credit Card', url: 'https://onlinecheckwriter.com/payroll-by-credit-card/' },
    { name: 'Overnight Check Mail', url: 'https://onlinecheckwriter.com/overnight-check-mailing/' },
    { name: 'Email to Bill', url: 'https://onlinecheckwriter.com/email-to-bill/' }
  ];

  accountsReceivable = [
    { name: 'Request Payments', url: 'https://onlinecheckwriter.com/request-payment/' },
    { name: 'Send Payment Links', url: 'https://onlinecheckwriter.com/payment-link/' },
    { name: 'Check Draft', url: 'https://onlinecheckwriter.com/check-draft/' },
    { name: 'Deposit Slip', url: 'https://onlinecheckwriter.com/deposit-slip/' },
    { name: 'Invoice Management', url: 'https://onlinecheckwriter.com/invoice-management/' }
  ];

  businessTools = [
    { name: 'Digital Wallet', url: 'https://onlinecheckwriter.com/digital-wallet/' },
    { name: 'Positive Pay', url: 'https://onlinecheckwriter.com/positive-pay/' },
    { name: 'User Access', url: 'https://onlinecheckwriter.com/user-access/' },
    { name: 'Integration', url: 'https://onlinecheckwriter.com/integration/' },
    { name: 'Virtual Card API', url: 'https://onlinecheckwriter.com/virtual-card-api/' },
    { name: 'Document Mailing', url: 'https://onlinecheckwriter.com/document-mailing/' },
    { name: 'Shipping Label', url: 'https://onlinecheckwriter.com/shipping-label' },
    { name: 'Expense Management', url: 'https://zilmoney.com/business-expenses/' },
    { name: 'Bank Data', url: 'https://onlinecheckwriter.com/bank-data/' },
    { name: 'Bank Reconciliation', url: 'https://onlinecheckwriter.com/bank-reconciliation/' },
    { name: 'Developer API', url: 'https://onlinecheckwriter.com/online-check-writer-api/' },
    { name: 'Enterprise', url: 'https://onlinecheckwriter.com/white-label/' },
    { name: 'All', url: 'https://onlinecheckwriter.com/business-tools/' }
  ];

  integrations = [
    { name: 'QuickBooks Online', url: 'https://onlinecheckwriter.com/quickbooks-online-integration/' },
    { name: 'QuickBooks Desktop', url: 'https://onlinecheckwriter.com/quickbooks-desktop-integration/' },
    { name: 'Zoho Books', url: 'https://onlinecheckwriter.com/zoho-books/' },
    { name: 'Zoho Payroll', url: 'https://onlinecheckwriter.com/zoho-payroll/' },
    { name: 'View All', url: 'https://onlinecheckwriter.com/integration/' }
  ];

  // Redirect function
  redirectWithCurrentRoute(): void {
    const currentRoute = this.router.url;
    const encodedRoute = encodeURIComponent(currentRoute);
    const newUrl = `https://live.onlinecheckwriter.com/outside/pricing-plan?from=ocw&page=${encodedRoute}`;
    window.location.href = newUrl;
  }

  // Toggle menu visibility
  showMenu(): void {
    this.navMenu?.nativeElement?.classList.add('ocw_show__menu');
  }

  hideMenu(): void {
    this.navMenu.nativeElement.classList.remove('ocw_show__menu');
  }

  // Toggle dropdown and close other open dropdowns
  toggleDropdown(dropdown: HTMLElement): void {
    dropdown.classList.toggle('active');
    this.closeOpenedDropdowns(dropdown);
  }

  // Close all dropdowns except the one currently clicked
  closeOpenedDropdowns(currentDropdown: HTMLElement): void {
    const dropdownMenus = document.querySelectorAll('.ocw_dropdown');
    dropdownMenus.forEach((dropdown) => {
      if (dropdown !== currentDropdown && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
      }
    });
  }

  onClick(url: string): void {
    window.open(url, '_blank');
  }

  bookDemo(): void {
    window.open('https://calendly.com/zmn/demo?utm_source=ocw-header&utm_campaign=pricing', '_blank');
  }

  buttonClick(type: string) {
    window.open(`https://live.onlinecheckwriter.com/${type}`, '_blank');
  }

}