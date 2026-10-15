import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  ChevronLeft,
  FileSpreadsheet,
  ArrowRight,
  LoaderCircle,
  Search
} from 'lucide-angular';
import { Integration } from 'src/app/data/data/integration';
import { IIntgrationApps } from 'src/app/modules/integration/model/integration';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4QBonlineImportComponent } from '../v4-qbonline-import/v4-qbonline-import.component';
import { V4QBdesktopImportComponent } from '../v4-qbdesktop-import/v4-qbdesktop-import.component';
import { V4ZohoImportComponent } from '../v4-zoho-import/v4-zoho-import.component';
import { V4BillDotComImportComponent } from '../v4-bill-dot-com-import/v4-bill-dot-com-import.component';
import { V4XeroImportComponent } from '../v4-xero-import/v4-xero-import.component';
import { V4SageBusinessImportComponent } from '../v4-sage-business-import/v4-sage-business-import.component';
import { V4FreshbooksImportComponent } from '../v4-freshbooks-import/v4-freshbooks-import.component';
import { V4WaveImportComponent } from '../v4-wave-import/v4-wave-import.component';
import { V4NetsuiteImportComponent } from '../v4-netsuite-import/v4-netsuite-import.component';
import { V4OdooImportComponent } from '../v4-odoo-import/v4-odoo-import.component';
import { V4ExcelImportComponent } from '../v4-excel-import/v4-excel-import/v4-excel-import.component';

@Component({
  selector: 'app-v4-thirdparty-import-main-modal',
  templateUrl: './v4-thirdparty-import-main-modal.component.html',
  styleUrls: ['./v4-thirdparty-import-main-modal.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogClose,
    NgClass,
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4QBonlineImportComponent,
    V4QBdesktopImportComponent,
    V4ZohoImportComponent,
    V4BillDotComImportComponent,
    V4XeroImportComponent,
    V4SageBusinessImportComponent,
    V4FreshbooksImportComponent,
    V4WaveImportComponent,
    V4NetsuiteImportComponent,
    V4OdooImportComponent
  ]
})
export class V4ThirdpartyImportMainModalComponent implements OnInit {
  data: { type: string; isSelectQbo?: boolean } = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dialogRef = inject(
    MatDialogRef<V4ThirdpartyImportMainModalComponent>
  );

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

  selectedTab: { indx: number; tab?: TabDetails };

  // Lucide icons
  readonly XIcon = X;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly LoaderCircleIcon = LoaderCircle;
  readonly ArrowRightIcon = ArrowRight;
  readonly SearchIcon = Search;

  searchQuery = '';

  clearSearch(): void {
    this.searchQuery = '';
  }

  ngOnInit(): void {
    this.initiateTabs();
  }

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
          icon: '../../../../assets/icon/document.svg'
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
        }
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
        }
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
        }
      ];
    }
    this.selectedTab.tab = this.tabsArray.find(
      (element: TabDetails) => element.enable
    );
    this.disconnectedTabs = [...this.tabsArray];
    this.activeLink = this.tabsArray[0]?.name;
    this.comingSoonApp = this.integrationLinks.filter(
      (t: IIntgrationApps) => t.comingSoon
    );
    if (this.data.isSelectQbo) {
      this.selectTab(this.tabsArray[0], 0);
    }
  }

  selectTab(tab: TabDetails, i: number) {
    if (tab.id === 'importexcel') {
      this.openExcelImportModal();
      return;
    }
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

  openExcelImportModal() {
    const excelRef = this.dialog.open(V4ExcelImportComponent, {
      maxWidth: '500px',
      disableClose: true,
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { type: this.data.type, onStep2Open: () => this.dialogRef.close() }
    });
    excelRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.dialogRef.close(res);
      }
    });
  }

  back() {
    if (this.isTabClicked === true) {
      this.isTabClicked = false;
    }
    this.open = true;
    this.dialogRef.removePanelClass('v4-step2-expanded');
    this.dialogRef.updateSize('700px', '');
  }

  newConnect() {
    this.router.navigateByUrl('/v4/manage/thirdparty_app/index');
    this.dialogRef.close(false);
  }

  tabsArrays() {
    return this.filterByQuery(
      this.tabsArray.filter((x: TabDetails) => x.isConnected),
      (tab) => tab.name
    );
  }

  tabsNotconenctedArrays() {
    return this.filterByQuery(
      this.tabsArray.filter((x: TabDetails) => !x.isConnected),
      (tab) => tab.name
    );
  }

  filteredComingSoonApps() {
    return this.filterByQuery(this.comingSoonApp, (tab) => tab.title);
  }

  private filterByQuery<T>(items: T[], getLabel: (item: T) => string): T[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(query));
  }

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

  onCompleteImport(completed: boolean): void {
    if (completed) {
      this.dialogRef.close({ success: true });
    }
  }

  requestIntegrationModal(_tab: IIntgrationApps) {
    this.dialogRef.close();
    this.router.navigateByUrl('/v4/manage/thirdparty_app/index');
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
