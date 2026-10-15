import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { IApprovalRequest, ICheck, IZilPayment } from 'src/app/models/user';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * V4 parallel of the v3 PendingCheckApprovalsComponent.
 * Displays payments/checks awaiting approval and lets the user approve or
 * reject them individually or in bulk. When the multi-level plugin
 * (`enterprise-steno-agency`) is enabled, only the unified zilPayments table
 * is shown (with per-row `canApprove` gating); otherwise it splits into
 * multi-signature and single-signature tabs.
 */
@Component({
  selector: 'app-pending-check-approvals-v4',
  standalone: true,
  templateUrl: './pending-check-approvals-v4.component.html',
  imports: [CommonModule, MatTabGroup, MatTab, MatTooltip, LucideAngularModule]
})
export class PendingCheckApprovalsV4Component implements OnInit, OnDestroy {
  private paymentService = inject(PaymentsService);
  requestData: IApprovalRequest = inject(MAT_DIALOG_DATA);
  private matDialogRef = inject(MatDialogRef<PendingCheckApprovalsV4Component>);
  private router = inject(Router);
  private checkService = inject(CheckService);
  private localStorageService = inject(LocalStorageService);

  selectedIds: string[] = [];
  approvedIds: string[] = [];
  rejectedIds: string[] = [];
  approveLoading: Record<string, boolean> = {};
  rejectLoading: Record<string, boolean> = {};
  allApproveLoading = false;
  allRejectLoading = false;
  allSelected = false;
  subscriptions: Subscription[] = [];
  mode: 'single' | 'multi' = 'multi';
  isMultiLevelPluginEnabled: boolean;

  ngOnInit(): void {
    this.requestData.zilPayments.forEach((el) => {
      this.approveLoading = { ...this.approveLoading, [el.id]: false };
      this.rejectLoading = { ...this.rejectLoading, [el.id]: false };
    });
    this.isMultiLevelPluginEnabled =
      (this.localStorageService.getItem('userPlugins') as string[] | null)?.includes(
        'enterprise-steno-agency'
      ) ?? false;
  }

  approveCheck(data: string[], multi = false) {
    if (multi) {
      this.allApproveLoading = true;
    } else {
      data.forEach((el) => {
        this.approveLoading = { ...this.approveLoading, [el]: true };
      });
    }
    if (this.mode === 'multi') {
      this.subscriptions.push(
        this.paymentService.multiApproveChecks({ ids: data }).subscribe({
          next: (res) => {
            if (multi) {
              this.allApproveLoading = false;
            }
            if (res) {
              this.approvedIds = [...this.approvedIds, ...data];
              data.forEach((id) => {
                if (!multi) {
                  this.approveLoading = { ...this.approveLoading, [id]: false };
                }
                const index = this.requestData.zilPayments.findIndex(
                  (el) => el.id === id
                );
                if (index >= 0) {
                  this.requestData.zilPayments.splice(index, 1);
                }
              });
              this.clearProcessedSelections(data);
            }
          },
          error: () => {
            if (multi) {
              this.allApproveLoading = false;
            }
            data.forEach((id) => {
              if (!multi) {
                this.approveLoading = { ...this.approveLoading, [id]: false };
              }
            });
          }
        })
      );
    } else if (this.mode === 'single') {
      this.subscriptions.push(
        this.checkService.approveCheck({ ids: data }).subscribe({
          next: (res) => {
            if (res.success) {
              this.allApproveLoading = false;
              data.forEach((id) => {
                if (!multi) {
                  this.approveLoading = { ...this.approveLoading, [id]: false };
                }
                const index = this.requestData.checks.findIndex(
                  (el) => el.id === id
                );
                if (index >= 0) {
                  this.requestData.checks.splice(index, 1);
                }
              });
              this.clearProcessedSelections(data);
            }
          },
          error: () => {
            this.allApproveLoading = false;
            data.forEach((id) => {
              if (!multi) {
                this.approveLoading = { ...this.approveLoading, [id]: false };
              }
            });
          }
        })
      );
    }
  }

