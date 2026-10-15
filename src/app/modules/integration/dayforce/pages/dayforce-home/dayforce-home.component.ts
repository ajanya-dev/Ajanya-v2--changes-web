import { Component, inject, OnInit, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faUpRightFromSquare,
  faLink,
  faArrowRight,
  faGear,
  faBuildingColumns,
  faLightbulb,
  faHeadset,
  faMessage,
  faEnvelope,
  faPhone,
  faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { NgOptimizedImage } from '@angular/common';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { finalize, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  faArrowRightFromBracket,
  faShieldCheck
} from '@fortawesome/pro-regular-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { IDayforceConnectionDetails } from '../../model/dayforce';
import { DayforceConnectionModalComponent } from '../../modals/dayforce-connection-modal/dayforce-connection-modal.component';
import { DayforceDetailsComponent } from '../../components/dayforce-details/dayforce-details.component';

@Component({
  selector: 'app-dayforce-home',
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    NgOptimizedImage,
    MatTooltip,
    DayforceDetailsComponent
  ],
  templateUrl: './dayforce-home.component.html',
  styleUrl: './dayforce-home.component.scss'
})
export class DayforceHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);

  isLoading = signal(false);
  dayforceConnectionDetails = signal<IDayforceConnectionDetails | null>(null);
  isDisconnecting = signal(false);
  itsSubCompany = signal(false);

  // Icons
  faUpRightFromSquare = faUpRightFromSquare;
  faLink = faLink;
  faArrowRight = faArrowRight;
  faGear = faGear;
  faBuildingColumns = faBuildingColumns;
  faLightbulb = faLightbulb;
  faHeadset = faHeadset;
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faShieldCheck = faShieldCheck;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faSpinner = faSpinner;

  // Support info
  supportEmail = StaticWhiteLabelConditions.customerSupportEmail;
  supportPhone = StaticWhiteLabelConditions.customerSupportNo || '';

  // Integration Flow Steps
  integrationSteps = [
    {
      icon: faLink,
      title: 'Connect Dayforce',
      description: 'Set up secure connection with your Dayforce account',
      backgroundColor: 'var(--common-tertiary-blue-color)'
    },
    {
      icon: faGear,
      title: 'Configure Settings',
      description: 'Customize sync preferences and mapping options',
      backgroundColor: 'var(--common-blue-color)'
    },
    {
      icon: faBuildingColumns,
      title: 'Link Bank Accounts',
      description: 'Connect your financial accounts for seamless transactions',
      backgroundColor: 'var(--common-green-color)'
    }
  ];

  // Instructions
  instructions = [
    {
      title: 'Connect to Dayforce',
      description: 'Click on "Connect" to establish connection'
    },
    {
      title: 'Authenticate',
      description:
        'Connect your Dayforce account with ZilMoney using your Dayforce credentials.'
    },
    {
      title: 'Import Payrolls',
      description:
        'Click "Import Payments", select your pay period, then import your payroll data.'
    }
  ];

  ngOnInit(): void {
    this.getDayforceConnectionDetails();
  }

  getDayforceConnectionDetails(): void {
    this.isLoading.set(true);
    this.integrationService
      .getDayforceConnectionDetails()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dayforceConnectionDetails.set(res.data);
            this.itsSubCompany.set(
              res.data.connection_info.inherited_from_parent
            );
          }
        }
      });
  }

  onConnectDayforce(): void {
    this.dialog
      .open(DayforceConnectionModalComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getDayforceConnectionDetails();
        }
      });
  }

  onDisconnectDayforce(): void {
    this.isDisconnecting.set(true);
    this.integrationService
      .disconnectDayforce()
      .pipe(
        finalize(() => this.isDisconnecting.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.getDayforceConnectionDetails();
          }
        }
      });
  }

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
