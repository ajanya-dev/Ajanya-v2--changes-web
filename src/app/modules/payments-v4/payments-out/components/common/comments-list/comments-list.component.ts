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
import { MatTooltip } from '@angular/material/tooltip';
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';

/**
 * Accepts the raw API response from both:
 *  - /checks/{id}/comments  (CHECK flow: date, time, comment, createdBy, all_comment_status)
 *  - zil-payments comments   (non-CHECK flow: formated_date, comments, user_name, status)
 */
export interface ICommentEntry {
  id?: string | number;
  encrypted_id?: string;
  // CHECK flow fields
  date?: string;
  time?: string;
  comment?: string;
  createdBy?: string;
  all_comment_status?: { status_text: string };
  // Non-CHECK flow fields (IGetComment shape)
  formated_date?: string;
  comments?: string;
  user_name?: string;
  status?: { status_text: string };
}

@Component({
  standalone: true,
  selector: 'app-po-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.scss'],
  imports: [
    NgClass,
    PdEmptyStateComponent,
    PdShowMoreComponent,
    LucideAngularModule,
    MatTooltip,
    FormsModule,
    CommonButtonV4Component,
    PdDateTimeComponent
  ]
})
export class PoCommentsListComponent {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  comments = input<ICommentEntry[] | null>(null);
  /** Opt-in: renders the icon + title + hint empty state instead of the plain sentence. */
  emptyHint = input('');
  /** View-panel design: "Write a comment" / outline "Add comment", empty post shows an inline error. */
  variant = input<'default' | 'view-panel'>('default');
  emptyError = signal<string | null>(null);
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);
  /** Rows shown before the "Show N more" link. 0 = uncapped (the default). */
  collapsedCount = input<number>(0);
  /** Show every row and drop the link — the expanded panel scrolls instead. */
  forceExpand = input<boolean>(false);

  showAll = signal(false);

  visibleComments = computed(() => {
    const list = this.comments() ?? [];
    const cap = this.collapsedCount();
    return this.showAll() || this.forceExpand() || !cap
      ? list
      : list.slice(0, cap);
  });

  canShowMore = computed(
    () =>
      !this.forceExpand() &&
      !!this.collapsedCount() &&
      (this.comments()?.length ?? 0) > this.collapsedCount()
  );

  hiddenCount = computed(
    () => (this.comments()?.length ?? 0) - this.collapsedCount()
  );

  /** True while the parent is posting; disables the composer. */
  posting = input<boolean>(false);
  /** Inline validation/error message shown under the composer. */
  error = input<string | null>(null);
  /** Off where comments carry no id to delete by (gpbf recurring). */
  allowDelete = input<boolean>(true);
  /** Emits the comment text to post (parent handles the API + reload). */
  submitComment = output<string>();
  deleteComment = output<string>();
  closed = output<void>();

  draft = '';
  /** Grows the composer up to this height, then scrolls. */
  private readonly maxComposerHeight = 120;
  private textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  /** Auto-grow the textarea to fit its content (up to maxComposerHeight, then scroll). */
  autoGrow(el: HTMLTextAreaElement): void {
    const node = el;
    node.style.overflowY = 'hidden';
    node.style.height = 'auto';
    // border-box: the set height must include the border, else it's ~2px short
    // and overflows by a pixel, flashing a scrollbar even for a single line.
    const border = node.offsetHeight - node.clientHeight;
    const needed = node.scrollHeight + border;
    if (needed > this.maxComposerHeight) {
      node.style.height = `${this.maxComposerHeight}px`;
      node.style.overflowY = 'auto';
    } else {
      node.style.height = `${needed}px`;
    }
  }

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }

  post(): void {
    const text = this.draft.trim();
    if (!text && this.variant() === 'view-panel') {
      this.emptyError.set('Enter a comment before posting.');
      return;
    }
    if (!text || this.posting()) return;
    this.emptyError.set(null);
    this.submitComment.emit(text);
    this.draft = '';
    const el = this.textareaRef()?.nativeElement;
    if (el) {
      el.style.height = ''; // reset to the min height
      el.style.overflowY = 'hidden';
    }
  }
}
