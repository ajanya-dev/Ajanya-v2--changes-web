import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Integration } from 'src/app/data/data/integration';
import { NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IIntgrationApps } from 'src/app/modules/integration/model/integration';
import { WorkdayImportComponent } from '../workday-import/workday-import.component';
import { SageIntacctImportComponent } from '../sage-intacct-import/sage-intacct-import.component';
import { ClearbooksImportComponent } from '../clearbooks-import/clearbooks-import.component';
import { MsDynamicsImportComponent } from '../ms-dynamics-import/ms-dynamics-import.component';
import { FreeagentImportsComponent } from '../freeagent-imports/freeagent-imports.component';
import { NetsuiteImportComponent } from '../netsuite-import/netsuite-import.component';
import { WaveImportComponent } from '../wave-import/wave-import.component';
import { FreshbooksImportComponent } from '../freshbooks-import/freshbooks-import.component';
import { SageBusinessImportComponent } from '../sage-business-import/sage-business-import.component';
import { XeroImportComponent } from '../xero-import/xero-import.component';
import { ImportFromBillDotComComponent } from '../../import-from-bill-dot-com/import-from-bill-dot-com.component';
import { ZohoImportComponent } from '../zoho-import/zoho-import.component';
import { QBdesktopImportComponent } from '../qbdesktop-import/qbdesktop-import.component';
import { QBonlineImportComponent } from '../qbonline-import/qbonline-import.component';
import { OdooImportComponent } from '../odoo-import/odoo-import.component';

/**
 * @description Main modal component for third party import.
 */
