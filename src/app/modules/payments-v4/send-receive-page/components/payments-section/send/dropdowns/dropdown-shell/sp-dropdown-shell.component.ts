import {
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  Component,
  ElementRef,
  HostListener,
  Injector,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ChevronDown,
  CircleHelp,
  Search,
  X
} from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

/** Enough room for a typical panel; below this the panel flips above the bar. */
const PANEL_ESTIMATE = 320;

@Component({
  selector: 'app-sp-dropdown-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatTooltip],
  styleUrls: ['./sp-dropdown-shell.component.scss'],
  templateUrl: './sp-dropdown-shell.component.html'
})
export class SpDropdownShellComponent {
  private elRef = inject(ElementRef);

  label = input('');
  tooltip = input('');
  disabled = input(false);
  disabledHint = input('');
  required = input(false);
  searchable = input(false);
  searchPlaceholder = input('Search…');
  dropUp = input(false);
  /** 44px on the main payment form; 40px in Additional details, beside the 40px text inputs. */
  barHeight = input<'44px' | '40px'>('44px');
  searchTerm = model('');
  open = model(false);

  /**
   * The X gives the field back as it was found. The shell does not own the
   * selection, so it says the user asked and each list clears its own.
   */
  readonly cleared = output<void>();

  @ViewChild('searchBox') searchBox?: ElementRef<HTMLInputElement>;

  readonly ChevronDownIcon = ChevronDown;
  readonly InfoIcon = CircleHelp;
  readonly SearchIcon = Search;
  readonly XIcon = X;

  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      if (!this.open() || !this.searchable()) return;
      afterNextRender(() => this.searchBox?.nativeElement.focus(), {
        injector: this.injector
      });
    });
  }

  /**
   * Flips the panel above the bar when there is not enough room below. Measured
   * on open rather than declared, so a field near the action bar stops covering
   * Save and Confirm. `dropUp` stays as an explicit override.
   */
  readonly flipUp = signal(false);

  readonly opensUp = computed(() => this.dropUp() || this.flipUp());

  readonly isOpen = computed(() => this.open() && !this.disabled());

  private decideDirection(): void {
    const bar = this.elRef.nativeElement as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    this.flipUp.set(below < PANEL_ESTIMATE && above > below);
  }

  toggle(): void {
    if (this.disabled()) return;
    if (!this.open()) {
      this.decideDirection();
      this.open.set(true);
      return;
    }
    this.close();
  }

  /**
   * The button clears a term before it clears anything else. Closing on the
   * first press takes the panel away from a user who only wanted to retype
   * their search, and the panel is one click to reopen either way.
   *
   * With no term left it is a Clear, not a Close: the selection goes with the
   * panel, which is what the X on a field is read to mean.
   */
  dismiss(event?: Event): void {
    event?.stopPropagation();
    if (this.searchable() && this.searchTerm().trim()) {
      this.searchTerm.set('');
      this.searchBox?.nativeElement.focus();
      return;
    }
    this.cleared.emit();
    this.close();
  }

  /**
   * Closing drops the term with the panel. The search box only exists while the
   * panel is open, so a term kept behind goes on filtering the list with
   * nothing on screen to say why it is short.
   */
  close(): void {
    this.searchTerm.set('');
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event): void {
    if (!this.open()) return;
    const path = event.composedPath();
    if (!path.includes(this.elRef.nativeElement)) {
      this.close();
    }
  }
}
