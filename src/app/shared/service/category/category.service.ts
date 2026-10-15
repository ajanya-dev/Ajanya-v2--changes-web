import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import {
  ICategoryDetails,
  ICategoryDropdown
} from 'src/app/modules/category/model/category';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getCategory(page: number): Observable<IApiRes<ICategoryDropdown[]>> {
    return this.http.get<IApiRes<ICategoryDropdown[]>>(
      `${this.ROOT_URL}/categories?page=${page}`
    );
  }

  categorySearch(
    term: string,
    page?: number,
    headerOptions?: HttpHeaders
  ): Observable<IApiRes<ICategoryDropdown[]>> {
    let params = new HttpParams();
    if (page) {
      params = params.append('page', page);
    }
    if (term) {
      params = params.append('term', term);
    }
    return this.http.get<IApiRes<ICategoryDropdown[]>>(
      `${this.ROOT_URL}/categories/suggest`,
      { params, headers: headerOptions }
    );
  }

  postCategory(
    categoryData: ICategoryDetails
  ): Observable<IApiRes<{ id: string }>> {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/categories`,
      categoryData
    );
  }

  deleteCategory(categoryId: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/categories/${categoryId}`
    );
  }

  deleteMulitipleCategories(categoryIds: {
    ids: string[];
  }): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/categories/`, {
      body: categoryIds
    });
  }

  updateCategory(
    categoryId: string | number,
    categoryData: ICategoryDetails
  ): Observable<IApiRes<{ id: string }>> {
    return this.http.put<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/categories/${categoryId}`,
      categoryData
    );
  }

  categoryById(categoryId: string): Observable<IApiRes<ICategoryDetails>> {
    return this.http.get<IApiRes<ICategoryDetails>>(
      `${this.ROOT_URL}/categories/${categoryId}`
    );
  }

  /**
   * Retrieves multiple categories by their IDs using an HTTP POST request.
   * @param ids - An array of category IDs to retrieve.
   * @returns An observable of the API response containing category data.
   */
  getCategoryByIds(ids: string[]): Observable<IApiRes<ICategoryDropdown[]>> {
    return this.http.post<IApiRes<ICategoryDropdown[]>>(
      `${this.ROOT_URL}/categories/get-multiple`,
      { ids }
    );
  }
}
