import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IApprovalRequest, ICheck, IZilPayment } from 'src/app/models/user';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgIf, NgFor, NgClass, NgTemplateOutlet } from '@angular/common';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { NumberedTablePaginationComponent } from 'src/app/shared/components/numbered-table-pagination/numbered-table-pagination.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-pending-check-approvals',
  templateUrl: './pending-check-approvals.component.html',
  styleUrls: ['./pending-check-approvals.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    MatTabGroup,
    MatTab,
    NgFor,
    MatTooltip,
    NgClass,
    MatDialogActions,
    NgTemplateOutlet,
    NumberedTablePaginationComponent
  ]
})
export class PendingCheckApprovalsComponent implements OnInit, OnDestroy {
  private paymentServcie = inject(PaymentsService);
  requestData: IApprovalRequest = inject(MAT_DIALOG_DATA);
  private matDialogRef = inject(MatDialogRef);
  private router = inject(Router);
  private checkService = inject(CheckService);
  private localStorageService = inject(LocalStorageService);
  private userService = inject(UserManagementService);
  private destroyRef = inject(DestroyRef);

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
  readonly perPage = 25;
  listLoading = false;

  ngOnInit(): void {
    this.initLoadingMaps();
    this.isMultiLevelPluginEnabled = this.localStorageService.getItem('userPlugins')?.includes('enterprise-steno-agency') ?? false;
  }

  private initLoadingMaps(): void {
    [...this.requestData.zilPayments, ...this.requestData.checks].forEach(
      (el) => {
        this.approveLoading = { ...this.approveLoading, [el.id]: false };
        this.rejectLoading = { ...this.rejectLoading, [el.id]: false };
      }
    );
  }

  onZilPageChange(page: number): void {
    this.fetchPage(page, 'multi');
  }

  onCheckPageChange(page: number): void {
    this.fetchPage(page, 'single');
  }

  private refreshCurrentPage(mode: 'multi' | 'single'): void {
    const pagination =
      mode === 'multi'
        ? this.requestData.pagination
        : this.requestData.checksPagination;
    this.fetchPage(pagination?.currentPage ?? 1, mode);
  }

  private fetchPage(page: number, mode: 'multi' | 'single'): void {
    if (page < 1 || this.listLoading) {
      return;
    }
    this.listLoading = true;
    this.subscriptions.push(
      this.userService
        .getPendingApprovalList({ page, perPage: this.perPage })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.listLoading = false;
            if (!res.success) {
              return;
            }
            if (mode === 'multi') {
              this.requestData.zilPayments = res.data.zilPayments;
              this.requestData.pagination = res.data.pagination;
            } else {
              this.requestData.checks = res.data.checks;
              this.requestData.checksPagination = res.data.checksPagination;
            }
            const list =
              mode === 'multi'
                ? this.requestData.zilPayments
                : this.requestData.checks;
            const currentPage =
              (mode === 'multi'
                ? this.requestData.pagination
                : this.requestData.checksPagination
              )?.currentPage ?? page;
            if (!list.length && currentPage > 1) {
              this.fetchPage(currentPage - 1, mode);
              return;
            }
            this.selectedIds = [];
            this.allSelected = false;
            this.initLoadingMaps();
          },
          error: () => {
            this.listLoading = false;
          }
        })
    );
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
        this.paymentServcie.multiApproveChecks({ ids: data }).subscribe({
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
              this.refreshCurrentPage('multi');
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
              this.refreshCurrentPage('single');
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
        this.paymentServcie.multiRejectChecks({ ids: data }).subscribe({
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
              this.refreshCurrentPage('multi');
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
              this.refreshCurrentPage('single');
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
    this.router.navigate(['/manage/cheque/view/', checkId]);
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

  close() {
    this.matDialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
