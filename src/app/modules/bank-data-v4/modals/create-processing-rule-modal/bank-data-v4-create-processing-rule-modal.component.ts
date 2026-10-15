import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { Utils } from 'src/app/data/utils';
import { BankDataV4ApiService } from '../../services/bank-data-v4-api.service';
import { BankDataV4RulesService } from '../../services/bank-data-v4-rules.service';
import {
  buildRuleData,
  decodeRuleData,
  deriveRuleName,
  IAmountCondition,
  IDateCondition,
  IDescriptionCondition,
  IRuleFormState
} from '../../services/bank-data-v4-rule-payload.util';
import {
  buildCategoryTree,
  indentNameByLevel
} from '../../services/bank-data-v4-category.util';

export interface IBankDataV4CreateProcessingRuleData {
  categories?: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
  /** Pre-fill the first merchant condition from a transaction description. */
  description?: string;
  /** Provided when opening in edit mode. */
  editRule?: {
    id: string;
    name?: string;
    description?: string;
    ruleData: { ifs?: unknown[]; thens?: unknown[] };
  };
}

@Component({
  selector: 'app-bank-data-v4-create-processing-rule-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatDialogModule,
    CommonButtonV4Component,
    CommonToggleV4Component,
    V4DatePickerComponent,
    V4SelectDropdownComponent,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './bank-data-v4-create-processing-rule-modal.component.html'
})
export class BankDataV4CreateProcessingRuleModalComponent {
  readonly XIcon = X;
  private dialogRef =
    inject<MatDialogRef<BankDataV4CreateProcessingRuleModalComponent>>(
      MatDialogRef
    );

  private api = inject(BankDataV4ApiService);
  private rulesApi = inject(BankDataV4RulesService);
  private alertService = inject(V4AlertService);
  private data = inject<IBankDataV4CreateProcessingRuleData>(MAT_DIALOG_DATA);

  readonly utils = Utils;

  readonly descriptionOperatorOptions: IV4SelectOption[] = [
    { id: 'contains', name: 'Contains', value: 'contains' },
    { id: 'exact', name: 'Exact', value: 'exact' }
  ];

  readonly amountOperatorOptions: IV4SelectOption[] = [
    { id: 'more_than', name: 'More than', value: 'more_than' },
    { id: 'less_than', name: 'Less than', value: 'less_than' },
    { id: 'equals', name: 'Equals', value: 'equals' },
    { id: 'between', name: 'Between', value: 'between' }
  ];

  readonly dateOperatorOptions: IV4SelectOption[] = [
    { id: 'after', name: 'After', value: 'after' },
    { id: 'before', name: 'Before', value: 'before' },
    { id: 'on', name: 'On', value: 'on' },
    { id: 'between', name: 'Between', value: 'between' }
  ];

  readonly prefillDescription = this.data?.description ?? '';

  readonly categoryOptions = signal<{ id: string; name: string }[]>([]);
  readonly categoriesLoading = signal(false);

  /** ng-select config for the Update category dropdown (mirrors create-category). */
  readonly categoryConfig: Iv4ngSelectConfig = {
    placeholder: 'Select category',
    displayField: 'name',
    outputField: 'id',
    trimSelectedIndent: true
  };

  readonly accountOptions: IV4SelectOption[] = (this.data?.accounts ?? []).map(
    (a) => ({ id: a.id, name: a.name, value: a.id })
  );

  readonly isEditMode = !!this.data?.editRule;
  readonly editRuleId = this.data?.editRule?.id ?? '';

  // ---------- Condition toggles ----------
  descriptionEnabled = signal(true);
  amountEnabled = signal(false);
  dateEnabled = signal(false);
  accountEnabled = signal(false);

  // ---------- Conditions (arrays for multiple rows) ----------
  descriptions = signal<IDescriptionCondition[]>([
    { operator: 'contains', value: '' }
  ]);

  amounts = signal<IAmountCondition[]>([
    { operator: 'more_than', value: '', from: '', to: '' }
  ]);

  dates = signal<IDateCondition[]>([
    { operator: 'after', value: '', from: '', to: '' }
  ]);

  accountIds = signal<string[]>(['']);

  // ---------- Actions (toggles + values) ----------
  renameDescriptionEnabled = signal(false);
  renameDescriptionValue = signal<string>('');
  updateCategoryEnabled = signal(false);
  updateCategoryValue = signal<string>('');

  isSaving = signal(false);
  submitted = signal(false);

  totalConditions = computed(
    () =>
      (this.descriptionEnabled() ? this.descriptions().length : 0) +
      (this.amountEnabled() ? this.amounts().length : 0) +
      (this.dateEnabled() ? this.dates().length : 0) +
      (this.accountEnabled() ? this.accountIds().length : 0)
  );