@Component({
  selector: 'app-thirdparty-import-main-modal',
  templateUrl: './thirdparty-import-main-modal.component.html',
  styleUrls: ['./thirdparty-import-main-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgClass,
    QBonlineImportComponent,
    QBdesktopImportComponent,
    ZohoImportComponent,
    ImportFromBillDotComComponent,
    XeroImportComponent,
    SageBusinessImportComponent,
    FreshbooksImportComponent,
    WaveImportComponent,
    NetsuiteImportComponent,
    FreeagentImportsComponent,
    MsDynamicsImportComponent,
    ClearbooksImportComponent,
    SageIntacctImportComponent,
    WorkdayImportComponent,
    NetsuiteImportComponent,
    FontAwesomeModule,
    OdooImportComponent
]
})
export class ThirdpartyImportMainModalComponent implements OnInit {
  data: { type: string, isSelectQbo?: boolean } = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ThirdpartyImportMainModalComponent>);

  tabsArray: TabDetails[] = [];
  connectedTabs: TabDetails[] = [];
  disconnectedTabs: TabDetails[] = [];
  connectionStatusReturnCount = 0;
  activeLink: string;
  open = true;
  isTabClicked = false;
  loading = true;
  integrationLinks: IIntgrationApps[] = Integration.integrationLinks();
  comingSoonApp: IIntgrationApps[];

  @ViewChild('tabParent') tabParent: ElementRef;

  tabGliderOffset: number;
  selectedTab: { indx: number; tab?: TabDetails };
  @ViewChildren('customTab') elReference: QueryList<ElementRef>;

  faXmark = faXmark;
  faArrowLeft = faArrowLeft;

  ngOnInit(): void {
    this.initiateTabs();
  }

  /**
   * @description Method to set tabs data.
   */
  initiateTabs() {
    this.selectedTab = {
      indx: 0
    };
    if (this.data.type === 'checks') {
      this.tabsArray = [
        {
          id: 'qbo',
          name: 'QuickBooks Online',
          isConnected: false,
          enable: true,
          initialIndex: 0,
          icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
          imgWidth: '100px',
          minWidth: '70px'
        },
        {
          id: 'qbd',
          name: 'QuickBooks Desktop',
          isConnected: false,
          enable: false,
          initialIndex: 1,
          icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
          imgWidth: '100px',
          minWidth: '70px'
        },
        {
          id: 'zoho',
          name: 'Zoho Books',
          isConnected: false,
          enable: true,
          initialIndex: 3,
          icon: '../../../../assets/images/integration/zoho-latest-logo.png'
        },
        {
          id: 'sage',
          name: 'Sage Business',
          isConnected: false,
          enable: true,
          initialIndex: 6,
          icon: '../../../../assets/images/integration/sage.png'
        },
        {
          id: 'importexcel',
          name: 'Import From Excel',
          isConnected: true,
          enable: true,
          initialIndex: 12,
          icon: '../../../../assets/icon/document.svg',
          routerLink: '/manage/cheque/multi_import/step1'
        },
        {
          id: 'netsuite',
          name: 'NetSuite',
          isConnected: false,
          enable: true,
          initialIndex: 13,
          icon: '../../../../assets/images/integration/oracle-netsuite.png',
          imgWidth: '72px',
          minWidth: '65px'
        },
      ];
    } else if (this.data.type === 'bills') {
      this.tabsArray = [
        {
          id: 'qbo',
          name: 'QuickBooks Online',
          isConnected: false,
          enable: true,
          initialIndex: 0,
          icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
          imgWidth: '100px',
          minWidth: '70px'
        },
        {
          id: 'xero',
          name: 'Xero',
          isConnected: false,
          enable: true,
          initialIndex: 2,
          icon: '../../../../assets/images/integration/xero.png'
        },
        {
          id: 'zoho',
          name: 'Zoho Books',
          isConnected: false,
          enable: true,
          initialIndex: 3,
          icon: '../../../../assets/images/integration/zoho-latest-logo.png'
        },
        {
          id: 'bill.com',
          name: 'Bill.com',
          isConnected: false,
          enable: true,
          initialIndex: 4,
          icon: '../../../../assets/images/integration/bill-dot-com.png'
        },
        {
          id: 'freshbooks',
          name: 'FreshBooks',
          isConnected: false,
          enable: true,
          initialIndex: 5,
          icon: '../../../../assets/images/integration/freshbook.png'
        },
        {
          id: 'sage',
          name: 'Sage Business',
          isConnected: false,
          enable: true,
          initialIndex: 6,
          icon: '../../../../assets/images/integration/sage.png'
        },
        {
          id: 'odoo',
          name: 'Odoo',
          isConnected: false,
          enable: true,
          initialIndex: 7,
          icon: '../../../../assets/images/integration/odoo.png'
        },
        {
          id: 'netsuite',
          name: 'NetSuite',
          isConnected: false,
          enable: true,
          initialIndex: 8,
          icon: '../../../../assets/images/integration/oracle-netsuite.png',
          imgWidth: '72px',
          minWidth: '65px'
        },
        // {
        //   id: 'freeagent',
        //   name: 'FreeAgent',
        //   isConnected: false,
        //   enable: true,
        //   initialIndex: 8,
        //   icon: '../../../../assets/images/integration/freeagent.png'
        // }
      ];
    } else {
      this.tabsArray = [
        {
          id: 'qbo',
          name: 'QuickBooks Online',
          isConnected: false,
          enable: true,
          initialIndex: 0,
          icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
          imgWidth: '100px',
          minWidth: '70px'
        },
        {
          id: 'xero',
          name: 'Xero',
          isConnected: false,
          enable: true,
          initialIndex: 2,
          icon: '../../../../assets/images/integration/xero.png'
        },
        {
          id: 'zoho',
          name: 'Zoho Books',
          isConnected: false,
          enable: true,
          initialIndex: 3,
          icon: '../../../../assets/images/integration/zoho-latest-logo.png'
        },
        {
          id: 'freshbooks',
          name: 'FreshBooks',
          isConnected: false,
          enable: true,
          initialIndex: 5,
          icon: '../../../../assets/images/integration/freshbook.png'
        },
        {
          id: 'sage',
          name: 'Sage Business',
          isConnected: false,
          enable: true,
          initialIndex: 6,
          icon: '../../../../assets/images/integration/sage.png'
        },
        {
          id: 'wave',
          name: 'Wave',
          isConnected: false,
          enable: true,
          initialIndex: 7,
          icon: '../../../../assets/images/integration/wave.png'
        },
        // {
        //   id: 'freeagent',
        //   name: 'FreeAgent',
        //   isConnected: false,
        //   enable: true,
        //   initialIndex: 9,
        //   icon: '../../../../assets/images/integration/freeagent.png'
        // },
        // {
        //   id: 'microsoft365',
        //   name: 'MicrosoftDynamics365',
        //   isConnected: false,
        //   enable: true,
        //   initialIndex: 10,
        //   icon: '../../../../assets/images/integration/microsoft-dynamics.png'
        // },
        // {
        //   id: 'sageintacct',
        //   name: 'SageIntacct',
        //   isConnected: false,
        //   enable: true,
        //   initialIndex: 11,
        //   icon: '../../../../assets/images/integration/sage.png'
        // },
        // {
        //   id: 'clearbooks',
        //   name: 'ClearBooks',
        //   isConnected: false,
        //   enable: true,
        //   initialIndex: 12,
        //   icon: '../../../../assets/images/integration/clearbooks.png'
        // }
      ];

    }
    this.selectedTab.tab = this.tabsArray.find(
      (element: TabDetails) => element.enable
    );
    this.disconnectedTabs = [...this.tabsArray];
    this.activeLink = this.tabsArray[0]?.name;
    this.comingSoonApp = this.integrationLinks.filter((t:IIntgrationApps) => t.comingSoon);
    if (this.data.isSelectQbo) {
      this.selectTab(this.tabsArray[0], 0);
    }
  }

  /**
   * @description Method to set selected tab.
   * @param tab - tab details.
   * @param i - index.
   */
  selectTab(tab: TabDetails, i: number) {
    this.isTabClicked = true;
    this.selectedTab.tab = tab;
    this.selectedTab.indx = i;
    if (this.open === true) {
      this.open = false;
    }
    if (tab.routerLink) {
      this.router.navigate([tab.routerLink]);
      this.dialogRef?.close();
    }
  }

  /**
   * @description Used to move main section of modal from selected app.
   */
  back() {
    if (this.isTabClicked === true) {
      this.isTabClicked = false;
    }
    this.open = true;
  }

  /**
   * @description Navigate to Apps page to connect new apps.
   */
  newConnect() {
    this.router.navigateByUrl('/manage/thirdparty_app/index');
    this.dialogRef.close(false);
  }

  /**
   * @description Returns the enabled tabs from `this.tabsArray[]`.
   */
  tabsArrays() {
    return this.tabsArray.filter((x: TabDetails) => x.isConnected);
  }

  /**
   * @description Returns the disconnect tabs from `this.tabsArray[]`.
   */
  tabsNotconenctedArrays() {
    return this.tabsArray.filter((x: TabDetails) => !x.isConnected);
  }

  /**
   * @description Method invoked when `connectionStatus` event is emitted by child.
   * Sets `isConnected` property of selected item in `this.disconnectedTabs[]` to true or false,
   * based on `isConnected` param value.
   * @param isConnected - boolean
   * @param tabId - tab ID.
   */
  onConnectionStatus(isConnected: boolean, tabId: string) {
    if (isConnected) {
      const indx = this.disconnectedTabs.findIndex(
        (element: TabDetails) => tabId === element.id
      );
      this.disconnectedTabs[indx].isConnected = isConnected;

      if (tabId === 'qbd' && this.data.type === 'checks') {
        this.disconnectedTabs[indx].enable = true;
      }
      this.connectedTabs.push(this.disconnectedTabs[indx]);
      this.disconnectedTabs.splice(indx, 1);
      this.tabsArray = [...this.connectedTabs, ...this.disconnectedTabs];
    }
    this.loading = false;
  }

  onCompleteImport(completed:boolean): void{
    if(completed){
      this.dialogRef.close({ success: true });
    }
    
  }

  requestIntegrationModal(tab: TabDetails) {
     this.dialogRef.close();
     this.router.navigateByUrl(`/manage/thirdparty_app/index`);
  }
}
interface TabDetails {
  id: string;
  name: string;
  isConnected: boolean;
  enable: boolean;
  initialIndex: number;
  icon?: string;
  imgWidth?: string;
  minWidth?: string;
  routerLink?: string;
}
