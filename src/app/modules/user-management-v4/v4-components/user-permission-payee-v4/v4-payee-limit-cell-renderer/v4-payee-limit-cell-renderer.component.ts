import { Component, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PayeeLimitCellRendererComponent } from 'src/app/modules/user-management/components/user-permission-payee/payee-limit-cell-renderer/payee-limit-cell-renderer.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4SelectDropdownComponent } from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';

@Component({
  selector: 'app-v4-payee-limit-cell-renderer',
  standalone: true,
  imports: [
    NgSelectModule,
    CommonInputFieldV4Component,
    FormsModule,
    ReactiveFormsModule,
    V4SelectDropdownComponent
  ],
  templateUrl: './v4-payee-limit-cell-renderer.component.html',
  styleUrl: './v4-payee-limit-cell-renderer.component.scss'
})
export class V4PayeeLimitCellRendererComponent extends PayeeLimitCellRendererComponent {
  paginationDropdownStyle = {
    'background-color': 'var(--v4-tertiary-background-color)',
    height: '29px',
    'min-height': '29px',
  };

  v4LimitsToList = [
    {
      id: '0',
      name: 'No Limit',
      value: '0'
    },
    {
      id: '1',
      name: 'Day',
      value: '1'
    },
    {
      id: '2',
      name: 'Week',
      value: '2'
    },
    {
      id: '3',
      name: 'Month',
      value: '3'
    },
    {
      id: '4',
      name: 'Year',
      value: '4'
    }
  ];

  // String-typed mirror of the base class's `selectedLimit` (number | null) so the
  // v4 select dropdown — whose IV4SelectOption items carry string `value`s — can
  // two-way bind without breaking the base class's number-typed flow into the API.
  // Without this, the edit case (API returns `limit_frequency: 1` as a number)
  // never auto-selects the matching option (string '1' !== number 1), and a
  // user-picked string leaks straight into the API payload.
  v4SelectedLimit: string = '';

  constructor() {
    super();
    // Edit-case sync: base signal (number from API) → v4 mirror (string for dropdown).
    effect(() => {
      const value = this.selectedLimit();
      this.v4SelectedLimit =
        value !== null && value !== undefined ? String(value) : '';
    });
  }

  // Save-case sync: dropdown emits string → coerce to number → base signal +
  // base handler (so `updateGridData()` packs a number into the API payload and
  // the input enable/disable logic still runs).
  onV4LimitChange(value: string): void {
    this.selectedLimit.set(Number(value));
    this.onLimitChange(Number(value));
  }
}
