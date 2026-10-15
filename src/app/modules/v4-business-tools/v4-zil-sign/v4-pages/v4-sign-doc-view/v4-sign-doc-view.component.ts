import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ZilSignStatusBadgeComponent } from '../../v4-components/v4-zil-sign-status-badge/v4-zil-sign-status-badge.component';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IActivity,
  IDocumentView,
  IDocumentViewDetails,
  IRecipientView
} from '../../v4-models/v4-zil-sign.models';

@Component({
  selector: 'app-v4-sign-doc-view',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    V4ZilSignStatusBadgeComponent
  ],
  templateUrl: './v4-sign-doc-view.component.html',
  styleUrls: ['./v4-sign-doc-view.component.scss']
})
export class V4SignDocViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zilSignService = inject(ZilSignService);
  private alert = inject(V4AlertService);
  private headerService = inject(HeaderService);

  documentId = '';
  loading = signal(true);
  loadingActivities = signal(false);
  documentDetails = signal<IDocumentViewDetails>({
    id: '',
    status: 'pending',
    createdDate: '',
    recipientsCount: 0,
    description: ''
  });
  documents = signal<IDocumentView[]>([]);
  recipients = signal<IRecipientView[]>([]);
  activities = signal<IActivity[]>([]);

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.documentId = this.route.snapshot.params['id'];
    if (!this.documentId) {
      this.alert.failedAlert({
        content: 'Document ID is required',
        title: 'Error'
      });
      this.loading.set(false);
      return;
    }
    this.loadDocumentDetails();
    this.loadActivities();
  }

  loadDocumentDetails(): void {
    this.loading.set(true);
    this.zilSignService
      .getDocumentViewDetails(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const data = response.data;
            this.documentDetails.set(data);
            this.documents.set(data.documents || []);
            this.recipients.set(data.recipients || []);
            if (data.pdfUrl && (!data.documents || data.documents.length === 0)) {
              this.documents.set([
                {
                  id: data.id,
                  name: data.name || 'Document',
                  url: data.pdfUrl,
                  size: 'N/A',
                  pages: 0
                }
              ]);
            }
            if (
              data.recipientsCount === undefined &&
              this.recipients().length > 0
            ) {
              this.documentDetails.update((d) => ({
                ...d,
                recipientsCount: this.recipients().length
              }));
            }
          } else {
            this.alert.failedAlert({
              content: 'Failed to load document details',
              title: 'Error'
            });
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to load document details',
            title: 'Error'
          });
          this.loading.set(false);
        }
      });
  }

  loadActivities(): void {
    this.loadingActivities.set(true);
    this.zilSignService
      .getDocumentActivities(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.activities.set(response.data);
          }
          this.loadingActivities.set(false);
        },
        error: () => {
          this.loadingActivities.set(false);
        }
      });
  }

  getInitials(name: string): string {
    const nameParts = name?.split(' ') || [];
    const firstName = nameParts[0]?.charAt(0) || '';
    const lastName =
      nameParts.length > 1
        ? nameParts[1]?.charAt(0)
        : nameParts[0]?.charAt(1) || '';
    return (firstName + lastName).toUpperCase();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'created':
        return 'file-plus-2';
      case 'sent':
        return 'send';
      case 'signed':
        return 'check-circle-2';
      case 'cancelled':
        return 'x-circle';
      case 'resent':
        return 'refresh-cw';
      default:
        return 'circle-dot';
    }
  }

  getActivityIconColor(type: string): { bg: string; fg: string } {
    switch (type) {
      case 'created':
        return {
          bg: 'var(--v4-badge-info-bg-color)',
          fg: 'var(--v4-common-sky-color)'
        };
      case 'sent':
      case 'resent':
        return {
          bg: 'var(--v4-badge-success-bg-color)',
          fg: 'var(--v4-common-green-color)'
        };
      case 'signed':
        return {
          bg: 'var(--v4-badge-accent-bg-color)',
          fg: 'var(--v4-common-violet-color)'
        };
      case 'cancelled':
        return {
          bg: 'var(--v4-badge-error-bg-color)',
          fg: 'var(--v4-common-red-color)'
        };
      default:
        return {
          bg: 'var(--v4-input-background-color)',
          fg: 'var(--v4-secondary-text-color)'
        };
    }
  }

  isResendDisabled(): boolean {
    const s = this.documentDetails().status;
    return s === 'signed' || s === 'completed' || s === 'cancelled';
  }

  isCancelDisabled(): boolean {
    const s = this.documentDetails().status;
    return s === 'signed' || s === 'completed' || s === 'cancelled';
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/zil-sign']);
  }

  viewDocument(documentId: string): void {
    const pdfUrl = this.documentDetails().pdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }
    this.router.navigate([
      '/v4/manage/v4-business-tools/zil-sign/sign-pdf-viewer',
      documentId
    ]);
  }

  downloadDocument(fileId?: string): void {
    const docs = this.documents();
    const matched = docs.find(
      (d) => d.id === fileId || d.id === this.documentId
    );
    if (matched?.url) {
      window.open(matched.url, '_blank');
      return;
    }
    this.zilSignService
      .downloadDocument(this.documentId, fileId)
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        },
        error: (err) => {
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to open document',
            title: 'Error'
          });
        }
      });
  }

  downloadAll(): void {
    const pdfUrl = this.documentDetails().pdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }
    if (this.documents().length === 0) {
      this.alert.failedAlert({
        content: 'No documents available',
        title: 'Error'
      });
      return;
    }
    const first = this.documents()[0];
    if (first?.url) {
      window.open(first.url, '_blank');
      return;
    }
    this.downloadDocument();
  }

  resendDocument(): void {
    if (this.isResendDisabled()) return;
    this.zilSignService
      .resendDocument(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alert.successAlert({
              content: 'Document resent successfully',
              title: 'Success'
            });
            this.loadActivities();
          } else {
            this.alert.failedAlert({
              content: 'Failed to resend document',
              title: 'Error'
            });
          }
        },
        error: (err) => {
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to resend document',
            title: 'Error'
          });
        }
      });
  }

  cancelRequest(): void {
    if (this.isCancelDisabled()) return;
    this.alert
      .confirmAlert({
        content: 'Are you sure you want to cancel this document request?',
        cancelMsg: 'No',
        doneMsg: 'Yes, Cancel it',
        title: 'Confirm'
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.zilSignService
          .cancelDocument(this.documentId)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alert.successAlert({
                  content: 'Document request cancelled successfully',
                  title: 'Success'
                });
                this.loadDocumentDetails();
                this.loadActivities();
              } else {
                this.alert.failedAlert({
                  content: 'Failed to cancel document request',
                  title: 'Error'
                });
              }
            },
            error: (err) => {
              this.alert.failedAlert({
                content:
                  err?.error?.message || 'Failed to cancel document request',
                title: 'Error'
              });
            }
          });
      });
  }
}
