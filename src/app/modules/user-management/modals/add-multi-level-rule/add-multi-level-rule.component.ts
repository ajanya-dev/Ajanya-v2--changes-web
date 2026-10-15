import { CommonModule } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import {
  MatChipGrid,
  MatChipInput,
  MatChipRemove,
  MatChipRow
} from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatOption } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { forkJoin, Subscription } from 'rxjs';
import {
  IAddMultiLevelPolicyData,
  IApproverData,
  IApprovers,
  IMultiLevelExistingRule,
  IUsersList
} from 'src/app/models/user';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';

const ACTIVE_USER_STATUS = 1;
const RULE_NAME_MAX_LENGTH = 50;

interface ILevelForm {
  approvers: FormControl<IApproverData[]>;
}

interface IRuleForm {
  name: FormControl<string>;
  submitterUserId: FormControl<string>;
  levels: FormArray<FormGroup<ILevelForm>>;
}

@Component({
  selector: 'app-add-multi-level-rule',
  templateUrl: './add-multi-level-rule.component.html',
  styleUrls: ['./add-multi-level-rule.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltip,
    MatDialogClose,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatChipInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    SearchFilterPipe,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    V35CommonDropDownSelectorComponent
  ]
})
export class AddMultiLevelRuleComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  private alertService = inject(AlertService);
  private localStorageService = inject(LocalStorageService);
  private dialogRef = inject(MatDialogRef<AddMultiLevelRuleComponent>);
  private data = inject<IMultiLevelExistingRule | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  separatorKeysCodes: number[] = [ENTER, COMMA];
  approvers = signal<IApprovers[]>([]);
  submitterCandidates = signal<IUsersList[]>([]);
  saving = signal(false);
  editMode = computed(() => !!this.data?.id);
  ruleNameMaxLength = RULE_NAME_MAX_LENGTH;

  ruleForm!: FormGroup<IRuleForm>;

  submitterDropdownConfig = {
    placeholder: 'Applies To',
    displayField: 'client_name',
    outputField: 'client_id',
    style: { size: 0 as const, enableLabelIcon: false }
  };

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
    if (this.data?.id) {
      this.fillEditData();
    }
    this.subscriptions.push(
      this.ruleForm.controls.submitterUserId.valueChanges.subscribe(
        (submitterId) => this.pruneApproversFromLevels(submitterId)
      )
    );
  }

  private initForm(): void {
    this.ruleForm = this.fb.group<IRuleForm>({
      name: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(RULE_NAME_MAX_LENGTH)
      ]),
      submitterUserId: this.fb.nonNullable.control('', Validators.required),
      levels: this.fb.array<FormGroup<ILevelForm>>(
        [this.makeLevel()],
        Validators.required
      )
    });
  }

  private makeLevel(initial: IApproverData[] = []): FormGroup<ILevelForm> {
    return this.fb.group<ILevelForm>({
      approvers: this.fb.nonNullable.control<IApproverData[]>(initial, [
        (control) =>
          (control.value as IApproverData[]).length > 0
            ? null
            : { required: true }
      ])
    });
  }

  get levels(): FormArray<FormGroup<ILevelForm>> {
    return this.ruleForm.controls.levels;
  }

  private fillEditData(): void {
    if (!this.data) return;
    this.ruleForm.patchValue({
      name: this.data.name,
      submitterUserId: this.data.approvalRequiredData.submitterUserId
    });
    this.levels.clear();
    this.data.approvalRequiredData.levels.forEach((lvl) => {
      this.levels.push(this.makeLevel(lvl.approvers ?? []));
    });
    if (this.levels.length === 0) {
      this.levels.push(this.makeLevel());
    }
  }

  private loadDropdownData(): void {
    const currentUserId = this.localStorageService.getItem('userId') as
      | string
      | null;
    this.subscriptions.push(
      forkJoin({
        approvers: this.userService.getApprovers(),
        users: this.userService.getApprovalRequiredUsers()
      }).subscribe(({ approvers, users }) => {
        this.approvers.set(approvers?.data ?? []);
        const submitterPool = (users?.data ?? []).filter(
          (u) =>
            u.status === ACTIVE_USER_STATUS && u.client_id !== currentUserId
        );
        this.submitterCandidates.set(submitterPool);
      })
    );
  }

  private pruneApproversFromLevels(submitterId: string | null): void {
    if (!submitterId) return;
    this.levels.controls.forEach((lvl) => {
      const ctrl = lvl.controls.approvers;
      const filtered = ctrl.value.filter((a) => a.userId !== submitterId);
      if (filtered.length !== ctrl.value.length) {
        ctrl.setValue(filtered);
      }
    });
  }

  addLevel(): void {
    this.levels.push(this.makeLevel());
  }

  removeLevel(index: number): void {
    if (this.levels.length <= 1) return;
    this.levels.removeAt(index);
  }

  approversForLevel(levelIndex: number): IApproverData[] {
    return this.levels.at(levelIndex).controls.approvers.value;
  }

  availableApproversFor(levelIndex: number): IApprovers[] {
    const usedIds = new Set<string>();
    const submitterId = this.ruleForm.controls.submitterUserId.value;
    if (submitterId) usedIds.add(submitterId);
    this.levels.controls.forEach((lvl, i) => {
      if (i === levelIndex) return;
      lvl.controls.approvers.value.forEach((a) => usedIds.add(a.userId));
    });
    return this.approvers().filter((a) => !usedIds.has(a.client_id));
  }

  selectApprover(levelIndex: number, clientId: string): void {
    const control = this.levels.at(levelIndex).controls.approvers;
    const current = control.value;
    if (current.some((a) => a.userId === clientId)) return;
    const match = this.approvers().find((a) => a.client_id === clientId);
    if (!match) return;
    control.setValue([
      ...current,
      { userId: match.client_id, username: match.client_name }
    ]);
    control.markAsDirty();
    control.markAsTouched();
  }

  removeApprover(levelIndex: number, userId: string): void {
    const control = this.levels.at(levelIndex).controls.approvers;
    control.setValue(control.value.filter((a) => a.userId !== userId));
    control.markAsDirty();
    control.markAsTouched();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.saving()) return;
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    const value = this.ruleForm.getRawValue();
    const payload: IAddMultiLevelPolicyData = {
      name: value.name,
      criteriaType: 'submitter_two_level',
      approvalType: 'or',
      approvalRequiredData: {
        submitterUserId: value.submitterUserId,
        levels: value.levels.map((l) => ({
          approvalType: 'or',
          approvers: l.approvers
        }))
      }
    };
    this.saving.set(true);
    const request$ =
      this.editMode() && this.data?.id
        ? this.userService.updateRule(this.data.id, payload)
        : this.userService.addNewRule(payload);
    this.subscriptions.push(
      request$.subscribe({
        next: (res) => {
          this.saving.set(false);
          if (!res) return;
          this.alertService.successAlert({
            content: this.editMode()
              ? 'Rule updated successfully'
              : 'Rule added successfully'
          });
          if (this.editMode() && this.data?.id) {
            const editedRule: IMultiLevelExistingRule = {
              ...payload,
              id: this.data.id
            };
            this.dialogRef.close({ edit: true, rule: editedRule });
          } else {
            this.dialogRef.close({ edit: false });
          }
        },
        error: () => {
          this.saving.set(false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
