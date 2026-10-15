import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV4Component } from '../../buttons/common-button-v4/common-button-v4.component';

/** Single attachment activity row for display (input-driven; aligned to list columns). */
export interface IAttachmentActivityEntry {
  date: string;
  status: string;
  initiatedBy: string;
  device: string;
  note: string;
  publicUrl?: string;
  /** Required for delete; passed through from API (e.g. encrypted_id). */
  encryptedId?: string;
}

@Component({
  standalone: true,
  selector: 'app-attachments-activity-list-v4',
  templateUrl: './attachments-activity-list-v4.component.html',
  styleUrls: ['./attachments-activity-list-v4.component.scss'],
  imports: [LucideAngularModule, CommonButtonV4Component,MatTooltip]
})
export class AttachmentsActivityListV4Component {
  attachments = input<IAttachmentActivityEntry[] | null>(null);
  /**
   * Maximum height of the component (e.g. '400px', '50vh').
   * When set, the list body scrolls when content overflows. Omit or set to null for no max height.
   */
  maxHeight = input<string | null>('400px');
  /** When set, the delete button for the row with this encryptedId shows loading and is disabled. */
  deletingId = input<string | null>(null);
  /** Emitted when the user clicks "Add Attachment". */
  addAttachment = output<void>();
  /** Emitted when the user clicks the close button in the header. */
  closed = output<void>();
  /** Emitted when the user clicks delete on an attachment; payload is the row entry (use encryptedId for API). */
  deleteAttachment = output<IAttachmentActivityEntry>();
  /** Emitted when the user clicks to open/view an attachment (e.g. when no publicUrl); payload is the row entry. */
  openAttachment = output<IAttachmentActivityEntry>();

  /** Trash icon hidden while row delete is in progress so only the button spinner shows. */
  rowDeleteLucideIcon(entry: IAttachmentActivityEntry): string | undefined {
    return this.deletingId() === entry.encryptedId ? undefined : 'trash-2';
  }
}