  canAddCondition = computed(() => this.totalConditions() < 4);

  hasAnyCondition = computed(() => {
    const hasDescription =
      this.descriptionEnabled() &&
      this.descriptions().some((d) => d.value.trim().length > 0);
    const hasValidAmount =
      this.amountEnabled() &&
      this.amounts().some((a) => !this.isAmountInvalid(a));
    const hasValidDate =
      this.dateEnabled() &&
      this.dates().some((d) => {
        if (d.operator === 'between') {
          return (
            d.from.trim() !== '' &&
            d.to.trim() !== '' &&
            new Date(d.from) < new Date(d.to)
          );
        }
        return d.value.trim() !== '';
      });
    const hasAccount =
      this.accountEnabled() &&
      this.accountIds().some((id) => id.trim().length > 0);
    return hasDescription || hasValidAmount || hasValidDate || hasAccount;
  });

  hasAnyAction = computed(
    () =>
      (this.renameDescriptionEnabled() &&
        this.renameDescriptionValue().trim().length > 0) ||
      (this.updateCategoryEnabled() &&
        this.updateCategoryValue().trim().length > 0)
  );

  /** All enabled fields must be error-free. */
  hasNoValidationErrors = computed(() => {
    if (
      this.descriptionEnabled() &&
      this.descriptions().some((d) => !d.value.trim())
    )
      return false;
    if (
      this.amountEnabled() &&
      this.amounts().some((a) => this.isAmountInvalid(a))
    )
      return false;
    if (
      this.dateEnabled() &&
      this.dates().some((d) => {
        if (d.operator === 'between') {
          return (
            !d.from.trim() || !d.to.trim() || new Date(d.from) >= new Date(d.to)
          );
        }
        return !d.value.trim();
      })
    )
      return false;
    if (this.accountEnabled() && this.accountIds().some((id) => !id.trim()))
      return false;
    if (
      this.renameDescriptionEnabled() &&
      !this.renameDescriptionValue().trim()
    )
      return false;
    if (this.updateCategoryEnabled() && !this.updateCategoryValue().trim())
      return false;
    return true;
  });

  /** Enable submit only when at least one condition AND one action exist AND no errors. */
  canSubmit = computed(
    () =>
      this.hasAnyCondition() &&
      this.hasAnyAction() &&
      this.hasNoValidationErrors() &&
      !this.isSaving()
  );

  isAmountInvalid(amt: IAmountCondition): string | null {
    if (amt.operator === 'between') {
      if (!amt.from.trim() || !amt.to.trim()) return 'Amount is required';
      if (parseFloat(amt.from) <= 0 || parseFloat(amt.to) <= 0)
        return 'Amount must be greater than 0';
      if (parseFloat(amt.from) >= parseFloat(amt.to))
        return 'From must be less than To';
    } else {
      if (!amt.value.trim()) return 'Amount is required';
      if (parseFloat(amt.value) <= 0) return 'Amount must be greater than 0';
    }
    return null;
  }

