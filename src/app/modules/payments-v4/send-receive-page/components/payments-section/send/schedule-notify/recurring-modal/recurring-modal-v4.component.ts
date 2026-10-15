import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { SpSelectDropdownComponent } from '../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';

/**
 * Result shape returned on Save — INTENTIONALLY identical to the legacy
 * `RecurringModalComponent` so the compact callers (ACH "Repeat this payment"
 * and Check-Mail Send→Recurring) consume it with no changes.
 */
export interface IRecurringResult {
  /** Schedule mode: 'scheduled' = one-time future send · 'recurring' = repeating.
   *  Absent on legacy callers → treated as 'recurring'. */
  mode?: 'scheduled' | 'recurring';
  /** yyyy-MM-dd for a one-time scheduled send (mode === 'scheduled'). */
  scheduleDate?: string;
  /** Frequency CODE (1=Daily … 7=Quarterly); see `frequencyOptions`. */
  frequency: string;
  /** yyyy-MM-dd. */
  start_date: string;
  /**
   * When the series stops. The three the check-mail modal has always offered:
   * '1' = a set number of payments · '2' = on a date · '3' = until cancelled.
   */
  end_select: string;
  /** Number of payments when `end_select === '1'`; '' otherwise. */
  count: number | string;
  /** yyyy-MM-dd when `end_select === '2'`; '' otherwise. */
  until?: string;
  /** Whether this payment counts as the first of the series. */
  recurringIncludeCheck?: boolean;
}

/** An existing schedule to edit, plus optional limits on what it may offer. */
export interface IRecurringModalData extends Partial<IRecurringResult> {
  /** The half the caller cannot honour yet; its tab shows disabled as Coming soon. */
  unavailableMode?: 'scheduled' | 'recurring';
  /** Narrows the frequency list to what the caller's endpoint accepts. */
  frequencyOptions?: readonly { value: string; label: string }[];
  /** The code to open on. Each endpoint numbers its frequencies differently. */
  defaultFrequency?: string;
  /** Off for a caller whose endpoint has no such flag. */
  showIncludeThisPayment?: boolean;
  /**
   * Which of the three ends the caller's endpoint takes. Direct deposit has no
   * end date, so offering one would collect a value it silently drops.
   */
  endOptions?: readonly string[];
}

/**
 * Compact-page v4 recurring-payment modal. A readability-focused replacement for
 * the shared v3.5 `RecurringModalComponent` — same fields and same result shape,
 * but self-explanatory copy (each end option describes what it does) and the
 * count captured inline as "Pay a set number of times → [N] payments". Used only
 * by the compact Send Payment flow; the legacy modal stays for the older v3 flows.
 */
@Component({
  selector: 'app-recurring-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatTooltip,
    FaIconComponent,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    V4DatePickerComponent,
    SpSelectDropdownComponent
  ],
  templateUrl: './recurring-modal-v4.component.html'
})
export class RecurringModalV4Component {
  private dialogRef = inject(MatDialogRef<RecurringModalV4Component>);
  private fb = inject(FormBuilder);
  /** Existing schedule to edit; null when creating a fresh one. */
  private data = inject<IRecurringModalData | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  readonly unavailableMode = this.data?.unavailableMode ?? null;

  readonly faXmark = faXmark;
  readonly faCircleExclamation = faCircleExclamation;

  /**
   * Same codes/labels as the legacy modal — kept so parent code maps identically
   * — listed shortest interval first, the order the check-mail modal reads in.
   * Only the order changed: every label keeps the code it always had.
   */
  readonly frequencyOptions = this.data?.frequencyOptions ?? [
    { value: '1', label: 'Daily' },
    { value: '2', label: 'Weekly' },
    { value: '5', label: 'Biweekly' },
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bimonthly' },
    { value: '7', label: 'Quarterly' }
  ];

  /** Tomorrow (yyyy-MM-dd) — the earliest allowed start date. */
  readonly minDate = this.tomorrow();

  /** On, as the check-mail modal has it. A caller whose endpoint has no such
   *  flag turns it off rather than offering a tick that goes nowhere. */
  readonly showIncludeThisPayment = this.data?.showIncludeThisPayment ?? true;

  /** All three unless the caller narrows them. */
  readonly endOptions = this.data?.endOptions ?? ['3', '1', '2'];

