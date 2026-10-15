import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
import {
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { MatTooltip } from '@angular/material/tooltip';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';

/**
 * Accepts the raw API response from both:
 *  - /checks/{id}/attachments  (CHECK flow)
 *  - IGetAttachment            (non-CHECK flow)
 * Both share the same field names for the fields we render.
 */
export interface IAttachmentEntry {
  id?: string | number;
  fileName?: string;
  file_name?: string;
  user_name?: string;
  formated_date?: string;
  all_attachment_status?: { status_text: string };
  status?: string;
  public_url?: string;
  encrypted_id?: string;
  [key: string]: unknown;
}

@Component({
  standalone: true,
  selector: 'app-po-attachments-list',
  templateUrl: './attachments-list.component.html',
  styleUrls: ['./attachments-list.component.scss'],
  imports: [
    NgClass,
    PdEmptyStateComponent,
    PdShowMoreComponent,
    LucideAngularModule,
    FormsModule,
    CommonButtonV4Component,
    PdDateTimeComponent,
    MatTooltip
  ]
})
export class PoAttachmentsListComponent {
  readonly Trash2Icon = Trash2;

  attachments = input<IAttachmentEntry[] | null>(null);
  /** Opt-in: renders the icon + title + hint empty state instead of the plain sentence. */
  emptyHint = input('');
  /** View-panel design: outline "Upload attachment" button. */
  variant = input<'default' | 'view-panel'>('default');
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame. The header stays — it holds "Add file". */
  bare = input(false);
  /** Rows shown before the "Show N more" link. 0 = uncapped (the default). */
  collapsedCount = input<number>(0);
  /** Show every row and drop the link — the expanded panel scrolls instead. */
  forceExpand = input<boolean>(false);

  showAll = signal(false);

  visibleAttachments = computed(() => {
    const list = this.attachments() ?? [];
    const cap = this.collapsedCount();
    return this.showAll() || this.forceExpand() || !cap
      ? list
      : list.slice(0, cap);
  });

  canShowMore = computed(
    () =>
      !this.forceExpand() &&
      !!this.collapsedCount() &&
      (this.attachments()?.length ?? 0) > this.collapsedCount()
  );

  hiddenCount = computed(
    () => (this.attachments()?.length ?? 0) - this.collapsedCount()
  );

  deletingId = input<string | null>(null);
  /** True while the parent is uploading; disables the picker. */
  uploading = input<boolean>(false);
  /** Accepted file extensions for the native picker (add-attachment modal default). `*` = any type. */
  accept = input<string>('.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,.rtf');
  /** Upload limits — same as the add-attachment modal. */
  maxSizeMb = input<number>(10);
  maxFiles = input<number>(5);
  /** Show the "Upload from phone" (SMS/QR) affordance — check-only. */
  allowMobile = input<boolean>(false);
  /** State for the phone/QR flow (driven by the parent). */
  phoneSending = input<boolean>(false);
  phoneSent = input<boolean>(false);
  qrLoading = input<boolean>(false);
  /** Inline validation/error for the file area and the phone field. */
  error = input<string | null>(null);
  phoneError = input<string | null>(null);
  /** Emits the picked file to upload (parent handles the API + reload). */
  fileSelected = output<File>();
  /** Emits the phone number to send an upload link to. */
  sendPhoneLink = output<string>();
  /** Requests a QR code for phone upload. */
  openQr = output<void>();
  closed = output<void>();
  deleteAttachment = output<IAttachmentEntry>();
  openAttachment = output<IAttachmentEntry>();

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  showPhone = signal(false);
  phone = '';

  /** Local file-validation message; the parent's own `error` wins when set. */
  private validationError = signal<string | null>(null);
  displayError = computed(() => this.error() ?? this.validationError());

  triggerPicker(): void {
    if (!this.uploading()) this.fileInput()?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = ''; // allow re-selecting the same file
    if (!file) return;

    const problem = this.validate(file);
    this.validationError.set(problem);
    if (!problem) this.fileSelected.emit(file);
  }

  /** Format / size / count checks — the picker rejects before the parent uploads. */
  private validate(file: File): string | null {
    // `split('.').pop()` returns the whole name for an extension-less file —
    // "README" would then be reported as the format `.readme`.
    const dot = file.name.lastIndexOf('.');
    const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
    const accepted = this.accept()
      .split(',')
      .map((f) => f.trim().toLowerCase().replace(/^\./, ''))
      .filter(Boolean);

    if (accepted.length && !accepted.includes('*') && !accepted.includes(ext)) {
      return `File format ${ext ? `.${ext}` : 'unknown'} is not supported. Accepted formats: ${this.accept()}`;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      return `Maximum file size is ${this.maxSizeMb()}MB. Please select a smaller file.`;
    }
    if ((this.attachments()?.length ?? 0) >= this.maxFiles()) {
      return `A maximum of ${this.maxFiles()} attachments is allowed.`;
    }
    return null;
  }

  submitPhone(): void {
    const p = this.phone.trim();
    if (!p || this.phoneSending()) return;
    this.sendPhoneLink.emit(p);
  }
}
