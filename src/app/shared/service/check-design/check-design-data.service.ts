import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditCheckDesignService {
  staticElements = [
    {
      id: "static['pay_to_the_order']",
      name: 'Pay to the Order of',
      type: 'main',
      sub_items: [
        {
          name: 'With Line',
          type: 'line',
          wLine:
            'PAY TO THE\nORDER OF  ____________________________________________________',
          woLine: 'PAY TO THE\nORDER OF'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['date']",
      name: 'Date',
      type: 'main',
      sub_items: [
        {
          name: 'With Line',
          type: 'line',
          wLine: 'DATE ____________',
          woLine: 'DATE'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['dollar']",
      name: 'Dollars',
      type: 'main',
      sub_items: [
        {
          name: 'With Line',
          type: 'line',
          wLine:
            '_________________________________________________________________________________ DOLLARS',
          woLine:
            '                                                                                                                                                                   DOLLARS'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['memo']",
      name: 'Memo',
      type: 'main',
      sub_items: [
        {
          name: 'With Line',
          type: 'line',
          wLine: 'MEMO __________________________________________',
          woLine: 'MEMO'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['signature']",
      name: 'Signature Line',
      type: 'main',
      sub_items: [
        {
          name: 'With MP',
          type: 'signature_mp'
        },
        {
          name: 'With Authorized',
          type: 'signature_authorized'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['void_after']",
      name: 'Void After',
      type: 'main',
      sub_items: [
        {
          name: 'Days',
          days: 90,
          type: 'days'
        },
        {
          name: 'Bold',
          type: 'bold'
        },
        {
          name: 'Italic',
          type: 'italic'
        },
        {
          name: 'Underline',
          type: 'underline'
        }
      ]
    },
    {
      id: "static['amount_box_sign']",
      name: '$ Box',
      type: 'amount_box_main',
      sub_items: [
        {
          id: "static['amount_box_sign']",
          name: '$ Sign',
          type: 'main'
        },
        {
          id: "static['amount_box_box']",
          name: 'With Box',
          type: 'main'
        },
        {
          id: "static['amount_box_line']",
          name: 'With Line',
          type: 'main'
        }
      ]
    },
    {
      id: "static['check_no']",
      name: 'Check Number',
      type: 'main'
    }
  ];

  dynamicElements = [
    {
      id: "dynamic['bank_account_routing_no']",
      name: 'Routing Number',
      type: 'main'
    },
    {
      name: 'Stub 1',
      type: 'stub',
      txt: 1
    },
    {
      name: 'Stub 2',
      type: 'stub',
      txt: 2
    },
    {
      name: 'Your Name/Business Name',
      type: 'business_name'
    },
    {
      name: 'Your Address/Business Address',
      type: 'business_address'
    },
    {
      name: 'Check Number',
      type: 'check_no',
      txt: '<Check No>'
    },
    {
      name: 'Date',
      type: 'date'
    },
    {
      name: 'Bank Name',
      type: 'bank_name'
    },
    {
      name: 'Amount in Digit',
      type: 'amount_digit',
      txt: '<000.00>'
    },
    {
      name: 'Amount in Words',
      type: 'amount_word',
      txt: '<Zero Zero Zero and 00/100*****>'
    },
    {
      name: 'Memo',
      type: 'memo',
      txt: '<Memo>'
    },
    {
      name: 'Note',
      type: 'note',
      txt: '<Note>'
    },
    {
      name: 'QR Code',
      type: 'qrcode',
      txt: '<QR CODE>'
    },
    {
      name: 'Pay to Name',
      type: 'payto_name',
      txt: '<Pay to Name>'
    },
    {
      name: 'Company Name',
      type: 'payto_company_name',
      txt: '<Pay to Company Name>'
    },
    {
      name: 'Pay to Address (1 Line)',
      type: 'payto_address_1line',
      txt: '<Pay to Address, City, ST, ZIP>'
    },
    {
      name: 'Pay to Address (2 Line)',
      type: 'payto_address_2line',
      txt: '<Pay to Address>,\n<City, ST, ZIP>'
    },
    {
      name: 'Pay to Address (3 Line)',
      type: 'payto_address_3line',
      txt: '<Pay to Address 1>,\n<Pay to Address 2 >,\n<City, ST, ZIP>'
    },
    {
      name: 'Account Number',
      type: 'payto_account_no',
      txt: '<Account No>'
    },
    {
      name: 'Invoice Number',
      type: 'payto_invoice_no',
      txt: '<Invoice No>'
    },
    {
      name: 'Fractional Number',
      type: 'fractional_no'
    },
    {
      name: 'Window Env From Address',
      type: 'envelop_window_address_from'
    },
    {
      name: 'Window Env To Address',
      type: 'envelop_window_address_to'
    }
  ];

  dynamicRemittance = [
    {
      name: 'Remittance Stub Date',
      type: 'remittance_stub_date',
      txt: 'currentDate',
      pos: { top: 300, left: 30 }
    },
    {
      name: 'Stub Invoice ID',
      type: 'remittance_stub_invoice_id',
      txt: '<InvoiceID#>',
      pos: { top: 340, left: 30 }
    },
    {
      name: 'Remittance Stub Item',
      type: 'remittance_stub_item',
      txt: '<Item>',
      pos: { top: 340, left: 120 }
    },
    {
      name: 'Remittance Stub Descripion',
      type: 'remittance_stub_description',
      txt: '<Description>',
      pos: { top: 340, left: 230 }
    },
    {
      name: 'Remittance Stub Quantity',
      type: 'remittance_stub_quantity',
      txt: '<Quantity>',
      pos: { top: 340, left: 430 }
    },
    {
      name: 'Remittance Stub Cost',
      type: 'remittance_stub_unit_cost',
      txt: '<UnitCost>',
      pos: { top: 340, left: 500 }
    },
    {
      name: 'Remittance Stub Total',
      type: 'remittance_stub_total',
      txt: '<Total>',
      pos: { top: 340, left: 580 }
    },
    {
      name: 'Remittance Stub Payee',
      type: 'remittance_stub_payee',
      txt: '<Pay to Name>',
      pos: { top: 500, left: 300 }
    },
    {
      name: 'Remittance Stub Memo',
      type: 'remittance_stub_memo',
      txt: '<Memo>',
      pos: { top: 500, left: 30 }
    },
    {
      name: 'Remittance Stub Amount',
      type: 'remittance_stub_amount',
      txt: '<000.00>',
      pos: { top: 500, left: 550 }
    },
    {
      name: 'Stub Check No',
      type: 'remittance_stub_serial',
      txt: '<Check No>',
      pos: { top: 300, left: 590 }
    }
  ];
}
