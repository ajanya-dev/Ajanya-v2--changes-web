import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ChevronDown,
  LucideAngularModule,
  Pencil,
  Plus,
  Search,
  X
} from 'lucide-angular';

/**
 * `address` renders the bar as a name + inline address + badge; `carrier`
 * renders it as a logo + name + tag + cost.
 */
export type SpMailDropdownVariant = 'address' | 'carrier';

/**
 * One row in the popover. Everything optional is a decoration a given call site
 * may not carry: an address row has a subtitle and a badge, a carrier row has a
 * logo, a "Cheapest" tag and a cost.
 */
export interface SpMailDropdownOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeOk?: boolean;
  logoUrl?: string;
  tag?: string;
  cost?: number;
}

/**
 * The 44px selector bar plus its popover, as used by Mail from, Mail to and the
 * carrier picker in the check mailing block. Holds no state: `open` comes in and
 * `toggle` goes out, so the one `openPop` signal on the host stays the single
 * source of truth for which popover is showing.
 */
@Component({
  selector: 'app-sp-mail-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatTooltip],
  templateUrl: './sp-mail-dropdown.component.html',
  styleUrl: './sp-mail-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpMailDropdownComponent {
  readonly variant = input<SpMailDropdownVariant>('address');
  readonly open = input(false);

  /** Card mail-from / mail-to: a summary with no chevron and no popover. */
  readonly readOnly = input(false);
  readonly loading = input(false);

  /**
   * Selectable, but not right now — the carrier bar while an address is still
   * unusable. Unlike `readOnly` it keeps the chevron and says why on hover, so
   * the control still reads as something the user will be able to use.
   */
  readonly disabled = input(false);
  readonly disabledHint = input('');

  readonly title = input('');
  readonly inline = input('');

  /**
   * Shown in place of the title when there is nothing to name yet — a mailing
   * address has no payee until one is chosen, and an empty bar says nothing
   * about why it is empty.
   */
  readonly placeholder = input('');
  readonly badge = input('');
  readonly badgeOk = input(false);
  readonly editable = input(false);
  readonly logoUrl = input('');
  readonly tag = input('');
  readonly cost = input<number | null>(null);

  readonly options = input<readonly SpMailDropdownOption[]>([]);
  readonly selectedId = input<string | null>(null);

  /**
   * The whole list is already in hand, so the filter runs here rather than
   * asking the API for a subset of what it has already sent.
   */
  readonly searchable = input(true);
  readonly searchPlaceholder = input('Search');

  readonly searchTerm = signal('');

  readonly searchMode = computed(
    () => this.searchable() && this.open() && !this.readOnly() && !this.disabled()
  );

  private readonly searchBox =
    viewChild<ElementRef<HTMLInputElement>>('searchBox');

  private readonly injector = inject(Injector);

  readonly visibleOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.options();
    if (!term) {
      return all;
    }
    return all.filter((option) =>
      `${option.title} ${option.subtitle ?? ''}`.toLowerCase().includes(term)
    );
  });

  readonly noMatches = computed(
    () => !!this.searchTerm().trim() && !this.visibleOptions().length
  );

  constructor() {
    // A term left behind would filter the list on the next open with the box
    // that explains it not yet on screen.
    effect(
      () => {
        if (!this.open()) {
          this.searchTerm.set('');
          return;
        }
        if (this.searchable()) {
          afterNextRender(() => this.searchBox()?.nativeElement.focus(), {
            injector: this.injector
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** Empty label hides the "Add New …" row above the options. */
  readonly addNewLabel = input('');
  readonly addNewHint = input('');

  readonly toggle = output<void>();
  readonly edit = output<void>();
  readonly addNew = output<void>();
  readonly optionSelect = output<string>();

  readonly ChevronDownIcon = ChevronDown;
  readonly PencilIcon = Pencil;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;

  /**
   * The button clears a term before it closes anything. Closing on the first
   * press takes the list away from a user who only wanted to retype their
   * search, and the list is one click to reopen either way.
   */
  dismiss(): void {
    if (this.searchable() && this.searchTerm().trim()) {
      this.searchTerm.set('');
      this.searchBox()?.nativeElement.focus();
      return;
    }
    this.close();
  }

  /** The host owns which popover is open, so closing is a toggle from here. */
  close(): void {
    this.searchTerm.set('');
    this.toggle.emit();
  }

  onDismissClick(event: Event): void {
    event.stopPropagation();
    this.dismiss();
  }

  onBarClick(event: Event): void {
    if (this.readOnly() || this.disabled()) {
      // Swallowed, not ignored: a click that reaches the document would close
      // whichever popover is open, which reads as the bar having done something.
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.toggle.emit();
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }
}
