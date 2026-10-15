import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, take } from 'rxjs';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  V4ZilSignStatusBadgeComponent,
  zilSignStatusPalette
} from '../v4-zil-sign-status-badge/v4-zil-sign-status-badge.component';
import {
  IActivity,
  IDocumentView,
  IDocumentViewDetails,
  IRecipientView
} from '../../v4-models/v4-zil-sign.models';
import { V4SignDocDetailPanelService } from '../../v4-services/v4-sign-doc-detail-panel.service';

@Component({
  selector: 'app-v4-sign-doc-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    DetailSidePanelComponent,
    V4ZilSignStatusBadgeComponent,
    PdSkeletonComponent,
    PdShowMoreComponent,
    PdDateTimeComponent
  ],
  templateUrl: './v4-sign-doc-detail-panel.component.html'
})
export class V4SignDocDetailPanelComponent {
  private panelService = inject(V4SignDocDetailPanelService);
  private zilSignService = inject(ZilSignService);
  private alert = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);

  isOpen = computed(() => this.panelService.isOpen());

  loading = signal(false);
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
  activityExpanded = signal(false);
  /** Mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  private readonly ACTIVITY_PREVIEW_COUNT = 2;

  // Collapsed panel shows the first entries behind "Show N more"; expanded shows all.
  visibleActivities = computed(() =>
    this.activityExpanded() || this.isPanelExpanded()
      ? this.activities()
      : this.activities().slice(0, this.ACTIVITY_PREVIEW_COUNT)
  );

  hasMoreActivities = computed(
    () =>
      !this.isPanelExpanded() &&
      this.activities().length > this.ACTIVITY_PREVIEW_COUNT
  );

  hiddenActivityCount = computed(
    () => this.activities().length - this.ACTIVITY_PREVIEW_COUNT
  );

  collapsedCards = signal<Record<string, boolean>>({});

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  toggleActivityExpansion(): void {
    this.activityExpanded.update((v) => !v);
  }

  panelTitle = computed(() => {
    const docs = this.documents();
    const name = this.documentDetails().name;
    if (name) return name;
    if (docs.length > 0) return docs[0].name;
    return 'Document Details';
  });

  private readonly HEADER_TITLE_MAX = 40;

  /** Full name on hover, only while the header shows it shortened. */
  panelTitleTooltip = computed(() =>
    !this.isPanelExpanded() && this.panelTitle().length > this.HEADER_TITLE_MAX
      ? this.panelTitle()
      : ''
  );

  /** Header copy of the title: collapsed, long file names are cut in the middle
   *  (keeping the extension); expanded shows the full name. */
  panelHeaderTitle = computed(() => {
    const name = this.panelTitle();
    const max = this.HEADER_TITLE_MAX;
    const tail = 11;
    const short =
      !this.isPanelExpanded() && name.length > max
        ? `${name.slice(0, max - tail - 1)}…${name.slice(-tail)}`
        : name;
    // Zero-width spaces let the header wrap after _ - . and inside long unbroken runs.
    return short
      .replace(/([_.-])/g, '$1\u200B')
      .replace(/([^_.\s\u200B-]{16})/g, '$1\u200B');
  });

  recipientCount = computed(
    () =>
      this.documentDetails().recipientsCount || this.recipients().length || 0
  );

  subtitleParts = computed(() => {
    const count = this.recipientCount();
    const created = this.documentDetails().createdDate;
    return [
      `${count} recipient${count === 1 ? '' : 's'}`,
      created ? `Created ${created}` : ''
    ].filter(Boolean);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    if (this.loading()) return undefined;
    const p = zilSignStatusPalette(this.documentDetails().status ?? '');
    return { text: p.label, color: p.fg, bgColor: p.bg, preserveText: true };
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    if (this.loading()) return [];
    const final = this.isFinalStatus();
    const buttons: IDetailPanelActionButton[] = [
      {
        label: 'Resend document',
        variant: 'primary',
        key: 'resend',
        lucideIcon: 'send',
        disabled: final
      },
      {
        label: 'Download',
        variant: 'outline',
        key: 'download',
        lucideIcon: 'download',
        disabled: !this.hasDownloadable()
      }
    ];
    // Cancel is destructive — it lives in the ⋮ overflow menu while it can still apply.
    if (!final) {
      buttons.push({
        label: 'More actions',
        variant: 'outline',
        key: 'more',
        menuHeading: 'Actions',
        menu: [
          {
            label: 'Cancel request',
            key: 'cancel',
            danger: true,
            lucideIcon: 'x-circle'
          }
        ]
      });
    }
    return buttons;
  });

  hasDownloadable = computed(() => {
    const docs = this.documents();
    return docs.length > 0 || !!this.documentDetails().pdfUrl;
  });

  isFinalStatus = computed(() => {
    const s = this.documentDetails().status;
    return s === 'signed' || s === 'completed' || s === 'cancelled';
  });

  onActionButtonClicked(key: string): void {
    if (key === 'download') {
      this.downloadFirstDocument();
    } else if (key === 'resend') {
      this.resendDocument();
    } else if (key === 'cancel') {
      this.cancelRequest();
    }
  }

  private downloadFirstDocument(): void {
    const pdfUrl = this.documentDetails().pdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }
    const first = this.documents()[0];
    if (first?.url) {
      window.open(first.url, '_blank');
      return;
    }
    this.downloadDocument(first?.id);
  }

  constructor() {
    effect(
      () => {
        const id = this.panelService.documentId();
        if (this.panelService.isOpen() && id) {
          this.collapsedCards.set({});
          this.loadDocumentDetails(id);
          this.loadActivities(id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  private currentId(): string | null {
    return this.panelService.documentId();
  }

  loadDocumentDetails(id: string): void {
    this.loading.set(true);
    this.documentDetails.set({
      id: '',
      status: 'pending',
      createdDate: '',
      recipientsCount: 0,
      description: ''
    });
    this.documents.set([]);
    this.recipients.set([]);
    this.activities.set([]);
    this.activityExpanded.set(false);
    this.zilSignService
      .getDocumentViewDetails(id)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false))
      )
      .subscribe((response) => {
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
        }
      });
  }

  loadActivities(id: string): void {
    this.loadingActivities.set(true);
    this.zilSignService
      .getDocumentActivities(id)
      .pipe(
        take(1),
        finalize(() => this.loadingActivities.set(false))
      )
      .subscribe((response) => {
        if (response.success && response.data) {
          this.activities.set(response.data);
        }
      });
  }

  getInitials(name: string): string {
    const parts = name?.split(' ') || [];
    const first = parts[0]?.charAt(0) || '';
    const second =
      parts.length > 1 ? parts[1]?.charAt(0) : parts[0]?.charAt(1) || '';
    return (first + second).toUpperCase();
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

  viewDocument(documentId: string): void {
    const pdfUrl = this.documentDetails().pdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }
    const id = this.currentId();
    if (!id) return;
    this.zilSignService
      .downloadDocument(id, documentId)
      .pipe(take(1))
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      });
  }

  downloadDocument(fileId?: string): void {
    const docs = this.documents();
    const matched = docs.find((d) => d.id === fileId);
    if (matched?.url) {
      window.open(matched.url, '_blank');
      return;
    }
    const id = this.currentId();
    if (!id) return;
    this.zilSignService
      .downloadDocument(id, fileId)
      .pipe(take(1))
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      });
  }

  resendDocument(): void {
    if (this.isResendDisabled()) return;
    const id = this.currentId();
    if (!id) return;
    this.zilSignService
      .resendDocument(id)
      .pipe(take(1))
      .subscribe((res) => {
        if (res.success) {
          this.alert.successAlert({
            content: 'Document resent successfully',
            title: 'Success'
          });
          this.loadActivities(id);
        }
      });
  }

  cancelRequest(): void {
    if (this.isCancelDisabled()) return;
    const id = this.currentId();
    if (!id) return;
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
          .cancelDocument(id)
          .pipe(take(1))
          .subscribe((res) => {
            if (res.success) {
              this.alert.successAlert({
                content: 'Document request cancelled successfully',
                title: 'Success'
              });
              this.loadDocumentDetails(id);
              this.loadActivities(id);
              this.v3DataTableService.refreshV3DataTable();
            }
          });
      });
  }

  onClose(): void {
    this.panelService.close();
  }
}
