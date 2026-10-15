import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { IBankData } from 'src/app/models/bank';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankDataV35Service } from '../../../../bank-v3/v35-services/bank-data-v35.service';
import { BankDataV4Service } from '../../../../bank-v4/v4-services/bank-data-v4.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';

@Component({
  selector: 'app-ach-status-cell-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    @if (type !== 6) {
      <div class="flex gap-1 items-center w-full">
        <div>
          @if (type === 1) {
            <span class="status-badge status-completed">ACH Approved</span>
          } @else if (type === 2) {
            <span class="status-badge status-processing">
              Evaluating Account
            </span>
          } @else if (type === 3) {
            <span
              class="status-badge status-pending status-badge--clickable"
              matTooltip="Upload the requested document to finish ACH activation"
              (click)="applyAch($event)"
            >
              ACH Document Required
            </span>
          } @else if (type === 4) {
            <button
              class="ach-v4-action-link"
              matTooltip="Apply to activate ACH payments for this bank account"
              (click)="applyAch($event)"
            >
              Activate ACH
              @if (showSpinner) {
                <lucide-icon name="loader-circle" [size]="12" class="spin-animation"></lucide-icon>
              }
            </button>
          } @else if (type === 5) {
            <span class="status-badge status-failed">Rejected</span>
            <button
              class="ach-v4-action-link"
              matTooltip="Submit a new ACH application for this bank account"
              (click)="applyAch($event)"
            >
              Re-apply
              @if (showSpinner) {
                <lucide-icon name="loader-circle" [size]="12" class="spin-animation"></lucide-icon>
              }
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ach-v4-action-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0 4px;
        text-decoration: underline;
        text-underline-offset: 2px;
        color: var(--v4-common-blue-color);

        &:hover {
          opacity: 0.8;
        }
      }

      .spin-animation {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class AchStatusCellV4Component
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  bankDataService = inject(BankDataV35Service);
  private bankDataV4Service = inject(BankDataV4Service);
  private personaHelperService = inject(PersonaHelperService);
  params!: Params;
  type: number;
  fetchingDetails = false;
  subscriptions: Subscription[] = [];

  private statusFetchingSignal$ = toObservable(
    this.bankDataService.statusFetchingSignal
  );

  get showSpinner(): boolean {
    return (
      this.bankDataService.selectedBankId() ===
        this.params.data.encrypted_bankacc_id &&
      this.fetchingDetails &&
      (this.type === 4 || this.type === 5)
    );
  }

  agInit(params: Params): void {
    this.params = params;

    const isNeoBank =
      this.params.data.bank_account_nature_type === 2 ||
      this.params.data.bank_name === 'ZilBank';

    if (this.params.data.ach_application_status === 1) {
      this.type = 1;
    } else if (this.params.data.ach_application_status === 0) {
      this.type = 2;
    } else if (this.params.data.ach_application_status === 2) {
      this.type = 3;
    } else if (
      this.params.data.ach_application_status == null ||
      this.params.data.ach_application_status === ''
    ) {
      this.type = isNeoBank ? 6 : 4;
    } else if (this.params.data.ach_application_status === 3) {
      this.type = 5;
    } else if (isNeoBank) {
      this.type = 6;
    }
  }

  refresh(): boolean {
    return true;
  }

  ngOnInit(): void {
    this.checkKycKybStatus();
  }

  checkKycKybStatus(): void {
    this.subscriptions.push(
      this.statusFetchingSignal$.subscribe((res) => {
        this.fetchingDetails = res.loading;
        if (res.autoClick) {
          this.bankDataV4Service.applyAchClick(this.params.data as IBankData);
        }
      }),

      this.personaHelperService.kycKybVerifivationResult$.subscribe((res) => {
        if (res?.data.inquiry_type === 'kyb') {
          this.bankDataV4Service.applyAchClick(this.params.data as IBankData);
        }
      })
    );
  }

  applyAch(ev: Event) {
    if (this.fetchingDetails) {
      return;
    }
    this.bankDataV4Service.applyAchClick(this.params.data as IBankData);
    ev.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
