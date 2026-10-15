import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { IBankDataRes } from 'src/app/modules/bank/bank-v3/model/bank-v35';

interface ISearch {
  searchString: string;
  colId: string;
}
@Injectable({
  providedIn: 'root'
})
export class BankDataService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  public accounts: any = {};
  public categories = new BehaviorSubject<any>(null);
  public categoriesKeyVal: any = {};

  private searchEvent = new BehaviorSubject<ISearch>({
    searchString: '',
    colId: ''
  });
  searchEvent$ = this.searchEvent.asObservable();

  private clearSearch = new BehaviorSubject<string>('');
  clearSearch$ = this.clearSearch.asObservable();

  emitSearch(data: ISearch): any {
    this.searchEvent.next(data);
  }

  emitClearSearch(colId: string): any {
    this.clearSearch.next(colId);
  }

  setCategory(value: any): any {
    this.categories.next(value);
  }

  getCategoriesValue(): any {
    return this.categories.value;
  }

  getIndex(isDisable: boolean = false) {
    let headerOptions = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (isDisable) {
      headerOptions = headerOptions.set('isDisable422', 'true');
    }
    return this.http.get<IApiRes<IBankDataRes>>(`${this.ROOT_URL}/bank-data`, {
      headers: headerOptions
    });
  }

  getAccountData(id: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/bank-data/bank/${id}`);
  }

  updateProvider(body: { id: string; name: string }): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/bank-data/provider`, body);
  }

  deleteProvider(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/bank-data/provider`, {
      body: { id }
    });
  }

  updateBank(body: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/bank-data/bank`, body);
  }

  deleteBank(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/bank-data/bank`, {
      body: { id }
    });
  }

  activateAccount(id: string): Observable<any> {
    const body = new FormData();
    body.append('id', id);
    return this.http.post(`${this.ROOT_URL}/bank-data/activate`, body);
  }

  deActivateAccount(id: string): Observable<any> {
    const body = new FormData();
    body.append('id', id);
    return this.http.post(`${this.ROOT_URL}/bank-data/deactivate`, body);
  }

  addCompany(name: string): Observable<any> {
    const body = new FormData();
    body.append('name', name);
    return this.http.post(`${this.ROOT_URL}/bank-data/company`, body);
  }

  updateCompany(body: any): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/bank-data/company`, body);
  }

  deleteCompany(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/bank-data/company`, {
      body: { id }
    });
  }

  getCompany(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/bank-data/company`);
  }

  /** Companies as a `{ id, name }[]` list (maps the `{ [id]: name }` response). */
  getCompanyList(): Observable<{ id: string; name: string }[]> {
    return this.getCompany().pipe(
      map((res: { data?: { companies?: Record<string, string> } }) => {
        const obj = res?.data?.companies ?? {};
        return Object.entries(obj).map(([id, name]) => ({ id, name }));
      })
    );
  }

  createCategory(body: { name: string; parent?: string }): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/bank-data/categories`, body);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/bank-data/categories`);
  }

  updateCategory(body: {
    id: string;
    name: string;
    yd_category_id?: number;
  }): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/bank-data/categories`, body);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/bank-data/categories`, {
      body: { id }
    });
  }

  getMyRules(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/bank-data/rules`);
  }

  addRule(data: any): Observable<any> {
    const body = new FormData();
    body.append('name', data);
    return this.http.post(`${this.ROOT_URL}/bank-data/rules`, body);
  }

  reapplyRules(): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/bank-data/reapply-all-rules/`, {});
  }

  deleteRule(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/bank-data/rules`, {
      body: { id }
    });
  }

  getTransactionTotal(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/bank-data/transactions-total`,
      body
    );
  }

  syncPlaidTransactions(body: {bankId:string,accountIds:string[]}){
    return this.http.post<{success: boolean, message: string,errorMsg:string,errorCode:string}>(`${this.ROOT_URL}/bank-accounts/sync-transaction`, body);
  }
}
