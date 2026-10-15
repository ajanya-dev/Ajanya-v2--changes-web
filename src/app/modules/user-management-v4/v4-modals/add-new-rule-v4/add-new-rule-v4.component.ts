import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import {
  IAddPolicyData,
  IApproverData,
  IApprovers,
  IExistingRules
} from 'src/app/models/user';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';

interface IRuleForm {
  name: FormControl<string | null>;
  criteriaType: FormControl<string | null>;
  criteriaOperator: FormControl<string | null>;
  criteriaValue: FormControl<string | null>;
  approvalType: FormControl<string | null>;
}

/**
 * V4 parallel of the v3 AddNewRuleComponent.
 * Creates/edits a simple single-level amount-based approval rule.
 */
@Component({
  selector: 'app-add-new-rule-v4',
  standalone: true,
  templateUrl: './add-new-rule-v4.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OverlayModule,
    LucideAngularModule,
    V4SelectDropdownComponent,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component
  ]
})
export class AddNewRuleV4Component implements OnInit, OnDestroy {
  private userService = inject(UserManagementService);
  private fb = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<AddNewRuleV4Component>);
  private data = inject<IExistingRules | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  ruleForm!: FormGroup<IRuleForm>;
  approvers = signal<IApprovers[]>([]);
  selectedApprovers = signal<IApproverData[]>([]);
  saving = signal(false);
  editMode = computed(() => !!this.data?.id);

  dropdownOpen = signal(false);
  approverSearch = signal<string>('');

  operatorOptions: IV4SelectOption[] = [
    { id: '>', name: 'Greater than (>)', value: '>' },
    { id: '<', name: 'Less than (<)', value: '<' },
    { id: '==', name: 'Equal to (=)', value: '==' }
  ];

  approvalTypeOptions: IV4SelectOption[] = [
    { id: 'and', name: 'Everyone needs to approve', value: 'and' },
    { id: 'or', name: 'Any one needs to approve', value: 'or' }
  ];

  overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
  ];

  subscriptions: Subscription[] = [];

  filteredApprovers = computed<IApprovers[]>(() => {
    const term = this.approverSearch().trim().toLowerCase();
    const list = this.approvers();
    return term
      ? list.filter((a) => a.client_name.toLowerCase().includes(term))
      : list;
  });

  ngOnInit(): void {
    this.getAllApprovers();
    this.initForm();
    if (this.data?.id) {
      this.fillEditData();
    }
  }

  private fillEditData(): void {
    if (!this.data) return;
    this.ruleForm.patchValue({
      name: this.data.name,
      criteriaType: this.data.criteriaType,
      criteriaOperator: this.data.criteriaOperator,
      criteriaValue: this.data.criteriaValue,
      approvalType: this.data.approvalType
    });
    this.selectedApprovers.set(this.data.approverData ?? []);
  }

  private getAllApprovers(): void {
    this.subscriptions.push(
      this.userService.getApprovers().subscribe((res) => {
        this.approvers.set(res?.data ?? []);
      })
    );
  }

  private initForm(): void {
    this.ruleForm = this.fb.group<IRuleForm>({
      name: this.fb.control('', [Validators.required]),
      criteriaType: this.fb.control('amount', [Validators.required]),
      criteriaOperator: this.fb.control('>', [Validators.required]),
      criteriaValue: this.fb.control('', [Validators.required]),
      approvalType: this.fb.control('and', [Validators.required])
    });
  }

  isApproverSelected(clientId: string): boolean {
    return this.selectedApprovers().some((a) => a.userId === clientId);
  }

  toggleApprover(clientId: string): void {
    if (this.isApproverSelected(clientId)) {
      this.removeApprover(clientId);
    } else {
      this.selectApprover(clientId);
    }
  }

  selectApprover(clientId: string): void {
    if (this.isApproverSelected(clientId)) return;
    const match = this.approvers().find((a) => a.client_id === clientId);
    if (!match) return;
    this.selectedApprovers.set([
      ...this.selectedApprovers(),
      { userId: match.client_id, username: match.client_name }
    ]);
  }

  removeApprover(userId: string): void {
    this.selectedApprovers.set(
      this.selectedApprovers().filter((a) => a.userId !== userId)
    );
  }

  toggleDropdown(): void {
    this.approverSearch.set('');
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.saving()) return;
    if (this.ruleForm.invalid || !this.selectedApprovers().length) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    const data = {
      ...this.ruleForm.value,
      approverData: this.selectedApprovers()
    } as IAddPolicyData;
    this.saving.set(true);
    const request$ =
      this.editMode() && this.data?.id
        ? this.userService.updateRule(this.data.id, data)
        : this.userService.addNewRule(data);
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
            const editedData = { ...data, id: this.data.id };
            this.dialogRef.close({ edit: true, rule: editedData });
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
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