  constructor() {
    this.loadCategories();
    if (this.isEditMode && this.data.editRule) {
      this.populateFromRuleData(this.data.editRule.ruleData);
    } else if (this.prefillDescription) {
      this.descriptions.set([
        { operator: 'contains', value: this.prefillDescription }
      ]);
    }
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.api
      .getCategories()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (res: {
          success?: boolean;
          data?: {
            categories?: {
              id: string;
              name: string;
              parent_category_id?: string | null;
            }[];
          };
        }) => {
          const categories = res?.data?.categories;
          if (res?.success && Array.isArray(categories)) {
            this.categoryOptions.set(
              buildCategoryTree(categories).map((node) => ({
                id: node.id,
                name: indentNameByLevel(node.name, node.level || 0)
              }))
            );
          }
        }
      });
  }

  // ---------- Description helpers ----------
  addDescription(): void {
    this.descriptions.update((list) => [
      ...list,
      { operator: 'contains', value: '' }
    ]);
  }

  removeDescription(i: number): void {
    this.descriptions.update((list) =>
      list.length > 1 ? list.filter((_, idx) => idx !== i) : list
    );
  }

  updateDescription(
    i: number,
    field: keyof IDescriptionCondition,
    value: string
  ): void {
    this.descriptions.update((list) =>
      list.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  }

  // ---------- Amount helpers ----------
  addAmount(): void {
    this.amounts.update((list) => [
      ...list,
      { operator: 'more_than', value: '', from: '', to: '' }
    ]);
  }

  removeAmount(i: number): void {
    this.amounts.update((list) =>
      list.length > 1 ? list.filter((_, idx) => idx !== i) : list
    );
  }

  updateAmount(i: number, field: keyof IAmountCondition, value: string): void {
    this.amounts.update((list) =>
      list.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        // Clear opposite fields when switching operator
        if (field === 'operator') {
          if (value === 'between') {
            updated.value = '';
          } else {
            updated.from = '';
            updated.to = '';
          }
        }
        return updated;
      })
    );
  }

  // ---------- Date helpers ----------
  addDate(): void {
    this.dates.update((list) => [
      ...list,
      { operator: 'after', value: '', from: '', to: '' }
    ]);
  }

  removeDate(i: number): void {
    this.dates.update((list) =>
      list.length > 1 ? list.filter((_, idx) => idx !== i) : list
    );
  }

  updateDate(i: number, field: keyof IDateCondition, value: string): void {
    this.dates.update((list) =>
      list.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        if (field === 'operator') {
          if (value === 'between') {
            updated.value = '';
          } else {
            updated.from = '';
            updated.to = '';
          }
        }
        return updated;
      })
    );
  }

  // ---------- Account helpers ----------
  addAccount(): void {
    this.accountIds.update((list) => [...list, '']);
  }

  removeAccount(i: number): void {
    this.accountIds.update((list) =>
      list.length > 1 ? list.filter((_, idx) => idx !== i) : list
    );
  }

  updateAccount(i: number, value: string): void {
    this.accountIds.update((list) =>
      list.map((item, idx) => (idx === i ? value : item))
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.canSubmit()) return;

    // Validate amounts (negative, invalid ranges)
    if (this.amountEnabled()) {
      const amountError = this.amounts().find((amt) =>
        this.isAmountInvalid(amt)
      );
      if (amountError) {
        this.alertService.warningAlert({
          content: this.isAmountInvalid(amountError) ?? 'Invalid amount'
        });
        return;
      }
    }

    // Validate date ranges
    if (this.dateEnabled()) {
      const invalidDate = this.dates().find(
        (dt) =>
          dt.operator === 'between' &&
          dt.from &&
          dt.to &&
          new Date(dt.from) >= new Date(dt.to)
      );
      if (invalidDate) {
        this.alertService.warningAlert({
          content: 'From date must be before To date'
        });
        return;
      }
    }

    const formState: IRuleFormState = {
      descriptions: this.descriptionEnabled() ? this.descriptions() : [],
      merchantMatchers: [],
      amounts: this.amountEnabled() ? this.amounts() : [],
      dates: this.dateEnabled() ? this.dates() : [],
      categoryIds: [],
      accountIds: this.accountEnabled()
        ? this.accountIds().filter((id) => id.trim())
        : [],
      renameDescriptionEnabled: this.renameDescriptionEnabled(),
      renameDescriptionValue: this.renameDescriptionValue(),
      updateCategoryEnabled: this.updateCategoryEnabled(),
      updateCategoryValue: this.updateCategoryValue(),
      addTagsEnabled: false,
      tagsValue: '',
      hideTransactionEnabled: false,
      linkToGoalEnabled: false
    };

    const ruleData = buildRuleData(formState);
    const name = this.data?.editRule?.name?.trim() || deriveRuleName(formState);
    const payload = {
      name,
      description: this.data?.editRule?.description ?? '',
      rule_type: 1,
      rule_data: JSON.stringify(ruleData)
    };

    this.isSaving.set(true);
    const request$ = this.isEditMode
      ? this.rulesApi.updateRule(this.editRuleId, payload)
      : this.rulesApi.createRule(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.isEditMode ? 'Rule updated' : 'Rule created'
          });
          this.dialogRef.close({ success: true });
        }
      },
      // Server errors (e.g. "Rule Already Exists!") are surfaced by the global
      // V4 error interceptor; swallow here to avoid a duplicate generic pop-up.
      error: () => {}
    });
  }

  /** Decode stored rule_data into the modal's signal state. */
  private populateFromRuleData(rd: {
    ifs?: unknown[];
    thens?: unknown[];
  }): void {
    const decoded = decodeRuleData(rd);

    if (decoded.descriptions?.length) {
      this.descriptionEnabled.set(true);
      this.descriptions.set(decoded.descriptions);
    }
    if (decoded.amounts?.length) {
      this.amountEnabled.set(true);
      this.amounts.set(decoded.amounts);
    }
    if (decoded.dates?.length) {
      this.dateEnabled.set(true);
      this.dates.set(decoded.dates);
    }
    if (decoded.accountIds?.length) {
      this.accountEnabled.set(true);
      this.accountIds.set(decoded.accountIds);
    }

    this.renameDescriptionEnabled.set(!!decoded.renameDescriptionEnabled);
    this.renameDescriptionValue.set(decoded.renameDescriptionValue ?? '');
    this.updateCategoryEnabled.set(!!decoded.updateCategoryEnabled);
    this.updateCategoryValue.set(decoded.updateCategoryValue ?? '');
  }
}
