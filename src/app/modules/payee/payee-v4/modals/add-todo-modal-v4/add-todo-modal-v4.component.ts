import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { IToDoBody, ITodoData } from 'src/app/shared/modal/todo/model/todo';

@Component({
  selector: 'app-add-todo-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './add-todo-modal-v4.component.html',
  styleUrls: ['./add-todo-modal-v4.component.scss']
})
export class AddTodoModalV4Component implements OnInit {
  public data = inject<ITodoData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddTodoModalV4Component>);
  private fb = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private todoService = inject(TodoService);
  private destroyRef = inject(DestroyRef);
  private datePipe = inject(DatePipe);

  todoForm!: FormGroup;
  submitting = false;
  time = '23:59';
  minDate = '';

  ngOnInit(): void {
    this.initForm();
    if (this.data.editMode) {
      this.setTodoBody();
    } else {
      const today = new Date();
      this.minDate = this.datePipe.transform(today, 'yyyy-MM-dd') as string;
      this.todoForm.get('dueDate')?.setValue(this.minDate);
    }
  }

  initForm(): void {
    this.todoForm = this.fb.group({
      dueDate: ['', [Validators.required]],
      details: ['', [Validators.required]]
    });
  }

  setTodoBody(): void {
    const newDate =
      this.datePipe.transform(
        this.data.data.due_date.split(' ')[0],
        'yyyy-MM-dd'
      ) ?? '';
    this.time = this.data.data.due_date.split(' ')[1] ?? '23:59';
    this.todoForm.patchValue({
      dueDate: newDate,
      details: this.data.data.todo_details
    });
  }

  createTodoBody(): IToDoBody {
    const data = this.todoForm.value;
    return {
      dueDate: `${data.dueDate} ${this.tConvert(this.time)}`,
      todoDetails: data.details
    };
  }

  tConvert(time: string): string {
    let t: (string | number)[] = time
      .toString()
      .match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) ?? [time];
    if (t.length > 1) {
      t = [...t.slice(1)];
      t[5] = +t[0] < 12 ? ' AM' : ' PM';
      t[0] = +t[0] % 12 || 12;
    }
    return t.join('');
  }

  onSubmit(): void {
    this.todoForm.markAllAsTouched();
    if (this.todoForm.invalid) return;

    const today = new Date();
    const currentDate = this.datePipe.transform(today, 'yyyy-MM-dd') ?? '';
    if (this.todoForm.value.dueDate < currentDate) {
      this.alertService.warningAlert({
        content: 'Please select a valid date'
      });
      return;
    }

    const body = this.createTodoBody();
    if (this.data.editMode) {
      this.updateTodo(body);
    } else {
      this.addTodo(body);
    }
  }

  private addTodo(body: IToDoBody): void {
    this.submitting = true;
    this.todoService
      .addTodo(this.data.type, this.data.id, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.dialogRef.close(true);
          this.alertService.successAlert({
            title: 'Success!',
            content: 'To-Do Added.',
            close: true
          });
        }
      });
  }

  private updateTodo(body: IToDoBody): void {
    this.submitting = true;
    this.todoService
      .updateTodo(
        this.data.type,
        this.data.id,
        this.data.data.encrypted_id,
        body
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.dialogRef.close(true);
          this.alertService.successAlert({
            title: 'Success!',
            content: 'To-Do Updated.',
            close: true
          });
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
