import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  computed,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl
} from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IPayeeStates } from 'src/app/modules/payee/payee-v2/model/payee';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';
import { CommonInputFieldV4Component } from '../common-input-field-v4/common-input-field.component-v4';

/** A single state option: ISO2 code + display name. */
export interface IStateOption {
  code: string;
  name: string;
}

/** Reusable state selector (ControlValueAccessor); fetches states for `country` and falls back to free text when none exist. */
@Component({
  standalone: true,
  selector: 'app-common-state-select-v4',
  templateUrl: './common-state-select-v4.component.html',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    V4ControlMessageComponent,
    CommonInputFieldV4Component
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonStateSelectV4Component),
      multi: true
    }
  ]
})
export class CommonStateSelectV4Component
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  private cloudBankService = inject(CloudBankService);
  private injector = inject(Injector);

  /** Host form control (resolved from the parent `formControlName`/`[formControl]`) the message binds to. */
  ngControl: NgControl | null = null;

  /** ISO2 country code whose states should be loaded. Changing it reloads states. */
  country = input<string | null | undefined>();
  /** Placeholder shown when nothing is selected/entered. */
  placeholder = input('State');
  /** Marks the field as required (drives the inline validation message). */
  isRequired = input(false);
  /** Whether the dropdown selection can be cleared. */
  clearable = input(true);
  /** Which value the dropdown emits: `'code'` (ISO2, default) or `'name'`. */
  bindValue = input<'code' | 'name'>('code');
  /** Max length applied to the free-text fallback input. */
  maxLength = input(50);
  /** Control width (default `'100%'`); pass a fixed value to stop the field resizing to its selection. */
  width = input('100%');
  /** Optional dropdown panel width; defaults to the control width when omitted. */
  panelWidth = input<string>();
  /** Extra class(es) for the inner `ng-select` control. Defaults to the standard
   * 44px v4 control height (`height-0`); pass another height helper (e.g. `height-1`) to override. */
  controlClass = input('height-0');
  /** Forces the options panel to open `'top'`/`'bottom'` instead of ng-select's own `'auto'` viewport-based flip —
   * useful inside a scrollable modal where `'auto'` (which only checks the browser viewport) can let the panel spill past the modal's own edge. */
  dropdownPosition = input<'auto' | 'top' | 'bottom'>('auto');

  @ViewChild(NgSelectComponent) private ngSelect?: NgSelectComponent;

  isDisabled = signal(false);
  loading = signal(false);
  value = signal<string | undefined>(undefined);
  /** True when the current country has a list of states (show dropdown vs. free text). */
  hasStates = signal(false);
  stateList = signal<IStateOption[]>([]);

  private states: IPayeeStates[] = [];
  private subscription?: Subscription;

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  /** Dropdown value, hidden until states load so the raw code never flashes before its display name. */
  displayValue = computed(() => (this.hasStates() ? this.value() : undefined));

  ngOnInit(): void {
    // Resolve the host NgControl lazily (constructor injection would cycle with NG_VALUE_ACCESSOR).
    this.ngControl = this.injector.get(NgControl, null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.country) {
      const change = changes.country;
      // Country actively cleared: drop the orphaned state (skip firstChange so form setup doesn't wipe a patched value).
      if (
        !change.firstChange &&
        change.previousValue &&
        !change.currentValue &&
        this.value() != null
      ) {
        this.value.set(undefined);
        this.onChange(null);
      }
      this.loadStates();
    }
  }

  private loadStates(): void {
    this.subscription?.unsubscribe();
    const country = this.country();
    const code = country ? String(country).trim() : '';

    if (!code) {
      this.states = [];
      this.stateList.set([]);
      this.hasStates.set(false);
      return;
    }

    this.loading.set(true);
    this.subscription = this.cloudBankService
      .getStates(code)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const sorted = [...(res?.data ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          this.states = sorted;
          this.stateList.set(
            sorted.map((s) => ({ code: s.iso2, name: s.name }))
          );
          this.hasStates.set(sorted.length > 0);
          this.reconcileValue();
        },
        error: () => {
          this.states = [];
          this.stateList.set([]);
          this.hasStates.set(false);
        }
      });
  }

  /** Trim + lowercase for tolerant comparison (handles case/whitespace). */
  private norm(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  /** Bare state code without any country prefix (e.g. `US-MO` -> `mo`) so `MO` and `US-MO` match either way. */
  private stateCodeTail(value: string): string {
    const normalized = this.norm(value);
    const dash = normalized.lastIndexOf('-');
    return dash >= 0 ? normalized.slice(dash + 1) : normalized;
  }

  /** Maps the current value to a loaded state (tolerating case/prefix differences) or clears it if it doesn't belong. */
  private reconcileValue(): void {
    const value = this.value();
    if (!this.hasStates() || !value) {
      return;
    }
    const current = this.norm(value);
    const currentTail = this.stateCodeTail(value);
    const matched = this.states.find(
      (s) =>
        this.norm(s.iso2) === current ||
        this.norm(s.name) === current ||
        this.stateCodeTail(s.iso2) === currentTail
    );
    let next: string | null = null;
    if (matched) {
      next = this.bindValue() === 'name' ? matched.name : matched.iso2;
    }
    if (next !== value) {
      this.value.set(next ?? undefined);
      this.onChange(next);
    }
  }

  onValueChange(value: string | null): void {
    const normalized = value ?? undefined;
    // CommonInputFieldV4Component (the free-text fallback) is a ControlValueAccessor
    // that echoes its value back through (ngModelChange) when we write it
    // programmatically via [ngModel]. Ignore that echo (value unchanged) so the
    // control isn't marked touched — and the required error shown — before the
    // user has actually interacted with the field.
    if (normalized === this.value()) {
      return;
    }
    this.value.set(normalized);
    this.onChange(value);
    this.onTouched();
  }

  /** Override the body-appended panel width and start the outside-scroll listener that closes it. */
  onPanelOpen(): void {
    // Close the body-appended panel on outside scroll (capture phase, since scroll doesn't bubble).
    window.addEventListener('scroll', this.closeDropdown, true);
    const width = this.panelWidth();
    if (!width) {
      return;
    }
    setTimeout(() => {
      const id = this.ngSelect?.dropdownId;
      const panel = id ? document.getElementById(id) : null;
      if (panel) {
        panel.style.width = width;
        panel.style.minWidth = width;
      }
    });
  }

  /** Stops the scroll listener once the panel is closed. */
  onPanelClose(): void {
    window.removeEventListener('scroll', this.closeDropdown, true);
  }

  /** Close ng-select on outside scroll; scrolling within the options list is ignored. */
  closeDropdown = (event?: Event): void => {
    const id = this.ngSelect?.dropdownId;
    const panel = id ? document.getElementById(id) : null;
    const target = event?.target as Node | null;
    if (panel && target && (panel === target || panel.contains(target))) {
      return;
    }
    if (this.ngSelect?.isOpen) {
      this.ngSelect.close();
    }
  };

  writeValue(value: string): void {
    // Treat an empty string as "no selection" so the placeholder shows instead of a blank value.
    this.value.set(value || undefined);
    this.reconcileValue();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    window.removeEventListener('scroll', this.closeDropdown, true);
  }
}
