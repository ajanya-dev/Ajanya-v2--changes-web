export class addPayeeData {
  static loadDefaultPayMethod(): { value: string; name: string }[] {
    return [
      { value: '1', name: 'Printable Check' },
      { value: '2', name: 'Mail Check by USPS' },
      { value: '3', name: 'Direct Deposit' },
      { value: '4', name: 'Email Check' }
    ];
  }

  static loadBankAccountType(): any[] {
    return [
      { value: 'CHECKING', name: 'CHECKING' },
      { value: 'BUSINESS', name: 'BUSINESS' },
      { value: 'SAVINGS', name: 'SAVINGS' }
    ];
  }

  static loadvendor_1099(): any[] {
    return [
      { value: '1', name: 'Yes' },
      { value: '2', name: 'No' }
    ];
  }

  static loadCustomerType(): any[] {
    return [
      { value: '1', name: 'Individual' },
      { value: '2', name: 'Company' }
    ];
  }

  static loadvendorPaymentTerms(): any[] {
    return [
      { value: '1', name: 'Due upon receipt' },
      { value: '2', name: 'Net 15' },
      { value: '3', name: 'Net 10' },
      { value: '4', name: 'Net 5' }
    ];
  }

  static loadEmployeeType(): any[] {
    return [
      { value: '1', name: 'Salaried' },
      { value: '2', name: 'Paid by the Hour' },
      { value: '3', name: 'Contractor (1099)' }
    ];
  }

  static loadEmployeePaymentShedule(): any[] {
    return [
      { value: '1', name: 'Annually' },
      { value: '2', name: 'Quarterly' },
      { value: '3', name: 'Monthly' },
      { value: '4', name: 'Biweekly' },
      { value: '5', name: 'Weekly' }
    ];
  }

  static loadEmployeeFilingStatus(): any[] {
    return [
      { value: '1', name: 'Single' },
      { value: '2', name: 'Head of Household' },
      { value: '3', name: 'Widow(er)' },
      { value: '4', name: 'Married' },
      { value: '5', name: 'Married Filing Separately' }
    ];
  }
}
