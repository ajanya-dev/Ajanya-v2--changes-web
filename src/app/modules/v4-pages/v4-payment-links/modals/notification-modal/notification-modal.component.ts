import {
  Component,
  inject,
  signal,
  DestroyRef,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewChecked
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

interface NotificationVariable {
  token: string;
  label: string;
  description: string;
}

const DEFAULT_TEMPLATE = `<p>Hi #name,</p>
<p>You have a payment request for <strong>#amount</strong> (Ref: <strong>#ref_id</strong>).</p>
<p>Please complete the payment using the secure link provided.</p>
<p>Thank you,<br/>#sender_name</p>`;

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatTooltipModule],
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss']
})
export class NotificationModalComponent implements OnInit, AfterViewChecked {
  private dialogRef = inject(MatDialogRef<NotificationModalComponent>);
  private paymentLinkService = inject(PaymentLinkService);
  private destroyRef = inject(DestroyRef);
  private clipboard = inject(Clipboard);
  private v4AlertService = inject(V4AlertService);

  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;

  activeTab = signal<'email' | 'sms'>('email');
  loading = signal(false);
  isSaving = signal(false);
  savedState = signal<'idle' | 'saved'>('idle');

  /** The raw HTML message stored per-channel in memory */
  private emailContent = DEFAULT_TEMPLATE;
  private smsContent = `Hi #name, thank you for your payment of #amount. Ref: #ref_id. From: #sender_name`;
  private pendingPush = false;

  variables: NotificationVariable[] = [
    { token: 'ref_id', label: 'Reference ID', description: 'Unique payment reference identifier.' },
    { token: 'name', label: 'Recipient Name', description: 'Name of the payer.' },
    { token: 'amount', label: 'Amount', description: 'Payment amount.' },
    { token: 'sender_name', label: 'Sender Name', description: 'Your company or team name displayed in the message.' }
  ];

  ngOnInit() {
    this.fetchMessage();
  }

  ngAfterViewChecked() {
    if (this.pendingPush && this.editorRef?.nativeElement) {
      this.pendingPush = false;
      const el = this.editorRef.nativeElement;
      el.innerHTML = this.activeTab() === 'email' ? this.emailContent : this.smsContent;
    }
  }

  // ── API ──────────────────────────────────────────────

  private fetchMessage() {
    this.loading.set(true);
    this.paymentLinkService
      .getMessageStyle()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.emailContent = res.data;
          }
          this.loading.set(false);
          this.pendingPush = true;
        },
        error: () => {
          this.loading.set(false);
          this.pendingPush = true;
        }
      });
  }

  save() {
    this.readEditorContent(); // capture latest edits
    const content = this.activeTab() === 'email' ? this.emailContent : this.smsContent;

    if (!content || !content.trim()) {
      this.v4AlertService.warningAlert({
        title: 'Validation Error',
        content: 'Message content cannot be empty.'
      });
      return;
    }

    this.isSaving.set(true);
    this.paymentLinkService
      .saveStyleMessage({ message: content })
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.v4AlertService.successAlert({
              title: 'Success',
              content: 'Payment notification template saved successfully.'
            });
            this.dialogRef.close();
          }
        },
        error: () => {
          this.v4AlertService.warningAlert({
            title: 'Save Failed',
            content: 'An error occurred while saving the template.'
          });
        }
      });
  }

  // ── Tab switching ────────────────────────────────────

  switchTab(tab: 'email' | 'sms') {
    if (tab === this.activeTab()) return;
    this.readEditorContent();    // save current editor → variable
    this.activeTab.set(tab);
    this.pushContentToEditor();  // push new tab content → editor
  }

  // ── Editor helpers ───────────────────────────────────

  /** Write the in-memory content into the contenteditable div */
  private pushContentToEditor() {
    setTimeout(() => {
      const el = this.editorRef?.nativeElement;
      if (!el) return;
      el.innerHTML = this.activeTab() === 'email' ? this.emailContent : this.smsContent;
    });
  }

  /** Read the contenteditable div back into the in-memory variable */
  private readEditorContent() {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    const html = el.innerHTML || '';
    if (this.activeTab() === 'email') {
      this.emailContent = html;
    } else {
      this.smsContent = html;
    }
  }

  /** Called on every keystroke in the editor */
  onEditorInput() {
    this.readEditorContent();
  }

  // ── Toolbar ──────────────────────────────────────────

  execCommand(command: string, value?: string) {
    this.editorRef?.nativeElement?.focus();
    document.execCommand(command, false, value);
    this.readEditorContent();
  }

  onLinkCommand() {
    const sel = window.getSelection();
    let savedRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    const url = prompt('Enter URL:', 'https://');
    if (!url) return;

    this.editorRef?.nativeElement?.focus();
    if (savedRange) {
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
    }
    document.execCommand('createLink', false, url);
    this.readEditorContent();
  }

  // ── Variables ────────────────────────────────────────

  insertVariable(token: string) {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('insertText', false, `#${token}`);
    this.readEditorContent();
  }

  copyVariable(token: string) {
    this.clipboard.copy(`#${token}`);
    this.v4AlertService.successAlert({ title: 'Success', content: `Copied #${token} to clipboard` });
  }

  // ── Reset ────────────────────────────────────────────

  resetToDefault() {
    if (this.activeTab() === 'email') {
      this.emailContent = DEFAULT_TEMPLATE;
    } else {
      this.smsContent = `Hi #name, thank you for your payment of #amount. Ref: #ref_id. From: #sender_name`;
    }
    this.pushContentToEditor();
  }

  // ── Modal close ──────────────────────────────────────

  closeModal() {
    this.savedState.set('idle');
    this.dialogRef.close();
  }
}
