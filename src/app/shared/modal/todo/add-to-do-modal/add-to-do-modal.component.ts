import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import {
  IGetTodo,
  IToDoBody,
  ITodoData
} from 'src/app/shared/modal/todo/model/todo';
import { DatePipe, NgIf, NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

/**
 * @description Modal component for adding `todo`.
 */
@Component({
  selector: 'app-add-to-do-modal',
  templateUrl: './add-to-do-modal.component.html',
  styleUrls: ['./add-to-do-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    MatInput,
    MatFormField,
    MatLabel,
    NgIf,
    MatError,
    MatDialogActions,
    NgClass
  ]
})
export class AddToDoModalComponent implements OnInit, OnDestroy {
  mindate: Date | string;
  subscriptions: Subscription[] = [];
  typeId: string;
  type: string;
  isRefresh = false;
  todoForm: UntypedFormGroup;
  details: IGetTodo;
  submitting = false;
  time: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ITodoData, //Get Data From Modal
    private fb: UntypedFormBuilder,
    private _alertService: AlertService,
    public __dialog: MatDialog,
    private datePipe: DatePipe,
    public dialogRef: MatDialogRef<AddToDoModalComponent>,
    private todoService: TodoService,
    private dataTableService: DataTableService
  ) {}

  ngOnInit(): void {
    this.typeId = this.data.id;
    this.details = this.data.data;
    this.type = this.data.type;

    this.initForm();
    if (this.data.editMode) {
      this.setTodoBody();
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate());
      this.mindate = this.datePipe.transform(
        futureDate,
        'yyyy-MM-dd'
      ) as string;
      this.todoForm.get('dueDate')?.setValue(this.mindate);
      this.time = '23:59';
    }
  }

  /**
   * @description Initializes the to do form.
   */
  initForm(): void {
    this.todoForm = this.fb.group({
      dueDate: ['', [Validators.required]],
      details: ['', [Validators.required]]
    });
  }

  /**
   * @description Creates body object for `todoForm` and returns it.
   * @returns `todoForm` body object.
   */
  createTodoBody(): IToDoBody {
    const data = this.todoForm.value;
    const body: IToDoBody = {
      dueDate: data.dueDate + ' ' + this.tConvert(this.time),
      todoDetails: data.details
    };
    return body;
  }

  /**
   * @description Updates the `todoForm` with details.
   */
  setTodoBody(): void {
    const newDate = this.datePipe.transform(
      this.details.due_date.split(' ')[0],
      'yyyy-MM-dd'
    )!;
    const newtime = this.details.due_date.split(' ')[1];
    this.time = newtime;
    this.todoForm.patchValue({
      dueDate: newDate,
      details: this.details.todo_details
    });
  }

  /**
   * @description Method to convert the time to the required format.
   * @param time - time input.
   * @returns converted time.
   */
  tConvert(time: any) {
    time = time
      .toString()
      .match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time.length > 1) {
      time = time.slice(1);
      time[5] = +time[0] < 12 ? ' AM' : ' PM';
      time[0] = +time[0] % 12 || 12;
    }
    return time.join('');
  }

  /**
   * @description Updates to do by submitting the updated data to `updateTodo` method of to do service.
   * @param body - to do data.
   */
  updateTodo(body: IToDoBody): void {
    this.submitting = true;
    this.subscriptions.push(
      this.todoService
        .updateTodo(this.type, this.typeId, this.details.encrypted_id, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close(true);
            const data = {
              title: 'Success!',
              content: 'Todo updated.',
              close: true
            };
            this._alertService.successAlert(data);
          }
        })
    );
  }

  /**
   * @description Method to add to do by submitting the newly created to do to the `addTodo` method of to do service.
   * @param body
   */
  addTodo(body: IToDoBody): void {
    this.submitting = true;
    this.subscriptions.push(
      this.todoService
        .addTodo(this.type, this.typeId, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.isRefresh = true;
            this.dialogRef.close(true);
            this.successAlert();
          }
        })
    );
  }

  /**
   * @description Runs form validations and invokes `this.updateTodo` or `this.addTodo` method,
   * based on whether the to do is being updated or a new to do is being added, respectively.
   */
  onSubmit(): void {
    this.todoForm.markAllAsTouched();
    if (this.todoForm.invalid) {
      return;
    }
    const data = {
      title: 'Oops',
      content: 'please select a valid date',
      doneMsg: 'ok'
    };
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate());
    const currentDate = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
    if (this.todoForm.value.dueDate < currentDate!) {
      this._alertService.warningAlert(data);
      return;
    }
    const processedData = this.createTodoBody();
    if (this.data.editMode) {
      this.updateTodo(processedData);
    } else {
      this.addTodo(processedData);
    }
  }

  /**
   * @description Shows success alert dialog.
   */
  successAlert(): void {
    const data = {
      title: 'Success!',
      content: 'To-Dos Added.',
      close: true
    };
    this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
