import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IGetTodo, IToDoBody } from 'src/app/shared/modal/todo/model/todo';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  ROOT_URL = environment.rootUrl;
  constructor(private http: HttpClient) {}

  // todo dashboard section starts
  addTodoDashboard(
    user_id: string,
    data: IToDoBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/dashboard-web/${user_id}/todo`,
      data
    );
  }

  updateTodoDashboard(
    user_id: string,
    encrypted_id: string,
    body: IToDoBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/dashboard-web/${user_id}/todo/${encrypted_id}`,
      body
    );
  }

  toDoListsDashboard(user_id: string): Observable<IApiRes<IGetTodo[]>> {
    return this.http.get<IApiRes<IGetTodo[]>>(
      `${this.ROOT_URL}/dashboard-web/${user_id}/todo`
    );
  }

  getTodoStatusDashboard(
    user_id: string,
    encrypted_id: string,
    body: { [key: string]: string } = {}
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/dashboard-web/${user_id}/todo/${encrypted_id}/status`,
      body
    );
  }

  deleteToDoDashboard(
    user_id: string,
    encrypted_id: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/dashboard-web/${user_id}/todo/${encrypted_id}`
    );
  }
  // todo dashboard section ends

  // todo payee section starts
  addTodo(
    type: string,
    id: string,
    data: IToDoBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/todo`,
      data
    );
  }

  getAllTodo(type: string, id: string): Observable<IApiRes<IGetTodo[]>> {
    return this.http.get<IApiRes<IGetTodo[]>>(
      `${this.ROOT_URL}/${type}/${id}/todo`
    );
  }

  updateTodo(
    type: string,
    id: string,
    data: string,
    body: IToDoBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/todo/${data}`,
      body
    );
  }

  deleteTodo(
    type: string,
    id: string,
    data: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/todo/${data}`
    );
  }

  getTodoStatus(
    type: string,
    id: string,
    data: string,
    body: { [key: string]: string }
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/todo/${data}/status`,
      body
    );
  }
  // todo payee section ends
}
