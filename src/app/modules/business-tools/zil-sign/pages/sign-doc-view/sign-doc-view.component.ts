import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFilePdf,
  faEye,
  faDownload,
  faCheck,
  faFileLines,
  faPaperPlane,
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ZilSignService } from '../../service/zil-sign.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IDocumentViewDetails,
  IActivity,
  IDocumentView,
  IRecipientView
} from '../../model/zil-sing.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-sign-doc-view',
  standalone: true,
  imports: [CommonModule, FaIconComponent, CommonButtonV35Component],
  templateUrl: './sign-doc-view.component.html',
  styleUrl: './sign-doc-view.component.scss'
})
export class SignDocViewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zilSignService = inject(ZilSignService);
  private alertService = inject(AlertService);

  documentId: string = '';
  loading = true;
  loadingActivities = false;

  // Icons
  faFilePdf = faFilePdf;
  faEye = faEye;
  faDownload = faDownload;
  faCheck = faCheck;
  faFileLines = faFileLines;
  faPaperPlane = faPaperPlane;
  faArrowLeft = faArrowLeft;

  documents: IDocumentView[] = [];
  recipients: IRecipientView[] = [];
  fields: Array<{
    id: string | number;
    type: string;
    x: string | number;
    y: string | number;
    width: string | number;
    height: string | number;
    pageNumber: number;
    recipientId?: number | null;
    label?: string | null;
  }> = [];
  documentDetails: IDocumentViewDetails = {
    id: '',
    status: 'pending',
    createdDate: '',
    sentFrom: {
      name: '',
      email: ''
    },
    recipientsCount: 0,
    description: ''
  };
  activities: IActivity[] = [];

  ngOnInit(): void {
    this.documentId = this.route.snapshot.params['id'];
    if (!this.documentId) {
      this.alertService.failedAlert({
        content: 'Document ID is required',
        title: 'Error'
      });
      this.loading = false;
      return;
    }
    this.loadDocumentDetails();
    this.loadActivities();
  }

  /**
   * Load document details from API
   */
  loadDocumentDetails(): void {
    this.loading = true;
    this.zilSignService
      .getDocumentViewDetails(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.documentDetails = response.data;
            this.documents = response.data.documents || [];
            this.recipients = response.data.recipients || [];
            this.fields = response.data.fields || [];
            
            if (response.data.pdfUrl && this.documents.length === 0) {
              this.documents = [{
                id: response.data.id,
                name: response.data.name || 'Document',
                url: response.data.pdfUrl,
                size: 'N/A',
                pages: 0
              }];
            }
            
            if (response.data.recipientsCount === undefined && this.recipients.length > 0) {
              this.documentDetails.recipientsCount = this.recipients.length;
            }
            
            this.loading = false;
          } else {
            this.alertService.failedAlert({
              content: 'Failed to load document details',
              title: 'Error'
            });
            this.loading = false;
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to load document details',
            title: 'Error'
          });
          this.loading = false;
        }
      });
  }

  /**
   * Load activities/audit log from API
   */
  loadActivities(): void {
    this.loadingActivities = true;
    this.zilSignService
      .getDocumentActivities(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.activities = response.data;
          }
          this.loadingActivities = false;
        },
        error: (error) => {
          this.loadingActivities = false;
        }
      });
  }

  /**
   * Get initials from name
   */
  getInitials(name: string): string {
    const nameParts = name?.split(' ') || [];
    const firstName = nameParts[0]?.charAt(0) || '';
    const lastName =
      nameParts.length > 1
        ? nameParts[1]?.charAt(0)
        : nameParts[0]?.charAt(1) || '';
    return (firstName + lastName).toUpperCase();
  }

  /**
   * View document - Navigate to PDF viewer or open URL
   */
  viewDocument(documentId: string): void {
    if (this.documentDetails.pdfUrl) {
      window.open(this.documentDetails.pdfUrl, '_blank');
      return;
    }
    
    this.router.navigate([
      'manage/business-tools/zil-sign/sign-pdf-viewer',
      documentId
    ]);
  }

  /**
   * Download single document
   */
  downloadDocument(documentId: string, fileId?: string): void {
    const doc = this.documents.find(d => d.id === fileId || d.id === documentId);
    if (doc?.url) {
      window.open(doc.url, '_blank');
      return;
    }
    
    // Otherwise use API download and open in new tab
    this.zilSignService
      .downloadDocument(this.documentId, fileId)
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 100);
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to open document',
            title: 'Error'
          });
        }
      });
  }

  /**
   * Download all documents - Opens in new page
   */
  downloadAll(): void {
    if (this.documentDetails.pdfUrl) {
      window.open(this.documentDetails.pdfUrl, '_blank');
      return;
    }
    
    if (this.documents.length === 0) {
      this.alertService.failedAlert({
        content: 'No documents available',
        title: 'Error'
      });
      return;
    }

    const doc = this.documents[0];
    if (doc?.url) {
      window.open(doc.url, '_blank');
      return;
    }

    this.downloadDocument(this.documentId);
  }

  /**
   * Resend document
   */
  resendDocument(): void {
    if (this.isResendDisabled()) {
      return;
    }
    this.zilSignService
      .resendDocument(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.alertService.successAlert({
              content: 'Document resent successfully',
              title: 'Success'
            });
            this.loadActivities();
          } else {
            this.alertService.failedAlert({
              content: 'Failed to resend document',
              title: 'Error'
            });
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to resend document',
            title: 'Error'
          });
        }
      });
  }

  /**
   * Cancel request
   */
  cancelRequest(): void {
    if (this.isCancelDisabled()) {
      return;
    }
    this.alertService.confirmAlert({  
      content: 'Are you sure you want to cancel this document request?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Cancel it!',
      title: 'Confirm'
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.zilSignService
        .cancelDocument(this.documentId)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.alertService.successAlert({
                content: 'Document request cancelled successfully',
                title: 'Success'
              });
              this.loadDocumentDetails();
              this.loadActivities();
            } else {
              this.alertService.failedAlert({
                content: 'Failed to cancel document request',
                title: 'Error'
              });
            }
          },
          error: (error) => {
            this.alertService.failedAlert({
              content:
                error?.error?.message || 'Failed to cancel document request',
              title: 'Error'
            });
          }
        });
      }
    });
    
  }

  /**
   * Duplicate document
   */
  duplicateDocument(): void {
    if (this.isDuplicateDisabled()) {
      return;
    }
    this.zilSignService
      .duplicateDocument(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.alertService.successAlert({
              content: 'Document duplicated successfully',
              title: 'Success'
            });
            if (response.data) {
              this.router.navigate([
                'manage/business-tools/zil-sign/sign-doc-view',
                response.data.id
              ]);
            }
          } else {
            this.alertService.failedAlert({
              content: 'Failed to duplicate document',
              title: 'Error'
            });
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to duplicate document',
            title: 'Error'
          });
        }
      });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['manage/business-tools/zil-sign']);
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): any {
    switch (type) {
      case 'created':
        return faFileLines;
      case 'sent':
        return faPaperPlane;
      case 'signed':
        return faCheck;
      case 'cancelled':
        return faFileLines;
      case 'resent':
        return faPaperPlane;
      default:
        return faFileLines;
    }
  }

  /**
   * Get activity icon color class
   */
  getActivityIconColor(type: string): string {
    switch (type) {
      case 'created':
        return 'bg-common-secondary-blue-color text-common-blue-color';
      case 'sent':
      case 'resent':
        return 'bg-common-secondary-green-color text-common-green-color';
      case 'signed':
        return 'bg-common-secondary-violet-color text-common-violet-color';
      case 'cancelled':
        return 'bg-common-secondary-red-color text-common-red-color';
      default:
        return 'bg-secondary-background-color text-secondary-text-color';
    }
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    if (status === 'pending') {
      return 'Pending';
    } else if (status === 'in_progress') {
      return 'In progress';
    } else if (status === 'signed') {
      return 'Signed';
    } else {
      return 'Cancelled';
    }
  }

  /**
   * Get status CSS classes
   */
  getStatusClasses(status: string): string {
    if (status === 'pending') {
      return 'bg-common-secondary-yellow-color text-common-yellow-color';
    } else if (status === 'in_progress') {
      return 'bg-common-secondary-blue-color text-common-blue-color';
    } else if (status === 'signed') {
      return 'bg-common-secondary-green-color text-common-green-color';
    } else {
      return 'bg-common-secondary-red-color text-common-red-color';
    }
  }

  /**
   * Check if resend button should be disabled
   */
  isResendDisabled(): boolean {
    return this.documentDetails.status === 'signed' || 
           this.documentDetails.status === 'cancelled';
  }

  /**
   * Check if cancel button should be disabled
   */
  isCancelDisabled(): boolean {
    return this.documentDetails.status === 'signed' || 
           this.documentDetails.status === 'cancelled';
  }

  /**
   * Check if duplicate button should be disabled
   */
  isDuplicateDisabled(): boolean {
    return this.documentDetails.status === 'cancelled';
  }
}
