import { CommonModule, NgClass, TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ICheckShipingTypes } from 'src/app/modules/check/model/check';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { LoomService } from 'src/app/modules/loom-video/loom/service/loom.service';
import { FeatureRequestModalComponent } from 'src/app/shared/modal/feature-request-modal/feature-request-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';

interface IDashboardButton {
  title: string;
  svg?: SafeHtml;
  bgColor?: string;
  comingSoon?: boolean;
  id:
    | 'feedback'
    | 'report'
    | 'group-history'
    | 'single-mail'
    | 'group-mail'
    | 'call'
    | 'import'
    | 'document-mailing'
    | 'documentation'
    | 'partner'
    | 'reseller'
    | 'single-mail-history'
    | 'bulk-import'
    | 'document-mailing-history'; // Union type for valid IDs
}

@Component({
  selector: 'app-mailing-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, TitleCasePipe, MatTooltip],
  templateUrl: './mailing-dashboard.component.html',
  styleUrl: './mailing-dashboard.component.scss'
})
export class MailingDashboardComponent implements OnInit, OnDestroy {
  private loomService = inject(LoomService);
  private dialog = inject(MatDialog);
  private route = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  destroy$ = new Subject();
  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  isLoading = signal(false);

  dashboardButtons = [
    {
      title: 'Single Mail',
      id: 'single-mail',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      tooltip: `Create and mail one individual check to either the payee's address or a custom address.`,
      svg: this
        .sanitizeSvg(`<svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.11982 0.841322H17.1402C17.3894 0.841322 17.6 0.927358 17.7721 1.09943C17.9442 1.2715 18.0302 1.48214 18.0302 1.73134V15.9717C18.0302 16.2209 17.9442 16.4315 17.7721 16.6036C17.6 16.7757 17.3894 16.8617 17.1402 16.8617H1.11982C0.870612 16.8617 0.659974 16.7757 0.487903 16.6036C0.315833 16.4315 0.229797 16.2209 0.229797 15.9717V1.73134C0.229797 1.48214 0.315833 1.2715 0.487903 1.09943C0.659974 0.927358 0.870612 0.841322 1.11982 0.841322ZM9.1834 8.5667L3.46947 3.72499L2.33025 5.07782L9.20121 10.9164L15.9476 5.07782L14.7727 3.72499L9.1834 8.5667Z" fill="#3B82F6"/>
        </svg>
      `)
    },
    {
      title: 'Group Mail',
      id: 'group-mail',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      tooltip: `Create a batch of checks for multiple payees and mail them with attachments to a custom address.`,
      svg: this
        .sanitizeSvg(`<svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.06019 3.06637V1.73134C2.06019 1.48214 2.14623 1.2715 2.3183 1.09943C2.49037 0.927358 2.70101 0.841322 2.95021 0.841322H18.9706C19.2198 0.841322 19.4304 0.927358 19.6025 1.09943C19.7746 1.2715 19.8606 1.48214 19.8606 1.73134V15.9717C19.8606 16.2209 19.7746 16.4315 19.6025 16.6036C19.4304 16.7757 19.2198 16.8617 18.9706 16.8617H2.95021C2.70101 16.8617 2.49037 16.7757 2.3183 16.6036C2.14623 16.4315 2.06019 16.2209 2.06019 15.9717V15.0817H18.0806V4.66841L10.9604 11.0766L2.06019 3.06637ZM0.280151 7.07147H4.73025V8.85151H0.280151V7.07147ZM0.280151 11.5216H7.40032V13.3016H0.280151V11.5216Z" fill="#3B82F6"/>
        </svg>
      `)
    },
    {
      title: 'Multi Check Import',
      id: 'bulk-import',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      tooltip: `Import check data (Excel, CSV, ZIP) to create and mail checks in bulk.`,
      svg: this.sanitizeSvg(
        `<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.91 13.5L8.2 14.21L8.91 14.92L9.62 14.21L8.91 13.5ZM9.91 5C9.91 4.45 9.46 4 8.91 4C8.36 4 7.91 4.45 7.91 5L9.91 5ZM4.2 10.21L8.2 14.21L9.62 12.79L5.62 8.79L4.2 10.21ZM9.62 14.21L13.62 10.21L12.2 8.79L8.2 12.79L9.62 14.21ZM9.91 13.5L9.91 5L7.91 5L7.91 13.5L9.91 13.5Z" fill="#3B82F6"/>
          <path d="M2.91 15L2.91 16C2.91 17.1 3.81 18 4.91 18L12.91 18C14.01 18 14.91 17.1 14.91 16V15" stroke="#3B82F6" stroke-width="2"/>
        </svg>`
      )
    },
    {
      title: 'Single Mail History',
      id: 'single-mail-history',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      svg: this
        .sanitizeSvg(`<svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.11982 0.841322H17.1402C17.3894 0.841322 17.6 0.927358 17.7721 1.09943C17.9442 1.2715 18.0302 1.48214 18.0302 1.73134V15.9717C18.0302 16.2209 17.9442 16.4315 17.7721 16.6036C17.6 16.7757 17.3894 16.8617 17.1402 16.8617H1.11982C0.870612 16.8617 0.659974 16.7757 0.487903 16.6036C0.315833 16.4315 0.229797 16.2209 0.229797 15.9717V1.73134C0.229797 1.48214 0.315833 1.2715 0.487903 1.09943C0.659974 0.927358 0.870612 0.841322 1.11982 0.841322ZM9.1834 8.5667L3.46947 3.72499L2.33025 5.07782L9.20121 10.9164L15.9476 5.07782L14.7727 3.72499L9.1834 8.5667Z" fill="#3B82F6"/>
        </svg>
      `)
    },
    {
      title: 'Group History',
      id: 'group-history',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      svg: this
        .sanitizeSvg(`<svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.06019 3.06637V1.73134C2.06019 1.48214 2.14623 1.2715 2.3183 1.09943C2.49037 0.927358 2.70101 0.841322 2.95021 0.841322H18.9706C19.2198 0.841322 19.4304 0.927358 19.6025 1.09943C19.7746 1.2715 19.8606 1.48214 19.8606 1.73134V15.9717C19.8606 16.2209 19.7746 16.4315 19.6025 16.6036C19.4304 16.7757 19.2198 16.8617 18.9706 16.8617H2.95021C2.70101 16.8617 2.49037 16.7757 2.3183 16.6036C2.14623 16.4315 2.06019 16.2209 2.06019 15.9717V15.0817H18.0806V4.66841L10.9604 11.0766L2.06019 3.06637ZM0.280151 7.07147H4.73025V8.85151H0.280151V7.07147ZM0.280151 11.5216H7.40032V13.3016H0.280151V11.5216Z" fill="#3B82F6"/>
        </svg>
      `)
    },
    {
      title: 'Import Excel/CSV',
      id: 'import',
      comingSoon: false,
      bgColor: 'common-secondary-green-color',
      svg: this
        .sanitizeSvg(`<svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.689 0.69446L16.1391 5.14456V17.6049C16.1391 17.8541 16.0531 18.0647 15.881 18.2368C15.709 18.4088 15.4983 18.4949 15.2491 18.4949H1.0088C0.759589 18.4949 0.548951 18.4088 0.37688 18.2368C0.20481 18.0647 0.118774 17.8541 0.118774 17.6049V1.58448C0.118774 1.33528 0.20481 1.12464 0.37688 0.952566C0.548951 0.780495 0.759589 0.69446 1.0088 0.69446H11.689ZM9.19699 9.59467L11.689 6.03458H9.55299L8.12896 8.06383L6.70493 6.03458H4.56888L7.06094 9.59467L4.56888 13.1547H6.70493L8.12896 11.1255L9.55299 13.1547H11.689L9.19699 9.59467Z" fill="#10B981"/>
        </svg>
      `)
    },
    {
      title: 'Document Mailing',
      id: 'document-mailing',
      comingSoon: false,
      bgColor: 'common-secondary-green-color',
      svg: this.sanitizeSvg(
        `
        <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.9496 12.2649V1.58466C1.9496 1.33546 2.03563 1.12482 2.2077 0.952749C2.37977 0.780678 2.59041 0.694643 2.83962 0.694643H17.0799C17.3292 0.694643 17.5398 0.780678 17.7119 0.952749C17.8839 1.12482 17.97 1.33546 17.97 1.58466V15.825C17.97 16.3115 17.8513 16.7595 17.614 17.1689C17.3766 17.5783 17.0532 17.9017 16.6438 18.139C16.2344 18.3764 15.7865 18.4951 15.2999 18.4951H2.83962C2.35307 18.4951 1.9051 18.3764 1.49569 18.139C1.08628 17.9017 0.762903 17.5783 0.525564 17.1689C0.288225 16.7595 0.169556 16.3115 0.169556 15.825V14.045H14.4099V15.825C14.4099 16.0742 14.4959 16.2848 14.668 16.4569C14.8401 16.629 15.0507 16.715 15.2999 16.715C15.5491 16.715 15.7598 16.629 15.9318 16.4569C16.1039 16.2848 16.1899 16.0742 16.1899 15.825V12.2649H1.9496Z" fill="#10B981"/>
        </svg>
        `
      )
    },
    {
      title: 'Document Mailing History',
      id: 'document-mailing-history',
      comingSoon: false,
      bgColor: 'common-secondary-green-color',
      svg: this.sanitizeSvg(
        `
        <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.9496 12.2649V1.58466C1.9496 1.33546 2.03563 1.12482 2.2077 0.952749C2.37977 0.780678 2.59041 0.694643 2.83962 0.694643H17.0799C17.3292 0.694643 17.5398 0.780678 17.7119 0.952749C17.8839 1.12482 17.97 1.33546 17.97 1.58466V15.825C17.97 16.3115 17.8513 16.7595 17.614 17.1689C17.3766 17.5783 17.0532 17.9017 16.6438 18.139C16.2344 18.3764 15.7865 18.4951 15.2999 18.4951H2.83962C2.35307 18.4951 1.9051 18.3764 1.49569 18.139C1.08628 17.9017 0.762903 17.5783 0.525564 17.1689C0.288225 16.7595 0.169556 16.3115 0.169556 15.825V14.045H14.4099V15.825C14.4099 16.0742 14.4959 16.2848 14.668 16.4569C14.8401 16.629 15.0507 16.715 15.2999 16.715C15.5491 16.715 15.7598 16.629 15.9318 16.4569C16.1039 16.2848 16.1899 16.0742 16.1899 15.825V12.2649H1.9496Z" fill="#10B981"/>
        </svg>
        `
      )
    },
    {
      title: 'Reporting',
      id: 'report',
      comingSoon: false,
      bgColor: 'common-secondary-yellow-color',
      svg: this
        .sanitizeSvg(`<svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.5704 0.69449L16.0205 5.14459V17.6049C16.0205 17.8541 15.9345 18.0647 15.7624 18.2368C15.5903 18.4089 15.3797 18.4949 15.1305 18.4949H0.890143C0.640937 18.4949 0.430299 18.4089 0.258228 18.2368C0.0861574 18.0647 0.00012207 17.8541 0.00012207 17.6049V1.58451C0.00012207 1.33531 0.0861574 1.12467 0.258228 0.952597C0.430299 0.780525 0.640937 0.69449 0.890143 0.69449H11.5704ZM7.12029 5.14459V14.0448H8.90033V5.14459H7.12029ZM10.6804 8.70468V14.0448H12.4604V8.70468H10.6804ZM3.5602 10.4847V14.0448H5.34025V10.4847H3.5602Z" fill="#EA580C"/>
        </svg>
      `)
    },
    {
      title: 'Developer Documentation',
      id: 'documentation',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      svg: this.sanitizeSvg(
        `<svg width="20" height="13" viewBox="0 0 20 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.9202 6.33812L13.6189 12.6395L12.3729 11.3756L17.4104 6.33812L12.3729 1.3006L13.6189 0.0367727L19.9202 6.33812ZM2.84964 6.33812L7.88716 11.3756L6.64113 12.6395L0.339783 6.33812L6.64113 0.0367727L7.88716 1.3006L2.84964 6.33812Z" fill="#3B82F6"/>
          </svg>
        `
      )
    },
    {
      title: 'Become Partner',
      id: 'partner',
      comingSoon: false,
      bgColor: 'common-secondary-yellow-color',
      svg: this
        .sanitizeSvg(`<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.06976 7.55816C9.71058 7.55816 10.3039 7.39795 10.8498 7.07754C11.3957 6.75714 11.8288 6.32399 12.1492 5.77811C12.4696 5.23223 12.6298 4.63889 12.6298 3.99807C12.6298 3.35726 12.4696 2.76391 12.1492 2.21803C11.8288 1.67215 11.3957 1.23901 10.8498 0.918602C10.3039 0.598194 9.71058 0.43799 9.06976 0.43799C8.42895 0.43799 7.8356 0.598194 7.28972 0.918602C6.74384 1.23901 6.3107 1.67215 5.99029 2.21803C5.66988 2.76391 5.50968 3.35726 5.50968 3.99807C5.50968 4.63889 5.66988 5.23223 5.99029 5.77811C6.3107 6.32399 6.74384 6.75714 7.28972 7.07754C7.8356 7.39795 8.42895 7.55816 9.06976 7.55816ZM3.28463 10.2282C3.6881 10.2282 4.05895 10.1273 4.39715 9.92561C4.73536 9.72387 5.00533 9.4539 5.20707 9.11569C5.40881 8.77748 5.50968 8.40664 5.50968 8.00317C5.50968 7.59969 5.40881 7.22885 5.20707 6.89064C5.00533 6.55243 4.73536 6.28246 4.39715 6.08072C4.05895 5.87898 3.6881 5.77811 3.28463 5.77811C2.88115 5.77811 2.51031 5.87898 2.1721 6.08072C1.83389 6.28246 1.56392 6.55243 1.36218 6.89064C1.16045 7.22885 1.05958 7.59969 1.05958 8.00317C1.05958 8.40664 1.16045 8.77748 1.36218 9.11569C1.56392 9.4539 1.83389 9.72387 2.1721 9.92561C2.51031 10.1273 2.88115 10.2282 3.28463 10.2282ZM17.0799 8.00317C17.0799 8.40664 16.9791 8.77748 16.7773 9.11569C16.5756 9.4539 16.3056 9.72387 15.9674 9.92561C15.6292 10.1273 15.2584 10.2282 14.8549 10.2282C14.4514 10.2282 14.0806 10.1273 13.7424 9.92561C13.4042 9.72387 13.1342 9.4539 12.9325 9.11569C12.7307 8.77748 12.6298 8.40664 12.6298 8.00317C12.6298 7.59969 12.7307 7.22885 12.9325 6.89064C13.1342 6.55243 13.4042 6.28246 13.7424 6.08072C14.0806 5.87898 14.4514 5.77811 14.8549 5.77811C15.2584 5.77811 15.6292 5.87898 15.9674 6.08072C16.3056 6.28246 16.5756 6.55243 16.7773 6.89064C16.9791 7.22885 17.0799 7.59969 17.0799 8.00317ZM9.06976 8.44818C9.87671 8.44818 10.6214 8.64695 11.3037 9.04449C11.9861 9.44203 12.526 9.98198 12.9236 10.6643C13.3211 11.3467 13.5199 12.0913 13.5199 12.8983V18.2384H4.61966V12.8983C4.61966 12.0913 4.81843 11.3467 5.21597 10.6643C5.61352 9.98198 6.15346 9.44203 6.83581 9.04449C7.51816 8.64695 8.26281 8.44818 9.06976 8.44818ZM2.83962 12.8983C2.83962 12.2931 2.92269 11.6997 3.08882 11.1182L2.94642 11.136C2.43614 11.1954 1.9674 11.3674 1.54019 11.6523C1.11298 11.9371 0.777736 12.3079 0.534464 12.7648C0.291192 13.2217 0.169556 13.7112 0.169556 14.2333V18.2384H2.83962V12.8983ZM17.97 18.2384V14.2333C17.97 13.6874 17.8394 13.1831 17.5784 12.7203C17.3173 12.2575 16.9642 11.8837 16.5192 11.5988C16.0742 11.314 15.5847 11.1538 15.0507 11.1182C15.2168 11.6997 15.2999 12.2931 15.2999 12.8983V18.2384H17.97Z" fill="#EA580C"/>
        </svg>
      `)
    },
    {
      title: 'Become Reseller',
      id: 'reseller',
      comingSoon: false,
      bgColor: 'common-secondary-green-color',
      svg: this.sanitizeSvg(
        `<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.01044 18.2384C7.80001 18.2384 6.64298 18.007 5.53936 17.5442C4.4832 17.0932 3.54274 16.4554 2.71799 15.6306C1.89324 14.8059 1.25539 13.8654 0.804446 12.8093C0.341635 11.7057 0.110229 10.5486 0.110229 9.3382C0.110229 8.12777 0.341635 6.97074 0.804446 5.86712C1.25539 4.81096 1.89324 3.8705 2.71799 3.04575C3.54274 2.221 4.4832 1.58315 5.53936 1.13221C6.64298 0.669395 7.80001 0.43799 9.01044 0.43799C10.2209 0.43799 11.3779 0.669395 12.4815 1.13221C13.5377 1.58315 14.4781 2.221 15.3029 3.04575C16.1276 3.8705 16.7655 4.81096 17.2164 5.86712C17.6792 6.97074 17.9106 8.12777 17.9106 9.3382C17.9106 10.5486 17.6792 11.7057 17.2164 12.8093C16.7655 13.8654 16.1276 14.8059 15.3029 15.6306C14.4781 16.4554 13.5377 17.0932 12.4815 17.5442C11.3779 18.007 10.2209 18.2384 9.01044 18.2384ZM5.89536 11.1182V12.8983H8.12042V14.6783H9.90046V12.8983H10.7905C11.194 12.8983 11.5648 12.7974 11.903 12.5957C12.2412 12.3939 12.5112 12.124 12.7129 11.7858C12.9147 11.4475 13.0155 11.0767 13.0155 10.6732C13.0155 10.2698 12.9147 9.89891 12.7129 9.5607C12.5112 9.22249 12.2412 8.95252 11.903 8.75078C11.5648 8.54905 11.194 8.44818 10.7905 8.44818H7.23039C7.11173 8.44818 7.00789 8.40368 6.91889 8.31467C6.82989 8.22567 6.78538 8.12183 6.78538 8.00317C6.78538 7.8845 6.82989 7.78066 6.91889 7.69166C7.00789 7.60266 7.11173 7.55816 7.23039 7.55816H12.1255V5.77811H9.90046V3.99807H8.12042V5.77811H7.23039C6.82692 5.77811 6.45608 5.87898 6.11787 6.08072C5.77966 6.28246 5.50969 6.55243 5.30795 6.89064C5.10621 7.22885 5.00534 7.59969 5.00534 8.00317C5.00534 8.40664 5.10621 8.77748 5.30795 9.11569C5.50969 9.4539 5.77966 9.72387 6.11787 9.92561C6.45608 10.1273 6.82692 10.2282 7.23039 10.2282H10.7905C10.9091 10.2282 11.013 10.2727 11.102 10.3617C11.191 10.4507 11.2355 10.5546 11.2355 10.6732C11.2355 10.7919 11.191 10.8957 11.102 10.9847C11.013 11.0737 10.9091 11.1182 10.7905 11.1182H5.89536Z" fill="#16A34A"/>
        </svg>
      `
      )
    },
    {
      title: 'Feedback/ Suggestion',
      id: 'feedback',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      svg: this
        .sanitizeSvg(`<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.94691 16.9315L0.229797 17.9818L1.28002 13.2646C0.579872 11.9711 0.229797 10.5768 0.229797 9.08154C0.229797 7.87112 0.461203 6.71409 0.924013 5.61046C1.37496 4.55431 2.01281 3.61385 2.83756 2.7891C3.66231 1.96435 4.60277 1.3265 5.65892 0.875553C6.76255 0.412743 7.91958 0.181337 9.13 0.181337C10.3404 0.181337 11.4975 0.412743 12.6011 0.875553C13.6572 1.3265 14.5977 1.96435 15.4225 2.7891C16.2472 3.61385 16.885 4.55431 17.336 5.61046C17.7988 6.71409 18.0302 7.87112 18.0302 9.08154C18.0302 10.292 17.7988 11.449 17.336 12.5526C16.885 13.6088 16.2472 14.5492 15.4225 15.374C14.5977 16.1987 13.6572 16.8366 12.6011 17.2875C11.4975 17.7503 10.3404 17.9818 9.13 17.9818C7.63477 17.9818 6.2404 17.6317 4.94691 16.9315Z" fill="#3B82F6"/>
        </svg>
      `)
    },
    {
      title: 'Talk To Live Agent Now',
      id: 'call',
      comingSoon: false,
      bgColor: 'common-secondary-blue-color',
      svg: this.sanitizeSvg(
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.0806 6.52139C18.401 6.52139 18.6976 6.6015 18.9706 6.7617C19.2435 6.9219 19.4601 7.13848 19.6203 7.41142C19.7805 7.68435 19.8606 7.98103 19.8606 8.30144V11.8615C19.8606 12.1819 19.7805 12.4786 19.6203 12.7515C19.4601 13.0245 19.2435 13.2411 18.9706 13.4013C18.6976 13.5615 18.401 13.6416 18.0806 13.6416H17.1371C16.9947 14.8045 16.5913 15.8607 15.9267 16.81C15.2622 17.7594 14.4255 18.5011 13.4169 19.0351C12.3726 19.5928 11.2571 19.8717 10.0704 19.8717V18.0917C11.0316 18.0917 11.9276 17.8484 12.7582 17.3618C13.5652 16.8872 14.206 16.2464 14.6807 15.4394C15.1672 14.6087 15.4105 13.7128 15.4105 12.7515V7.41142C15.4105 6.45019 15.1672 5.55424 14.6807 4.72355C14.206 3.9166 13.5652 3.27579 12.7582 2.80111C11.9276 2.31456 11.0316 2.07129 10.0704 2.07129C9.10916 2.07129 8.2132 2.31456 7.38252 2.80111C6.57556 3.27579 5.93475 3.9166 5.46007 4.72355C4.97353 5.55424 4.73025 6.45019 4.73025 7.41142V13.6416H2.06019C1.73979 13.6416 1.44311 13.5615 1.17017 13.4013C0.897232 13.2411 0.680661 13.0245 0.520457 12.7515C0.360253 12.4786 0.280151 12.1819 0.280151 11.8615V8.30144C0.280151 7.98103 0.360253 7.68435 0.520457 7.41142C0.680661 7.13848 0.897232 6.9219 1.17017 6.7617C1.44311 6.6015 1.73979 6.52139 2.06019 6.52139H3.00361C3.14602 5.35843 3.54949 4.30228 4.21404 3.35292C4.87859 2.40357 5.71521 1.66188 6.7239 1.12787C7.76819 0.570124 8.88368 0.29125 10.0704 0.29125C11.2571 0.29125 12.3726 0.570124 13.4169 1.12787C14.4255 1.66188 15.2622 2.40357 15.9267 3.35292C16.5913 4.30228 16.9947 5.35843 17.1371 6.52139H18.0806ZM6.29669 13.4458L7.24011 11.9327C8.1064 12.4786 9.04982 12.7515 10.0704 12.7515C11.0909 12.7515 12.0344 12.4786 12.9006 11.9327L13.8441 13.4458C13.2863 13.8018 12.687 14.0717 12.0462 14.2557C11.4054 14.4396 10.7468 14.5316 10.0704 14.5316C9.39396 14.5316 8.73535 14.4396 8.09453 14.2557C7.45372 14.0717 6.85444 13.8018 6.29669 13.4458Z" fill="#3B82F6"/>
        </svg>
      `
      )
    }
  ];

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({ hidden: true, animation: false });
    this.getShippingType();
  }

  getShippingType() {
    this.isLoading.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success && res.data.length) {
          this.shippingTypeList.set(res.data);
        }
      });
  }

  sanitizeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  onClick(btnId: IDashboardButton['id']) {
    switch (btnId) {
      case 'feedback':
        this.onFeatureRequest();
        break;
      case 'report':
        this.route.navigate(['manage/business-tools/mail-dashboard/report']);
        break;
      case 'group-history':
        // Handle group mailing action
        this.route.navigate([
          'manage/business-tools/mail-dashboard/group-mailing'
        ]);
        break;
      case 'single-mail':
        // Handle single mail action
        this.route.navigate([
          'manage/business-tools/mail-dashboard/single-mail'
        ]);
        break;
      case 'group-mail':
        // Handle group mail action
        this.route.navigate(['manage/business-tools/mail-dashboard/bulk-mail']);
        break;
      case 'call':
        this.goToLiveChat();
        break;
      case 'import':
        this.route.navigate(['manage/cheque/multi_import/step1']);
        break;
      case 'document-mailing':
        this.route.navigate([
          'manage/business-tools/document-mail/add-attachment'
        ]);
        break;
      case 'documentation':
        window.open('https://apiv3.onlinecheckwriter.com/', '_blank');
        break;
      case 'partner':
        window.open('https://onlinecheckwriter.com/contact/', '_blank');
        break;
      case 'reseller':
        window.open('https://onlinecheckwriter.com/contact/', '_blank');
        break;
      case 'bulk-import':
        this.route.navigate([
          'manage/business-tools/mail-dashboard/multi-check-mail-table'
        ]);
        break;
      case 'single-mail-history':
        this.route.navigate([
          'manage/business-tools/mail-dashboard/single-mail-history'
        ]);
        break;
      case 'document-mailing-history':
        this.route.navigate([
          'manage/business-tools/mail-dashboard/document-mail-history'
        ]);
        break;
      default:
        break;
    }
  }

  onFeatureRequest() {
    this.dialog.open(FeatureRequestModalComponent, {
      maxWidth: '100%'
    });
    this.loomService.loomVideos = [];
  }

  goToLiveChat(): void {
    if (this.staticWhiteLabelConditions.zohoSupportChat) {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }
    window.open(this.staticWhiteLabelConditions?.helpWebsite, '_blank');
  }

  getShippingName(name: string, amount: string): string {
    // Remove the amount from the name and return the cleaned name
    if (!name) return '';

    // Remove the amount string from the name if it exists
    const cleanedName = name.replace(amount, '').trim();

    // Additional cleanup to remove any remaining amount patterns
    // This handles cases where amount might be formatted differently
    const amountPattern = /\$[\d,]+\.?\d*/g;
    const finalName = cleanedName.replace(amountPattern, '').trim();

    return finalName;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
