import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IApprovalRequest } from 'src/app/models/user';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { NumberedTablePaginationComponent } from 'src/app/shared/components/numbered-table-pagination/numbered-table-pagination.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-pending-payment-approvals',
  templateUrl: './pending-payment-approvals.component.html',
  styleUrls: ['./pending-payment-approvals.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NumberedTablePaginationComponent,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgClass
  ]
})
export class PendingPaymentApprovalsComponent implements OnInit, OnDestroy {
  private paymentServcie = inject(PaymentsService);
  requestData: IApprovalRequest = inject(MAT_DIALOG_DATA);
  private matDialogRef = inject(MatDialogRef);
  private router = inject(Router);
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
  readonly perPage = 25;
  listLoading = false;

  ngOnInit(): void {
    this.initLoadingMaps();
  }

  private initLoadingMaps(): void {
    this.requestData.zilPayments.forEach((el) => {
      this.approveLoading = { ...this.approveLoading, [el.id]: false };
      this.rejectLoading = { ...this.rejectLoading, [el.id]: false };
    });
  }

  onZilPageChange(page: number): void {
    this.fetchPage(page);
  }

  private refreshCurrentPage(): void {
    this.fetchPage(this.requestData.pagination?.currentPage ?? 1);
  }

  private fetchPage(page: number): void {
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
            this.requestData.zilPayments = res.data.zilPayments;
            this.requestData.pagination = res.data.pagination;
            const currentPage = this.requestData.pagination?.currentPage ?? page;
            if (!this.requestData.zilPayments.length && currentPage > 1) {
              this.fetchPage(currentPage - 1);
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
            this.refreshCurrentPage();
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
  }

  rejectCheck(data: string[], multi = false) {
    if (multi) {
      this.allRejectLoading = true;
    } else {
      data.forEach((el) => {
        this.rejectLoading = { ...this.rejectLoading, [el]: true };
      });
    }
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
            this.refreshCurrentPage();
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

  viewCheque(paymentId: string) {
    if(!paymentId) return;
    this.router.navigate(['/manage/payments-table/payment-view/', paymentId]);
    this.close();
  }

  private clearProcessedSelections(ids: string[]) {
    this.selectedIds = this.selectedIds.filter((id) => !ids.includes(id));
    const remaining = this.requestData.zilPayments;
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

  selectAll() {
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
  }

  close() {
    this.matDialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
