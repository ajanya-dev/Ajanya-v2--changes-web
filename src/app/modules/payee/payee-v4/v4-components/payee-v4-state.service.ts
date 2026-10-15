import { Injectable, computed, signal } from '@angular/core';

export type PayeePageType = 'vendor' | 'customer' | 'employee' | 'payee';

@Injectable({
  providedIn: 'root'
})
export class PayeeV4StateService {
  pageType = signal<PayeePageType>('vendor');
  lockTitleToPayees = signal(false);

  /** Payee id from `manage/payee/:id` — the list table filters down to it. */
  routePayeeId = signal<string | null>(null);


  lockPayeeType = signal(false);

  pageTitle = computed(() => {
    if (this.lockTitleToPayees()) {
      return 'Payees';
    }
    switch (this.pageType()) {
      case 'customer':
        return 'Customers';
      case 'employee':
        return 'Employees';
      case 'payee':
        return 'Payees';
      default:
        return 'Vendors and Contacts';
    }
  });

  /** Page-header subtitle — mirrors the Payments In/Out header pattern. */
  pageSubtitle = computed(() => {
    if (this.lockTitleToPayees()) {
      return 'Manage vendors, employees and customers, and pay or bill them directly';
    }
    switch (this.pageType()) {
      case 'customer':
        return 'Manage your customers and request payments from them';
      case 'employee':
        return 'Manage your employees and send them payments';
      case 'payee':
        return 'Manage vendors, employees and customers, and pay or bill them directly';
      default:
        return 'Manage your vendors and contacts, and send them payments';
    }
  });

  addButtonLabel = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'Add Customer';
      case 'employee':
        return 'Add Employee';
      case 'payee':
        return 'Add Payee';
      default:
        return 'Add Vendor';
    }
  });

  emptyStateTitle = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'No customers found';
      case 'employee':
        return 'No employees found';
      case 'payee':
        return 'No payees found';
      default:
        return 'No vendors found';
    }
  });

  importModalTitle = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'Import Customers';
      case 'employee':
        return 'Import Employee';
      case 'payee':
        return 'Import Payees';
      default:
        return 'Import Vendors/Contacts';
    }
  });

  importButtonTooltip = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'Import customers from a CSV file or a connected app';
      case 'employee':
        return 'Import employees from a CSV file or a connected app';
      case 'payee':
        return 'Import payees from a CSV file or a connected app';
      default:
        return 'Import vendors from a CSV file or a connected app';
    }
  });

  addButtonTooltip = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'Create a new customer with contact and bank details';
      case 'employee':
        return 'Create a new employee with contact and bank details';
      case 'payee':
        return 'Create a new payee with contact and bank details';
      default:
        return 'Create a new vendor with contact and bank details';
    }
  });

  payeeTypeId = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 1;
      case 'employee':
        return 3;
      default:
        return 2;
    }
  });

  /** Maps the current page type to the add-modal "Add as" option key. */
  payeeTypeName = computed(() => {
    switch (this.pageType()) {
      case 'customer':
        return 'customer';
      case 'employee':
        return 'employee';
      default:
        return 'vendor';
    }
  });
}
