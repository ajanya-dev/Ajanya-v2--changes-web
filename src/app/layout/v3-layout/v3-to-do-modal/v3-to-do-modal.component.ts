import { DatePipe, NgIf, NgFor, NgClass } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IGetTodo, IToDoBody } from 'src/app/shared/modal/todo/model/todo';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { ControlMessageComponent } from '../../../shared/components/control-message/control-message/control-message.component';
import { MatInput } from '@angular/material/input';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';

/**
 * @description Home page to-do modal for add todo ,view todo and edit todo
 */
@Component({
  selector: 'app-v3-to-do-modal',
  templateUrl: './v3-to-do-modal.component.html',
  styleUrls: ['./v3-to-do-modal.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatCheckbox,
    NgClass,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatInput,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class V3ToDoModalComponent implements OnInit, OnDestroy {
  /* Dependancy injection using inject method */
  private _datePipe = inject(DatePipe);
  private _todoService = inject(TodoService);
  private alertService = inject(AlertService);
  private _dialogRef = inject(MatDialogRef);
  private _dialogData = inject(MAT_DIALOG_DATA);
  private _formBuilder = inject(FormBuilder);
  private _localStorageService = inject(LocalStorageService);

  /* Variable declaracions */
  time = '23:59'; /** Last minute of a day */
  date = '';
  mindate: string;
  type: 'dashboard-web';
  todoData: IGetTodo[] = this._dialogData ? this._dialogData : [];
  subscriptions: Subscription[] = [];
  loading = false;
  editMode = false;
  editIndex: number | undefined;
  selectedTodo: IGetTodo | undefined;
  todoForm: FormGroup;
  changeMade = false;
  userId = this._localStorageService.getItem('encryptedUserId') || '';
  settings = [
    {
      id: 'edit_todo',
      name: 'Edit',
      icon: 'fa-regular fa-pen-to-square',
      toolTip: 'Edit todo'
    },
    {
      id: 'delete_todo',
      name: 'Delete',
      icon: 'fa-sharp fa-solid fa-trash',
      toolTip: 'Delete todo'
    }
  ];

  ngOnInit(): void {
    this.minDateSet();
    this.initTodoForm();
  }

  /**
   * @description Todo form initialization
   */
  initTodoForm() {
    this.todoForm = this._formBuilder.group({
      details: ['', [Validators.required]]
    });
  }

  /**
   * @description Settting minimum date as today
   *  can't select past date's
   */
  minDateSet() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate());
    const minDate = this._datePipe.transform(futureDate, 'yyyy-MM-dd');
    if (minDate) {
      this.date = minDate;
      this.mindate = minDate;
    }
    if (!this._dialogData) {
      this.getAllTodo();
    }
  }

  /**
   * @description Fetch all existing todo's
   */
  getAllTodo(): void {
    this.loading = true;
    this.subscriptions.push(
      this._todoService
        .toDoListsDashboard(
          this._localStorageService.getItem('encryptedUserId') || ''
        )
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          this.todoData = res.data;
        })
    );
  }

  /**
   * @description Change the status of todo
   * @param evt Event happened
   * @param todo Entire selected todo details
   * @param index Index number of todo
   */
  onTodoStatusChange(evt: Event, todo: IGetTodo, index: number) {
    this.loading = true;
    this.changeMade = true;
    const event = evt.target as HTMLInputElement;
    const body: { [key: string]: string } = {};
    event.checked ? (body.status = 'done') : (body.status = 'active');
    this._todoService
      .getTodoStatusDashboard(this.userId, todo.encrypted_id, body)
      .subscribe((res) => {
        if (res.success) {
          this.todoData[index].todo_status = body.status;
          this.loading = false;
          this.getAllTodo();
        }
      });
    this.loading = false;
  }

  /**
   * @description Decides which function wants to be called
   * @param id Menu item's id
   * @param index Index number of todo
   * @param todoId Todo id
   */
  onTodoMenuClick(id: string, index: number, todoId: string) {
    switch (id) {
      case 'edit_todo':
        this.editTodoFieldFill(index);
        break;
      case 'delete_todo':
        this.deleteTodo(index, todoId);
        break;
    }
  }

  /**
   * @description Add a new todo
   * @returns
   */
  addTodoSubmit() {
    const type = 'dashboard-web';
    if (this.date === '' || this.time === '' || this.todoForm.invalid) {
      return;
    }
    this.changeMade = true;
    this.loading = true;
    const body: IToDoBody = this.createTodoBody();
    this._todoService
      .addTodo(type, this.userId, body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((res) => {
        if (res.success) {
          const data = {
            title: 'Success!',
            content: 'To-Dos Added.',
            close: true
          };
          this.alertService.successAlert(data);
          this.getAllTodo();
          this.clearFields();
        }
      });
  }

  /**
   *
   * @descrition It @returns an object in the correct format to add new todo
   */
  createTodoBody() {
    const body: IToDoBody = {
      dueDate: this.date + ' ' + this.timeConvert(this.time),
      todoDetails: this.todoForm.controls.details.value
    };
    return body;
  }

  /**
   * @description It @returns a dueTime in 'DD/MM/YYYY HR:MIN am/pm' format by compaining date and time and formating
   * @param time Selected time
   */
  timeConvert(time: any) {
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
   * @description Fill the fields when edit clicked
   * @param index Todo index
   */
  editTodoFieldFill(index: number) {
    this.editIndex = index;
    this.selectedTodo = this.todoData[index];
    this.editMode = true;
    this.date = this._datePipe.transform(
      this.todoData[index].due_date.split(' ')[0],
      'yyyy-MM-dd'
    )!;
    this.time = this.todoData[index].due_date.split(' ')[1];
    this.todoForm.controls.details.setValue(this.todoData[index].todo_details);
  }

  /**
   * @description Submit the todo after editing
   */
  editTodoSubmit() {
    if (this.date === '' || this.time === '' || this.todoForm.invalid) {
      return;
    }
    this.changeMade = true;
    const body: IToDoBody = this.createTodoBody();
    if (this.selectedTodo) {
      this._todoService
        .updateTodoDashboard(this.userId, this.selectedTodo?.encrypted_id, body)
        .subscribe((res) => {
          if (res.success && this.editIndex !== undefined) {
            const data = {
              title: 'Success!',
              content: 'Todo updated.',
              close: true
            };
            this.alertService.successAlert(data);
            this.todoData[this.editIndex].formated_date = body.dueDate;
            this.todoData[this.editIndex].todo_details = body.todoDetails;
            this.editMode = false;
            this.selectedTodo = undefined;
            this.editIndex = undefined;
            this.clearFields();
          }
        });
    }
  }

  /**
   * @description Delete an existing todo
   * @param index Todo index
   * @param todoId Selected todo's id
   */
  deleteTodo(index: number, todoId: string) {
    const data = { content: 'Are you sure you want to delete?' };
    const alert = this.alertService.confirmAlert(data);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.changeMade = true;
        this.subscriptions.push(
          this._todoService
            .deleteToDoDashboard(
              this._localStorageService.getItem('encryptedUserId') || '',
              todoId
            )
            .subscribe((res) => {
              if (res) {
                this.todoData.splice(index, 1);
                const datas = {
                  content: 'Deleted Successfully',
                  close: true,
                  timeout: 1500
                };
                this.alertService.successAlert(datas);
              }
            })
        );
      }
    });
  }

  /**
   * @description Close the modal
   */
  close() {
    if (this.loading) {
      return;
    }
    this._dialogRef.close({
      todos: this.todoData,
      changeMade: this.changeMade
    });
  }

  /**
   * @description Clear all fields
   */
  clearFields() {
    this.editIndex = undefined;
    this.editMode = false;
    this.date = this.mindate;
    this.time = '23:59';
    this.todoForm.controls.details.setValue('');
    this.todoForm.controls.details.markAsUntouched();
  }

  /**
   * @description Decides wheather its an edit or add and calling the corresponding function
   */
  submit() {
    this.todoForm.markAllAsTouched();
    if (this.editMode) {
      this.editTodoSubmit();
    } else {
      this.addTodoSubmit();
    }
  }

  /**
   * @description Unsubscribe to all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
