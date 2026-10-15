export interface IGetTodo {
  due_date: string;
  formated_date: string;
  encrypted_id: string;
  id: number;
  todo_details: string;
  todo_id: string;
  todo_status: string;
  user_name: string;
}
export interface ITodoData {
  data: IGetTodo;
  editMode: boolean;
  id: string;
  type: string;
}

export interface IToDoBody {
  dueDate: string;
  todoDetails: string;
}
