import { OnDestroy } from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Inject, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { KnowledgeBaseService } from 'src/app/shared/service/knowledge-base/knowledge-base.service';
import { ISuccessAlert } from 'src/app/models/alert';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-group-modal',
  templateUrl: './group-modal.component.html',
  styleUrls: ['./group-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class GroupModalComponent implements OnInit, OnDestroy {
  groupsForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  isEditMode = false;
  onSubmitButtonText = 'Save';
  modalHeader = 'New';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: string,
    private fb: UntypedFormBuilder,
    public knowledgeBaseService: KnowledgeBaseService,
    private dialogRef: MatDialogRef<GroupModalComponent>,
    private _alertService: AlertService
  ) {}

  ngOnInit() {
    this.initGroupForm();
    this.editModeCheck();
  }

  /**
   * @description checking mode and changing contents.
   *
   */
  editModeCheck() {
    if (this.data) {
      this.isEditMode = true;
      this.onSubmitButtonText = 'Update';
      this.modalHeader = 'Update';
      this.getGroupData();
    }
  }

  /**
   * @description Get groups data.
   *
   */
  getGroupData() {
    this.subscriptions.push(
      this.knowledgeBaseService.getGroupById(this.data).subscribe((res) => {
        const group = res.data[0];

        this.groupsForm.patchValue({
          group_name: group.group_name,
          status: group.status,
          short_description: group.short_description,
          orders: group.orders
        });
      })
    );
  }

  /**
   * @description  Initializes the form group for the bill form.
   */
  initGroupForm(): void {
    this.groupsForm = this.fb.group({
      group_name: ['', [Validators.required]],
      status: ['Active'],
      short_description: ['', [Validators.required]],
      orders: ['0']
    });
  }

  /**
   * @description  Submit the group form.
   */
  onSubmit() {
    this.groupsForm.markAllAsTouched();
    if (this.groupsForm.valid) {
      if (!this.isEditMode) {
        this.postGroup();
      } else {
        this.updateGroup(this.data);
      }
    }
  }

  /**
   * @description Creates group form data.
   */
  groupsFormBody() {
    const data = this.groupsForm.value;
    return {
      id: '',
      group_name: data.group_name,
      status: data.status,
      short_description: data.short_description,
      orders: data.orders
    };
  }

  /**
   * @description Success alert.
   */
  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content ? content : 'Group created',
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.successAlert(data);
  }

  /**
   * @description Add group.
   */
  postGroup() {
    this.subscriptions.push(
      this.knowledgeBaseService
        .postGroup(this.groupsFormBody())
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert();
            this.dialogRef.close(this.groupsForm.value.group_name);
          }
        })
    );
  }

  /**
   * @description Edit group.
   */
  updateGroup(id: string) {
    this.subscriptions.push(
      this.knowledgeBaseService
        .updateGroup(this.groupsFormBody(), id)
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert();
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
