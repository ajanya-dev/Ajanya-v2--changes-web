import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IGroups,
  IKnowledgeBaseArticle
} from 'src/app/modules/business-tools/knowledge-base/model/knowledge-base';
import { IApiRes } from 'src/app/models/api';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  ROOT_URL = environment.rootUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  cardClicked = false;

  // Articles

  getArticles(): Observable<IApiRes<IKnowledgeBaseArticle[]>> {
    return this.http.get<IApiRes<IKnowledgeBaseArticle[]>>(
      `${this.ROOT_URL}/publish-article/get-publish-article/`
    );
  }

  getArticleById(data: string): Observable<IApiRes<IKnowledgeBaseArticle[]>> {
    return this.http.get<IApiRes<IKnowledgeBaseArticle[]>>(
      `${this.ROOT_URL}/publish-article/edit-publish-article/${data}`
    );
  }

  postArticle(data: IKnowledgeBaseArticle): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/create-publish-article/`,
      data
    );
  }

  updateArticle(
    data: IKnowledgeBaseArticle,
    id: string | null
  ): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/update-publish-article/${id}`,
      data
    );
  }

  deleteArticleById(data: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/delete-article/${data}`
    );
  }

  //Groups

  getGroups(): Observable<IApiRes<IGroups[]>> {
    return this.http.get<IApiRes<IGroups[]>>(
      `${this.ROOT_URL}/publish-article/get-article-group/`
    );
  }

  getGroupById(id: string): Observable<IApiRes<IGroups[]>> {
    return this.http.get<IApiRes<IGroups[]>>(
      `${this.ROOT_URL}/publish-article/edit-article-group/${id}`
    );
  }

  postGroup(data: IGroups): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/article-group/`,
      data
    );
  }

  updateGroup(data: IGroups, id: string): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/update-article-group/${id}`,
      data
    );
  }

  updateStatus(
    status: { status: string },
    id: string
  ): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/update-status-group/${id}`,
      status
    );
  }

  deleteGroupById(data: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/publish-article/delete-article-group/${data}`
    );
  }

  navigateByUrl(url: string) {
    this.router.navigateByUrl(url);
  }
}
