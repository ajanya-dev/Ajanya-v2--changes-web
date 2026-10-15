import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IGetTodo } from 'src/app/shared/modal/todo/model/todo';
import { V3ToDoModalComponent } from 'src/app/layout/v3-layout/v3-to-do-modal/v3-to-do-modal.component';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { NgIf } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-v3-todo-button',
  templateUrl: './v3-todo-button.component.html',
  styleUrls: ['./v3-todo-button.component.scss'],
  standalone: true,
  imports: [CdkDrag, NgIf]
})
export class V3TodoButtonComponent implements OnInit, OnDestroy {
  /**Dependancy injection using inject method */
  private _dialog = inject(MatDialog);
  private _todoService = inject(TodoService);
  private _headerService = inject(HeaderService);

  /** Variables */
  todoOpened = false;
  subscriptions: Subscription[] = [];
  loading = false;
  todoData: IGetTodo[];
  activeTodo: IGetTodo[];
  userId: string;

  ngOnInit(): void {
    this.loadedHeaderData();
  }

  /**
   * @description Load header data for getting user Id.
   */
  loadedHeaderData() {
    this.subscriptions.push(
      this._headerService._headerData.subscribe((headerData) => {
        if (
          headerData &&
          headerData.userInfo?.encrypted_id &&
          this.userId !== headerData.userInfo?.encrypted_id
        ) {
          this.userId = headerData.userInfo?.encrypted_id;
          this.getAllTodos(headerData.userInfo?.encrypted_id);
        }
      })
    );
  }

  /**
   * @description To fetch all existing todos
   */
  getAllTodos(userId: string) {
    this.loading = true;
    this.subscriptions.push(
      this._todoService
        .toDoListsDashboard(userId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          this.todoData = res.data;
          this.activeTodo = res.data.filter(
            (el) => el.todo_status === 'active'
          );
        })
    );
  }

  /**
   * @description To open todo modal component
   */
  openTodoComponent() {
    this.todoOpened = true;
    const dialogRef = this._dialog.open(V3ToDoModalComponent, {
      height: '670px',
      maxHeight: 'calc(100vh - 100px)',
      minHeight: '25vh',
      width: '350px',
      position: { right: '15px', bottom: '80px' },
      data: this.todoData
    });
    dialogRef
      .afterClosed()
      .subscribe((res: { todos: IGetTodo[]; changeMade: boolean }) => {
        this.getAllTodos(this.userId);
        this.todoOpened = false;
        this.activeTodo = res.todos.filter((el) => el.todo_status === 'active');
        this.todoData = res.todos;
      });
  }

  /**
   * @description Unsubscribe all subscription when the component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
