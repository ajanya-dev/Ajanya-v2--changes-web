import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Utils } from 'src/app/data/utils';
import {
  IAddPolicyData,
  IApproverData,
  IApprovers,
  IExistingRules
} from 'src/app/models/user';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription } from 'rxjs';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { MatOption } from '@angular/material/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  MatAutocompleteTrigger,
  MatAutocomplete
} from '@angular/material/autocomplete';
import {
  MatChipInput,
  MatChipGrid,
  MatChipRow,
  MatChipRemove
} from '@angular/material/chips';
import { NgSelectModule } from '@ng-select/ng-select';

interface IRuleForm {
  name: FormControl<string | null>;
  criteriaType: FormControl<string | null>;
  criteriaOperator: FormControl<string | null>;
  criteriaValue: FormControl<string | null>;
  approvalType: FormControl<string | null>;
}

@Component({
  selector: 'app-add-new-rule',
  templateUrl: './add-new-rule.component.html',
  styleUrls: ['./add-new-rule.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    MatChipInput,
    MatAutocompleteTrigger,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatAutocomplete,
    MatOption,
    SearchFilterPipe,
    FontAwesomeModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class AddNewRuleComponent implements OnInit, OnDestroy {
  private userService = inject(UserManagementService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private matDialogRef = inject(MatDialogRef);
  private data = inject(MAT_DIALOG_DATA);

  utils = Utils;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  ruleForm: FormGroup<IRuleForm>;
  approvers: IApprovers[];
  editMode = false;
  selectedApprovers: IApproverData[] = [];
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.getAllApprovers();
    this.initForm();
    if (this.data) {
      this.editMode = true;
      this.fillEditData();
    }
  }

  fillEditData() {
    const data = this.data as IExistingRules;
    this.ruleForm.controls.name.setValue(data.name);
    this.ruleForm.controls.criteriaType.setValue(data.criteriaType);
    this.ruleForm.controls.criteriaOperator.setValue(data.criteriaOperator);
    this.ruleForm.controls.criteriaValue.setValue(data.criteriaValue);
    this.ruleForm.controls.approvalType.setValue(data.approvalType);
    this.selectedApprovers = data.approverData;
  }

  getAllApprovers() {
    this.subscriptions.push(
      this.userService.getApprovers().subscribe((res) => {
        this.approvers = res.data;
      })
    );
  }

  initForm() {
    this.ruleForm = this.fb.group({
      name: new FormControl('', [Validators.required]),
      criteriaType: new FormControl('amount', [Validators.required]),
      criteriaOperator: new FormControl('>', [Validators.required]),
      criteriaValue: new FormControl('', [Validators.required]),
      approvalType: new FormControl('and', [Validators.required])
    });
  }

  selectApprover(id: string) {
    let approver;
    if (this.selectedApprovers.length) {
      approver = this.selectedApprovers.find((el) => el.userId === id);
    }
    if (!approver) {
      this.approvers.forEach((el) => {
        if (el.client_id === id) {
          approver = { userId: el.client_id, username: el.client_name };
          return;
        }
      });
      if (approver) {
        this.selectedApprovers.push(approver);
      }
    }
  }

  removeApprover(id: string) {
    const index = this.selectedApprovers.findIndex((el) => el.userId === id);
    this.selectedApprovers.splice(index, 1);
  }

  cancel() {
    this.matDialogRef.close(false);
  }

  submit() {
    const data = {
      ...this.ruleForm.value,
      approverData: this.selectedApprovers
    } as IAddPolicyData;
    if (this.editMode) {
      this.subscriptions.push(
        this.userService.updateRule(this.data.id, data).subscribe((res) => {
          if (res) {
            this.alertService.successAlert({
              content: 'Rule updated successfully'
            });
            const editedData = { ...data, id: this.data.id };
            this.matDialogRef.close({ edit: true, rule: editedData });
          }
        })
      );
    } else {
      this.subscriptions.push(
        this.userService.addNewRule(data).subscribe((res) => {
          if (res) {
            this.alertService.successAlert({
              content: 'Rule added successfully'
            });
            this.matDialogRef.close({ edit: false });
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
