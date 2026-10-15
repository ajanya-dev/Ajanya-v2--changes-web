import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { Integration } from 'src/app/data/data/integration';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  IIntegration,
  IIntgrationApps
} from 'src/app/modules/integration/model/integration';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgClass, NgStyle, JsonPipe, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ContactSupportModalComponent } from 'src/app/shared/modal/contact-support-modal/contact-support-modal.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronRight, faChevronDown, faChevronUp, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { IntegrationRequestOptionsModalComponent } from 'src/app/modules/user-support/modals/integration-request-options-modal/integration-request-options-modal.component';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';

/**
 * Component for managing integrations.
 */
@Component({
  selector: 'app-integration-main',
  templateUrl: './integration-main.component.html',
  styleUrls: ['./integration-main.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    NgStyle,
    JsonPipe,
    SearchFilterPipe,
    NgOptimizedImage,
    CommonButtonV35Component,
    FaIconComponent
  ]
})
export class IntegrationMainComponent implements OnInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);
  private integrationService = inject(IntegrationService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  subscriptions: Subscription[] = [];
  faChevronRight = faChevronRight;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faCheck = faCheck;
  showConnectedApps = signal(true);
  toggleConnectedApps = signal(true);
  categories = [
    { value: 'all', name: 'All Integrations' },
    { value: 'connected', name: 'Connected Apps' },
    { value: 'payroll', name: 'Payroll' },
    { value: 'accounting', name: 'Accounting' },
    { value: 'finance', name: 'Finance' },
    { value: 'ticketing', name: 'Ticketing' },
    { value: 'crm', name: 'CRM' },
    { value: 'marketing', name: 'Marketing' },
    { value: 'ats', name: 'ATS' },
    { value: 'other', name: 'Others' }
  ];

  selectedValue = 'all';
  integrationLinks = signal<IIntgrationApps[]>([]);
  currentRoute: string;
  requestedId: string;
  searchInput = '';
  isWhiteLabel: boolean = false;
  isUser = signal(false);
  isLoading = signal(false);
  connectedAppsList: IIntgrationApps[] = [];

  ngOnInit(): void {
    this.isWhiteLabel =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isWhiteLabel'
      );
    this.getHeaderData();
    this.getConnectionStatus();
  }

  getConnectionStatus(){
    this.isLoading.set(true);
    this.subscriptions.push(
      this.integrationService.appsConnectionStatus()
      .pipe(finalize(() => {
        this.isLoading.set(false);
      }))
      .subscribe((res) => {
        if(res.success){
          this.setConnectedApps(res.data.connected_applications);
        }        
      })
    );
  }

  setConnectedApps(appsName: string[]) {
    const appsList = Integration.integrationLinks();
    this.connectedAppsList = appsList.filter(app => appsName.includes(app.id));
  }
  

  getHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (typeof res === 'object') {
          this.isUser.set((res as IHeaderData).isLoggedInAsClient);
          this.integrationLinks.set(
            Integration.integrationLinks().filter(
              (item) => !this.isUser() || item.id !== 'square'
            )
          );
        } else {
          this.integrationLinks.set(
            Integration.integrationLinks().filter(
              (item) => item.id !== 'square'
            )
          );
        }
      })
    );
  }

  /**
   * Selects a category for filtering integrations.
   * @param value The selected category value.
   */
  selectCategory(value: string) {
    this.selectedValue = value;
    this.setPage(this.selectedValue);
  }

  /**
   * Sets the page content based on the selected category.
   * @param value The selected category value.
   */
  setPage(value: string) {
    this.showConnectedApps.set(false);
    if (value === 'all') {
      this.showConnectedApps.set(true);
      const appsList = this.isUser()
        ? Integration.integrationLinks().filter((item) => item.id !== 'square')
        : Integration.integrationLinks();
      this.integrationLinks.set(appsList);
    } else if (value === 'accounting') {
      this.integrationLinks.set(Integration.accountingLinks());
    } else if (value === 'finance') {
      this.integrationLinks.set(Integration.financeLinks());
    } else if (value === 'payroll') {
      const appsList = this.isUser()
        ? Integration.payrollLinks().filter((item) => item.id !== 'square')
        : Integration.payrollLinks();
      this.integrationLinks.set(appsList);
    } else if (value === 'ticketing') {
      this.integrationLinks.set(Integration.ticketingLinks());
    } else if (value === 'crm') {
      this.integrationLinks.set(Integration.crmLinks());
    } else if (value === 'marketing') {
      this.integrationLinks.set(Integration.marketingLinks());
    } else if (value === 'ats') {
      this.integrationLinks.set(Integration.atsLinks());
    } else if(value === 'connected'){
      this.integrationLinks.set(this.connectedAppsList);
    } else {
      this.integrationLinks.set(Integration.otherLinks());
    }
  }

  toggleApps() {
    this.toggleConnectedApps.set(!this.toggleConnectedApps());
  }

  /**
   * Navigates to the selected integration.
   * @param item The integration item to navigate to.
   */
  navigate(item: IIntegration) {
    if (item.routerLink) {
      this.router.navigateByUrl(item.routerLink);
    }
    if (item.comingSoon) {
      this.requestedId = item.id;
      this.dialog.open(IntegrationRequestOptionsModalComponent, {
        width: '400px',
        disableClose: true,
        data: { requestedId: this.requestedId, appName: item.title }
      });
    }
  }

  /**
   * Tracks the request for a third-party integration.
   * @param requestedId The ID of the requested integration.
   */
  thirdPartyRequestTracking(requestedId: string) {
    const appName = {
      appName: requestedId
    };
    this.subscriptions.push(
      this.integrationService.thirdPartyIntegrationRequest(appName).subscribe()
    );
  }



  requestIntegration() {
   this.dialog.open(ContactSupportModalComponent, {
    width: '400px',
    disableClose: true,
    data: {
      type: 'request-integration'
    }
   });
  }
}