  onTabChanges(ev: { index: number }) {
    this.selectedIds = [];
    if (ev.index === 0) {
      this.mode = 'multi';
    } else if (ev.index === 1) {
      this.mode = 'single';
    }
  }

  rejectCheck(data: string[], multi = false) {
    if (multi) {
      this.allRejectLoading = true;
    } else {
      data.forEach((el) => {
        this.rejectLoading = { ...this.rejectLoading, [el]: true };
      });
    }
    if (this.mode === 'multi') {
      this.subscriptions.push(
        this.paymentService.multiRejectChecks({ ids: data }).subscribe({
          next: (res) => {
            if (res) {
              if (multi) {
                this.allRejectLoading = false;
              }
              this.rejectedIds = [...this.rejectedIds, ...data];
              data.forEach((id) => {
                if (!multi) {
                  this.rejectLoading = { ...this.rejectLoading, [id]: false };
                }
                const index = this.requestData.zilPayments.findIndex(
                  (el) => el.id === id
                );
                if (index >= 0) {
                  this.requestData.zilPayments.splice(index, 1);
                }
              });
              this.clearProcessedSelections(data);
            }
          },
          error: () => {
            data.forEach((id) => {
              if (!multi) {
                this.rejectLoading = { ...this.rejectLoading, [id]: false };
              }
            });
          }
        })
      );
    } else if (this.mode === 'single') {
      this.subscriptions.push(
        this.checkService.rejectCheck({ ids: data }).subscribe({
          next: (res) => {
            if (res.success) {
              if (multi) {
                this.allRejectLoading = false;
              }
              this.rejectedIds = [...this.rejectedIds, ...data];
              data.forEach((id) => {
                if (!multi) {
                  this.rejectLoading = { ...this.rejectLoading, [id]: false };
                }
                const index = this.requestData.checks.findIndex(
                  (el) => el.id === id
                );
                if (index >= 0) {
                  this.requestData.checks.splice(index, 1);
                }
              });
              this.clearProcessedSelections(data);
            }
          },
          error: () => {
            data.forEach((id) => {
              if (!multi) {
                this.rejectLoading = { ...this.rejectLoading, [id]: false };
              }
            });
          }
        })
      );
    }
  }

  viewCheque(checkId: string) {
    this.router.navigate(['/v4/manage/cheque/view/', checkId]);
    this.close();
  }

  private clearProcessedSelections(ids: string[]) {
    this.selectedIds = this.selectedIds.filter((id) => !ids.includes(id));
    const remaining =
      this.mode === 'multi'
        ? this.requestData.zilPayments
        : this.requestData.checks;
    this.allSelected =
      remaining.length > 0 && this.selectedIds.length === remaining.length;
  }

  selectRequest(id: string) {
    const index = this.selectedIds.findIndex((el) => el === id);
    if (index >= 0) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  selectAll(singleSignature = false) {
    if (!singleSignature) {
      if (!this.requestData.zilPayments.length) {
        return;
      }
      if (!this.allSelected) {
        this.selectedIds = [];
        this.requestData.zilPayments.forEach((el) => {
          if (!this.rejectedIds.includes(el.id) && el.canApprove) {
            this.selectedIds.push(el.id);
          }
        });
        this.allSelected = true;
      } else {
        this.selectedIds = [];
        this.allSelected = false;
      }
    } else {
      if (!this.requestData.zilPayments.length) {
        return;
      }
      if (!this.allSelected) {
        this.selectedIds = [];
        this.requestData.checks.forEach((el) => {
          if (!this.rejectedIds.includes(el.id)) {
            this.selectedIds.push(el.id);
          }
        });
        this.allSelected = true;
      } else {
        this.selectedIds = [];
        this.allSelected = false;
      }
    }
  }

  trackByFn(index: number, val: IZilPayment | ICheck) {
    return val.id;
  }

  /** True while any approve/reject action (single or bulk) is in flight. */
  get isAnyActionLoading(): boolean {
    return (
      this.allApproveLoading ||
      this.allRejectLoading ||
      Object.values(this.approveLoading).some(Boolean) ||
      Object.values(this.rejectLoading).some(Boolean)
    );
  }

  close() {
    this.matDialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
