import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV4Component } from '../../buttons/common-button-v4/common-button-v4.component';

/** Single comment row for display (input-driven; aligned to API keys). */
export interface ICommentActivityEntry {
  date: string;
  status: string;
  initiatedBy: string;
  device: string;
  note: string;
  /** Required for delete; passed through from API (e.g. encrypted_id). */
  encryptedId?: string;
}

@Component({
  standalone: true,
  selector: 'app-comments-activity-list-v4',
  templateUrl: './comments-activity-list-v4.component.html',
  styleUrls: ['./comments-activity-list-v4.component.scss'],
  imports: [LucideAngularModule, CommonButtonV4Component,MatTooltip]
})
export class CommentsActivityListV4Component {
  comments = input<ICommentActivityEntry[] | null>(null);
  /**
   * Maximum height of the component (e.g. '400px', '50vh').
   * When set, the list body scrolls when content overflows. Omit or set to null for no max height.
   */
  maxHeight = input<string | null>('400px');
  /** Hide the status column from the table. */
  hideStatus = input(false);
  /** When set, the delete button for the row with this encryptedId shows loading and is disabled. */
  deletingId = input<string | null>(null);
  /** Emitted when the user clicks "Add Comment". */
  addComment = output<void>();
  /** Emitted when the user clicks the close button in the header. */
  closed = output<void>();
  /** Emitted when the user clicks delete on a comment; payload is the row entry (use encryptedId for API). */
  deleteComment = output<ICommentActivityEntry>();

  /** Trash icon hidden while row delete is in progress so only the button spinner shows. */
  rowDeleteLucideIcon(entry: ICommentActivityEntry): string | undefined {
    return this.deletingId() === entry.encryptedId ? undefined : 'trash-2';
  }
}
