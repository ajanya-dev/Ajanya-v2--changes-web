import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  forwardRef,
  inject,
  input,
  model,
  output,
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
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { V35ControlMessageComponent } from '../control-message-v35/control-message-v35.component';

/** A single country option: ISO2 code + display name. */
export interface ICountryOption {
  code: string;
  name: string;
}

/** Reusable, searchable country dropdown (ControlValueAccessor); sources its list from the allowed-countries cache. */
@Component({
  standalone: true,
  selector: 'app-common-country-select',
  templateUrl: './common-country-select.component.html',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    V35ControlMessageComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonCountrySelectComponent),
      multi: true
    }
  ]
})
export class CommonCountrySelectComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private cloudBankService = inject(CloudBankService);
  private injector = inject(Injector);

  /** Host form control (resolved from the parent `formControlName`/`[formControl]`) the message binds to. */
  ngControl: NgControl | null = null;

  /** Placeholder shown when nothing is selected. */
  placeholder = input('Country');
  /** Marks the field as required (drives the inline validation message). */
  isRequired = input(false);
  /** Whether the selection can be cleared. */
  clearable = input(true);
  /** Which value the control emits: `'code'` (ISO2, default) or `'name'`. */
  bindValue = input<'code' | 'name'>('code');
  /** Explicit allowed-country map (`{ CODE: 'Name' }`); falls back to the app-wide list when omitted. */
  allowedCountries = input<{ [code: string]: string }>();
  /** Control width (default `'100%'`); pass a fixed value to stop the field resizing to its selection. */
  width = input('100%');
  /** Optional dropdown panel width; defaults to the control width when omitted. */
  panelWidth = input<string>();
  /** Extra class(es) for the inner `ng-select` control (e.g. a height helper from `_overrides-v35.scss`). */
  controlClass = input('');
  /** Per-error-key message overrides forwarded to the inline validation message. */
  customMessages = input<{ [key: string]: string }>({});

  /** Emits the full {code, name} of the selected country (in addition to CVA propagation). */
  countryChange = output<ICountryOption | null>();

  @ViewChild(NgSelectComponent) private ngSelect?: NgSelectComponent;

  /** Disables the control. Also settable via the form's `setDisabledState`. */
  isDisabled = model(false);
  loading = signal(false);
  value = signal<string | undefined>(undefined);
  countryList = signal<ICountryOption[]>([]);

  private subscription?: Subscription;

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {
    // Resolve the host NgControl lazily (constructor injection would cycle with NG_VALUE_ACCESSOR).
    this.ngControl = this.injector.get(NgControl, null);
    const allowed = this.allowedCountries();
    if (allowed && Object.keys(allowed).length) {
      this.setCountryList(allowed);
    } else {
      this.loadCountries();
    }
  }

  /** Subscribes to the cached allowed countries, fetching them once if empty. */
  private loadCountries(): void {
    this.subscription = this.cloudBankService.allowedCountries.subscribe(
      (map) => {
        if (map && Object.keys(map).length) {
          this.setCountryList(map);
        }
      }
    );

    if (!Object.keys(this.cloudBankService.allowedCountries.value).length) {
      this.loading.set(true);
      this.cloudBankService
        .getAllowedCountries()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.cloudBankService.allowedCountries.next(res.data);
          }
        });
    }
  }

  private setCountryList(map: { [code: string]: string }): void {
    this.countryList.set(
      Object.entries(map)
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    // A value written before the list arrived may be a name/wrong case: reconcile it.
    this.reconcileValue();
  }

  /** Normalizes an external value (code or name, any case) to the configured output format so an option matches. */
  private reconcileValue(): void {
    const value = this.value();
    const list = this.countryList();
    if (!value || list.length === 0) {
      return;
    }
    const current = String(value).toLowerCase();
    const matched = list.find(
      (c) => c.code.toLowerCase() === current || c.name.toLowerCase() === current
    );
    if (!matched) {
      return;
    }
    const normalized = this.bindValue() === 'name' ? matched.name : matched.code;
    if (normalized !== value) {
      this.value.set(normalized);
      this.onChange(normalized);
    }
  }

  onValueChange(value: string | null): void {
    this.value.set(value ?? undefined);
    this.onChange(value);
    this.onTouched();
    const matched =
      value != null
        ? this.countryList().find(
            (c) => (this.bindValue() === 'name' ? c.name : c.code) === value
          ) ?? null
        : null;
    this.countryChange.emit(matched);
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
