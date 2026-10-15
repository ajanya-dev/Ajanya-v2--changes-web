import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-add-question-modal',
  templateUrl: './add-question-modal.component.html',
  styleUrls: ['./add-question-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    MatDialogActions,
    NgIf,
    FontAwesomeModule
  ]
})
export class AddQuestionModalComponent implements OnInit, OnDestroy {
  public data: { selectedItem: string } = inject(MAT_DIALOG_DATA);
  private fb = inject(UntypedFormBuilder);
  private usersupportservice = inject(UserSupportService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<AddQuestionModalComponent>);

  faXmark = faXmark;
  fileNameOne = '';
  questionForm!: UntypedFormGroup;
  loading = false;
  btnDisable = false;
  subscriptions: Subscription[] = [];
  array: string[] = [];
  selectedItem = this.data ? this.data.selectedItem : null;

  ngOnInit(): void {
    this.initFormGroup();
  }

  initFormGroup() {
    this.questionForm = this.fb.group({
      categoryName: new UntypedFormControl('', [Validators.required]),
      categoryType: new UntypedFormControl('', [Validators.required]),
      categoryMessege: new UntypedFormControl('', [Validators.required]),
      attachmentIds: this.fb.array([])
    });
  }

  createCategoryBody() {
    const data = this.questionForm.value;
    return {
      subject: data.categoryName,
      severity: data.categoryType,
      message: data.categoryMessege,
      attachmentIds: this.array
    };
  }

  setFormValue(name: string, value: string) {
    return this.questionForm.get(name)?.setValue(value);
  }

  onSubmit() {
    this.questionForm.markAllAsTouched();
    if (!this.selectedItem) {
      this.onSave();
    }
  }

  uploadInput(event:  { target: { files: File[], name:string } }): void {
    if (event.target.name === 'quesAttachment') {
      this.fileNameOne = event.target.files[0].name;
    }
    this.btnDisable = true;

    const form = new FormData();
    form.append('attachment', event.target.files[0]);

    this.subscriptions.push(
      this.usersupportservice
        .addAttachments(form)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.array.push(res?.data?.id);
              this.array = this.array.filter(
                (val: string) => val === res?.data?.id
              );
            }

            this.questionForm.value.attachmentIds.push(res.data.id);
          },
          (err) => {
            if (!err.error.success) {
              this.fileNameOne = '';
            }
          }
        )
    );
  }

  onSave() {
    if (!this.questionForm.invalid) {
      this.loading = true;
      this.subscriptions.push(
        this.usersupportservice
          .askQuestion(this.createCategoryBody())
          .pipe(
            catchError((err) => {
              this.loading = false;
              if (err.error.success === false) {
                const getElement = document.querySelector(
                  '.common_err'
                ) as HTMLInputElement;

                getElement.innerHTML = err.error.errorMsg;
                setTimeout(() => {
                  getElement.innerHTML = '';
                }, 1900);
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            this.loading = false;
            if (res.success === true) {
              this.dialogRef.close();
              this.successAlert('Message Sent');
            }
          })
      );
    }
  }

  successAlert(content: string) {
    const data = {
      title: 'success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
