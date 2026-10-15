import {
  Component,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { File as FileIcon, LucideAngularModule } from 'lucide-angular';
import { finalize, Subscription } from 'rxjs';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { JpgPngModalV4Component } from '../../modals/jpg-png-modal-v4/jpg-png-modal-v4.component';

interface ISupportMessage {
  senderType: number;
  userName: string;
  createdAt: string;
  message: string;
  file: string;
  attachments: {
    id: string;
    type: string;
    imgUrl?: string;
    fileName?: string;
    file_name?: string;
    name?: string;
  }[];
}

interface ITicketRow {
  id: number;
  support_ticket: string;
  subject: string;
  status: number;
  severity: number;
  created_at?: string;
}

@Component({
  selector: 'app-support-ticket-drawer-v4',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    FormsModule,
    CommonButtonV4Component,
    MatTooltipModule,
    PdSkeletonComponent
  ],
  templateUrl: './support-ticket-drawer-v4.component.html'
})
export class SupportTicketDrawerV4Component implements OnChanges, OnDestroy {
  private supportService = inject(UserSupportService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);

  row = input<ITicketRow | null>(null);
  /** The host panel's expanded (two-column) state. */
  expanded = input(false);
  closeDrawer = output<void>();
  statusChanged = output<number>();
  processingChange = output<boolean>();

  readonly FileIcon = FileIcon;

  messages = signal<ISupportMessage[]>([]);
  replyError = signal(false);
  loading = signal(true);
  sending = signal(false);
  uploading = signal(false);
  attachArray = signal<{ id: string; imageName: string }[]>([]);
  messageText = '';

  private subscriptions: Subscription[] = [];
  private previewDialogRef?: MatDialogRef<JpgPngModalV4Component>;
  private isOpeningPreview = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['row']) {
      const r = this.row();
      if (r?.id) {
        this.loadMessages(r.id);
      }
    }
  }

  get isOpen(): boolean {
    return this.row()?.status === 1;
  }

  get conversationCount(): number {
    return this.messages().length > 1 ? this.messages().length - 1 : 0;
  }

  get firstMessage(): ISupportMessage | undefined {
    return this.messages()[0];
  }

  get conversationMessages(): ISupportMessage[] {
    return this.messages().slice(1);
  }

  get lastReply(): string {
    const replies = this.conversationMessages;
    const last = replies[replies.length - 1];
    return last
      ? `Last reply ${this.toMonthFirst(last.createdAt).slice(0, 10)}`
      : 'No replies yet';
  }

  private loadMessages(id: number): void {
    this.loading.set(true);
    this.subscriptions.push(
      this.supportService
        .getmessages(String(id))
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res) => {
          if (res.data) {
            this.messages.set(res.data);
          }
        })
    );
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text && this.attachArray().length === 0) {
      this.replyError.set(true);
      return;
    }
    if (this.sending()) return;
    this.replyError.set(false);

    const row = this.row();
    if (!row) return;

    this.sending.set(true);
    const attachmentIds = this.attachArray().map((a) => a.id);

    this.subscriptions.push(
      this.supportService
        .supportQuestion(String(row.id), {
          message: text,
          attachmentIds
        })
        .pipe(finalize(() => this.sending.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.messageText = '';
            this.attachArray.set([]);
            this.loadMessages(row.id);
          }
        })
    );
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    if (this.attachArray().length >= 3) {
      this.alertService.warningAlert({ content: 'Maximum 3 files allowed' });
      return;
    }

    this.uploading.set(true);
    const form = new FormData();
    form.append('attachment', input.files[0]);
    const fileName = input.files[0].name;

    this.subscriptions.push(
      this.supportService
        .addAttachments(form)
        .pipe(finalize(() => this.uploading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.attachArray.update((arr) => [
              ...arr,
              { id: res.data.id, imageName: fileName }
            ]);
          }
        })
    );

    input.value = '';
  }

  removeAttachment(id: string, index: number): void {
    this.subscriptions.push(
      this.supportService.deleteAttachment(id).subscribe((res) => {
        if (res.success) {
          this.attachArray.update((arr) => arr.filter((_, i) => i !== index));
        }
      })
    );
  }

  getAttachmentName(att: ISupportMessage['attachments'][number]): string {
    return att.fileName || att.file_name || att.name || att.type;
  }

  downloadAttachment(
    event: Event,
    att: ISupportMessage['attachments'][number]
  ): void {
    event.stopPropagation();
    this.subscriptions.push(
      this.supportService.openAttachment(att.id).subscribe((res) => {
        if (res.success && res.data.url) {
          const link = document.createElement('a');
          link.href = res.data.url;
          link.download = this.getAttachmentName(att);
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      })
    );
  }

  viewAttachment(type: string, id: string): void {
    const isImage = type === 'png' || type === 'jpg';
    if (isImage && (this.previewDialogRef || this.isOpeningPreview)) return;

    if (isImage) this.isOpeningPreview = true;
    this.subscriptions.push(
      this.supportService
        .openAttachment(id)
        .pipe(
          finalize(() => {
            if (isImage) this.isOpeningPreview = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (isImage) {
              if (res.data.url) {
                this.previewDialogRef = this.dialog.open(
                  JpgPngModalV4Component,
                  {
                    maxWidth: '510px',
                    width: '93%',
                    panelClass: 'paddingless-modal-rounded',
                    data: res.data.url
                  }
                );
                this.previewDialogRef.afterClosed().subscribe(() => {
                  this.previewDialogRef = undefined;
                });
              }
            } else {
              window.open(res.data.url);
            }
          }
        })
    );
  }

  markResolved(): void {
    const row = this.row();
    if (!row) return;

    this.processingChange.emit(true);
    this.loading.set(true);
    this.subscriptions.push(
      this.supportService
        .markAsResolve(String(row.id), undefined)
        .pipe(
          finalize(() => {
            this.processingChange.emit(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.statusChanged.emit(2);
            } else {
              this.loading.set(false);
            }
          },
          error: () => this.loading.set(false)
        })
    );
  }

  reOpenTicket(): void {
    const row = this.row();
    if (!row) return;

    this.processingChange.emit(true);
    this.loading.set(true);
    this.subscriptions.push(
      this.supportService
        .reOpen(String(row.id), undefined)
        .pipe(
          finalize(() => {
            this.processingChange.emit(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.statusChanged.emit(1);
            } else {
              this.loading.set(false);
            }
          },
          error: () => this.loading.set(false)
        })
    );
  }

  toMonthFirst(value: string): string {
    return (value ?? '').replace(/^(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3');
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
