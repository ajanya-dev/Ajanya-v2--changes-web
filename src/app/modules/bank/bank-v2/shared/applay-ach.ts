import { Component, inject, OnInit } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { IBankData } from 'src/app/models/bank';
import { toObservable } from '@angular/core/rxjs-interop';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { BankDataV35Service } from '../../bank-v3/v35-services/bank-data-v35.service';

@Component({
  selector: 'app-dt-select-box',
  template: `
    @if (type !== 4 && type !== 5) {
      <fa-icon
        [icon]="['fas', 'circle-check']"
        class="text-common-yellow-color"
        [ngClass]="{ '!text-common-green-color': type === 1 }"
      ></fa-icon>
    }
    @if (type === 5) {
      <fa-icon
        [icon]="['fas', 'triangle-exclamation']"
        class="text-common-red-color pr-1"
      ></fa-icon>
    }
    <span>
      @if (type === 5) {
        <a class="rejected pr-1" title="Rejected">Rejected</a>
      }
      <button
        [ngClass]="{ disable: loading }"
        [class]="class"
        title="{{ title }}"
        (click)="applyAch($event)"
      >
        {{ label }}
        @if (
          bankDataService.selectedBankId() ===
            params.data.encrypted_bankacc_id &&
          fetchingDetails &&
          (type === 4 || type === 5)
        ) {
          <fa-icon class="pl-1" [icon]="faSpinner" animation="spin" />
        }
      </button>
    </span>
  `,
  styles: [
    `
      .style {
        color: var(--extreme-color-opposite);
        padding: 4px 4px;
        border-radius: 3px;
        font-size: 12px;
      }

      .cursor {
        cursor: pointer;
      }

      .ach {
        color: var(--common-green-color);
        font-family: var(--roboto);
        font-size: 13px;
      }

      .name {
        color: var(--text_success);
        font-weight: 900;
      }

      .apply_ach {
        color: var(--common-yellow-color);
        font-size: 13px;
        font-weight: 500;
        font-family: var(--roboto);
      }

      .ach_req {
        color: var(--common-yellow-color);
        font-family: var(--roboto);
        font-size: 13px;
      }

      .rejected {
        color: var(--common-red-color);
        font-size: 13px;
        font-weight: 500;
      }

      .disable {
        pointer-events: none;
        color: #8db1fe !important;
      }
    `
  ],
  standalone: true,
  imports: [FaIconComponent, NgClass]
})
export class ApplayAchComponent implements AgFloatingFilterComponent, OnInit {
  tableId = 9; // Data Table Id
  params!: Params;
  name: string;
  type: number;
  label: string;
  title: string;
  class: string;
  nameClass: string;
  loading = false;
  subscriptions: Subscription[] = [];
  kycKybStatus: { kycStatus: number; kybStatus: number };

  bankDataService = inject(BankDataV35Service);
  personaHelperService = inject(PersonaHelperService);
  statusFetchingSignal$ = toObservable(
    this.bankDataService.statusFetchingSignal
  );

  fetchingDetails = false;
  faSpinner = faSpinner;

  agInit(params: Params): void {
    this.params = params;
    this.name = this.params.data.truncatedBankAccNumber;
    if (this.params.data.ach_application_status === 1) {
      this.type = 1;
      this.label = 'ACH Approved';
      this.title = 'ACH Activated';
      this.class = 'style ach pointer-events-none';
    } else if (this.params.data.ach_application_status === 0) {
      this.type = 2;
      this.label = 'Evaluating Account';
      this.title = 'System will evaluate the account and activate ACH soon';
      this.class = 'style ach_req pointer-events-none';
    } else if (this.params.data.ach_application_status === 2) {
      this.type = 3;
      this.label = 'ACH Document Required';
      this.title = 'Document required for ACH approval';
      this.class = 'style ach_req';
    } else if (
      this.params.data.ach_application_status == null ||
      this.params.data.ach_application_status === ''
    ) {
      this.type = 4;
      this.label = 'Activate ACH';
      this.title = 'Enable ACH ';
      this.class = 'v35-labels underline';
    } else if (this.params.data.ach_application_status === 3) {
      this.type = 5;
      this.label = 'Re-apply';
      this.title = 'Reapply for ACH';
      this.class = 'v35-labels underline';
    }

    if (
      this.params.data.bank_account_nature_type === 2 ||
      this.params.data.bank_name === 'ZilBank'
    ) {
      this.type = 6;
      this.nameClass = 'name';
    }
  }

  ngOnInit(): void {
    this.checkKycKybStatus();
  }

  /**
   * @description This method is used here because we implemented the 'AgFloatingFilterComponent' interface.
   */
  onParentModelChanged() {
    // Nothing here
  }

  /**
   * Checks the status of the application.
   *
   * This method subscribes to the statusFetchingSignal$ Observable to fetch the application status details.
   * Once the status details are fetched, it updates the fetchingDetails property accordingly.
   *
   * @returns {void}
   */
  checkKycKybStatus(): void {
    this.subscriptions.push(
      this.statusFetchingSignal$.subscribe((res) => {
        this.fetchingDetails = res.loading;
        if (res.autoClick) {
          this.bankDataService.applyAchClick(this.params.data as IBankData);
        }
      }),

      this.personaHelperService.kycKybVerifivationResult$.subscribe((res) => {
        if (res?.data.inquiry_type === 'kyb') {
          this.bankDataService.applyAchClick(this.params.data as IBankData);
        }
      })
    );
  }

  applyAch(ev: Event) {
    if (this.fetchingDetails) {
      return;
    }
    this.bankDataService.applyAchClick(this.params.data as IBankData);
    ev.stopPropagation();
  }
}
