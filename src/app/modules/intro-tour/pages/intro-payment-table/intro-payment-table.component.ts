import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  faA,
  faArrowsRotate,
  faCalendar,
  faCaretDown,
  faEye,
  faList,
  faPrint,
  faR
} from '@fortawesome/pro-solid-svg-icons';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ActivatedRoute, Router } from '@angular/router';
import { IntroService } from '../../service/intro.service';

@Component({
  selector: 'app-intro-payment-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CommonButtonV35Component,
    FontAwesomeModule,
    DemoVideoComponent,
    DataRangeV35Component,
    MatMenuModule
  ],
  templateUrl: './intro-payment-table.component.html',
  styleUrl: './intro-payment-table.component.scss'
})
export class IntroPaymentTableComponent implements OnInit {
  private router = inject(Router);
  private introService = inject(IntroService);
  private activatedRoute = inject(ActivatedRoute);

  faA = faA;
  faR = faR;
  faEye = faEye;
  faList = faList;
  faPrint = faPrint;
  faCalendar = faCalendar;
  faCaretDown = faCaretDown;
  faArrowsRotate = faArrowsRotate;

  ngOnInit(): void {
    const { viewPayment } = this.activatedRoute.snapshot.queryParams;
    if (viewPayment) {
      const { amount, memo, issueDate, selectedPayee, payFrom, payAs } =
        this.introService.introForm.value;

      const rowObj = {
        payee: selectedPayee || 'Payee 1',
        amount: parseInt(amount as string, 10) || 12,
        memo: memo || 'Memo',
        created_by: 'User 1',
        reference_id: '1003',
        updated_at: issueDate || '02/20/2024',
        sourceType:
          (payFrom === 'bankaccount' ? 'BANK' : payFrom?.toUpperCase()) ||
          'BANK',
        type: payAs?.toUpperCase() || 'CHECK',
        status: 'Pending',
        view: 'Source'
      };
      this.rowData()[0] = rowObj;
    }
  }

  // HEADER ELEMENTS PROPERTIES
  public headerElements = signal<IV3DtHeaderElements>({
    headerText: 'Payments',
    videoButton: [
      {
        slug: 'v3Payment'
      }
    ],
    selectedPanelButton: 'all',
    panelButtons: [
      {
        name: 'All',
        id: 'all'
      },
      {
        name: 'Check',
        id: 'check'
      },
      {
        name: 'ACH',
        id: 'ach'
      },
      {
        name: 'Wire',
        id: 'wire'
      },
      {
        name: 'Virtual Card',
        id: 'virtualCard'
      }
    ],
    buttons: [
      {
        text: 'New',
        id: 'new-payment',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Create new payment'
      },
      {
        text: 'Print',
        id: 'print',
        isAddIcon: true,
        icon: ['fas', 'caret-down'],
        type: 'list',
        toolTip: 'Print selected',
        menu: [
          {
            id: '1',
            name: 'Check On Top',
            toolTip: 'Check On Top'
          },
          {
            id: '4',
            name: 'Three Per Page',
            toolTip: 'Three Per Page'
          }
        ]
      },
      {
        text: 'Send',
        id: 'send',
        isAddIcon: true,
        icon: ['fas', 'caret-down'],
        type: 'list',
        toolTip: 'Send selected',
        menu: [
          {
            id: '1',
            name: 'Check On Top',
            toolTip: 'Check On Top'
          },
          {
            id: '4',
            name: 'Three Per Page',
            toolTip: 'Three Per Page'
          }
        ]
      },
      {
        text: 'DD',
        id: 'dd',
        minWidth: '60px',
        type: 'list',
        toolTip: 'DD selected'
      },
      {
        text: 'Process',
        id: 'process',
        type: 'list',
        toolTip: 'Process selected'
      },
      {
        text: 'Bulk Pay',
        id: 'bulkPay',
        type: {
          style: 'blue',
          name: 'action'
        },
        toolTip: 'Bulk Pay selected'
      },
      {
        text: '',
        id: 'direct-deposit',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        type: 'round',
        width: '32px',
        customClasses: '!text-base',
        backGroundInput: 'var(--common-secondary-red-color)',
        textColorInput: 'var(--common-red-color)',
        toolTip: 'Direct deposit check draft'
      },
      {
        text: '',
        id: 'direct-deposit',
        isAddIcon: true,
        icon: this.faA,
        type: 'round',
        width: '32px',
        customClasses: '!text-base',
        backGroundInput: 'var(--common-secondary-green-color)',
        textColorInput: 'var(--common-green-color)',
        toolTip: 'Direct deposit check draft'
      },
      {
        text: '',
        id: 'direct-deposit',
        isAddIcon: true,
        icon: this.faR,
        type: 'round',
        width: '32px',
        customClasses: '!text-base',
        backGroundInput: 'var(--common-secondary-red-color)',
        textColorInput: 'var(--common-red-color)',
        toolTip: 'Direct deposit check draft'
      }
    ],
    topRightButtons: [
      {
        text: 'Import Payments',
        id: 'import-payments',
        isAddIcon: true,
        icon: ['fas', 'arrow-down-to-line'],
        textColorInput: 'var(--common-green-color)',
        type: 'borderless',
        boxshadow: 'none',
        toolTip: 'Import Payments'
      },
      {
        text: 'QuickBooks Online',
        id: 'import-payments',
        isAddIcon: true,
        icon: ['fas', 'arrow-up-to-line'],
        textColorInput: 'var(--common-green-color)',
        type: 'borderless',
        boxshadow: 'none',
        toolTip: 'Import Payments'
      },
      {
        text: 'QuickBooks Desktop',
        id: 'import-payments',
        isAddIcon: true,
        icon: ['fas', 'arrow-up-to-line'],
        textColorInput: 'var(--common-green-color)',
        type: 'borderless',
        boxshadow: 'none',
        toolTip: 'Import Payments'
      }
    ]
  });

  searchboxComponent = DtSearchBoxComponent;
  v3UpdatedAtComponent = DataRangeV35Component;

  rowData = signal([
    {
      payee: 'Payee 1',
      amount: 12,
      memo: 'Memo',
      created_by: 'User 1',
      reference_id: '1003',
      updated_at: '02/20/2024',
      sourceType: 'BANK',
      type: 'CHECK',
      status: 'Pending',
      view: 'Source'
    },
    {
      payee: 'Payee 1',
      amount: 12,
      memo: 'Memo',
      created_by: 'User 1',
      reference_id: '1002',
      updated_at: '02/20/2024',
      sourceType: 'CARD',
      type: 'CHECK',
      status: 'Pending',
      view: 'Source'
    }
  ]);

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }

  onHeaderButtonClick(id?: string) {}

  rowPayButtonClick() {
    this.router.navigate(['/intro-tour/manage/home'], {
      queryParams: { confirm: true }
    });
    this.introStepUpdate('.paymentButton');
  }
}