  offersEnd(option: string): boolean {
    return this.endOptions.includes(option);
  }

  readonly form: FormGroup = this.fb.group({
    mode: [this.initialMode()],
    scheduleDate: [this.data?.scheduleDate || this.minDate, Validators.required],
    frequency: [
      this.data?.frequency ?? this.data?.defaultFrequency ?? '3',
      Validators.required
    ],
    start_date: [this.data?.start_date || this.minDate, Validators.required],
    end_select: [this.data?.end_select ?? '3'],
    // Seed the count from an existing "pay a set number" schedule; else a friendly default.
    count: [this.data?.end_select === '1' && this.data?.count ? this.data.count : 12],
    until: [this.data?.end_select === '2' ? (this.data?.until ?? '') : ''],
    recurringIncludeCheck: [this.data?.recurringIncludeCheck ?? true]
  });

  setMode(mode: 'scheduled' | 'recurring'): void {
    if (mode === this.unavailableMode) return;
    this.form.controls.mode.setValue(mode);
  }

  private initialMode(): 'scheduled' | 'recurring' {
    const requested = this.data?.mode ?? 'recurring';
    if (requested !== this.unavailableMode) return requested;
    return requested === 'recurring' ? 'scheduled' : 'recurring';
  }

  get isScheduled(): boolean {
    return this.form.controls.mode.value === 'scheduled';
  }

  get scheduleBeforeMin(): boolean {
    return (this.form.controls.scheduleDate.value ?? '') < this.minDate;
  }

  constructor() {
    // When opening straight into an end option (edit), enforce its field up front.
    this.applyEndValidators(this.form.controls.end_select.value);

    this.form.controls.end_select.valueChanges.subscribe((value) =>
      this.applyEndValidators(value)
    );
  }

  /** True while the chosen end date is earlier than the start date. */
  get untilBeforeStart(): boolean {
    const until = this.form.controls.until.value ?? '';
    const start = this.form.controls.start_date.value ?? '';
    return !!until && !!start && until < start;
  }

  private applyEndValidators(endSelect: string): void {
    this.applyCountValidators(endSelect === '1');

    const { until } = this.form.controls;
    until.setValidators(endSelect === '2' ? [Validators.required] : []);
    until.updateValueAndValidity();
  }

  /**
   * A schedule that stops after zero payments never pays anyone, so one is the
   * floor. `required` alone lets `0` through — it only rejects null and empty —
   * and the save then failed on its own guard with nothing on screen to explain
   * it. `setValidators` rather than `addValidators` so the rule cannot stack up
   * across repeated switches between the two end options.
   */
  private applyCountValidators(isSetNumber: boolean): void {
    const { count } = this.form.controls;
    count.setValidators(
      isSetNumber ? [Validators.required, Validators.min(1)] : []
    );
    count.updateValueAndValidity();
  }

  /** True while the chosen start date is earlier than tomorrow. */
  get startBeforeMin(): boolean {
    return (this.form.controls.start_date.value ?? '') < this.minDate;
  }

  save(): void {
    this.form.markAllAsTouched();
    const c = this.form.controls;

    // One-time scheduled send.
    if (c.mode.value === 'scheduled') {
      if (this.scheduleBeforeMin) return;
      this.dialogRef.close({
        mode: 'scheduled',
        scheduleDate: c.scheduleDate.value,
        frequency: '',
        start_date: '',
        end_select: '',
        count: '',
        until: ''
      } as IRecurringResult);
      return;
    }

    // Recurring.
    if (this.startBeforeMin || c.frequency.invalid || c.start_date.invalid) return;
    if (c.end_select.value === '1' && c.count.invalid) return;
    if (c.end_select.value === '2' && (c.until.invalid || this.untilBeforeStart)) {
      return;
    }

    // Only the chosen end option travels; the other two would contradict it.
    const endSelect = c.end_select.value;
    this.dialogRef.close({
      mode: 'recurring',
      scheduleDate: '',
      frequency: c.frequency.value,
      start_date: c.start_date.value,
      end_select: endSelect,
      count: endSelect === '1' ? c.count.value : '',
      until: endSelect === '2' ? c.until.value : '',
      recurringIncludeCheck: !!c.recurringIncludeCheck.value
    } as IRecurringResult);
  }

  private tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
