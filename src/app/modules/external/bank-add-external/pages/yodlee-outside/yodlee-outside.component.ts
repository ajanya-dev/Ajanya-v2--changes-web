import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { IWindowMessageModel } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgClass, NgIf } from '@angular/common';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { NewBankAccountOptomizedModelComponent } from '../../../../../shared/yodlee/components/new-bank-account-optomized-model/new-bank-account-optomized-model.component';
import { YodleeParentModalComponent } from '../../../../../shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { ChooseBankOptionModalComponent } from '../../../../../shared/yodlee/components/choose-bank-option-modal/choose-bank-option-modal.component';
import { CreateBankOptionsModalComponent } from '../../../../bank/bank-v2/modals/create-bank-options-modal/create-bank-options-modal.component';

interface ICreateBankOptionSelectionEvent {
  isAddManually?: boolean;
  isAddInstantly?: boolean;
  data: { mode?: string } & IApiRes<IUnlinkedAccountsRes>;
}
interface IUnlinkedAccountsRes {
  unlinkedAccounts: number;
  bankData: unknown;
  key: string;
}
@Component({
  selector: 'app-yodlee-outside',
  templateUrl: './yodlee-outside.component.html',
  styleUrls: ['./yodlee-outside.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    CreateBankOptionsModalComponent,
    ChooseBankOptionModalComponent,
    YodleeParentModalComponent,
    NewBankAccountOptomizedModelComponent
  ]
})
export class YodleeOutsideComponent {
  subscriptions: Subscription[] = [];
  accountsData: IApiRes<IUnlinkedAccountsRes>;
  yodleeModalData: { mode?: string };
  yodleeConfig = { singleSelection: true };
  showPage: 'createOptions' | 'yodleeOptions' | 'yodlee' | 'manual-add' =
    'createOptions';

  loading: boolean;

  constructor(
    private route: ActivatedRoute,
    private _authService: AuthService,
    private _localStorageService: LocalStorageService,
    private _alertService: AlertService,
    private _authDataService: AuthDataService
  ) {
    this.authenticateUsingCustomToken();
  }

  authenticateUsingCustomToken(): void {
    this.loading = true;
    const customToken = this.route?.snapshot?.queryParams.customToken;
    if (customToken) {
      this.subscriptions.push(
        this._authService
          .verifyToken(customToken)
          .pipe(
            catchError((e) => {
              this._localStorageService.clearLocalStorage();
              this._alertService.failedAlert({
                content: e.error.errorMsg,
                close: true,
                isOk: false
              });
              // message for whitelabel iframe component for adding bank goto outside-bankverify
              const windowMessage = {
                eventType: 'error',
                data: {
                  message: 'authentication failed',
                  more: {}
                }
              };
              parent.postMessage(JSON.stringify(windowMessage), '*');
              return of(false);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.loading = false;
              /** If its from deep link, we should directly redirect to return URL. So company id and name set from here itself */
              if (this._localStorageService.getItem('isDeeplink')) {
                this.setStorage(
                  'activeCompanyName',
                  res.companyInfo.companyName
                );
                this.setStorage('activeCompanyId', res.companyInfo.companyId);
                this.setStorage('activeCompanyType', 'owncmp');
              }

              this._authDataService.afterLogin(
                res,
                '/external/bank-ac-add',
                '/external/bank-ac-add'
              );
            }
          })
      );
    }
  }

  setStorage(key: LocalStorageKeys, value: string) {
    this._localStorageService.setItem(key, value);
  }

  onCreateOptionSelected(event: ICreateBankOptionSelectionEvent) {
    if (event.isAddInstantly) {
      const windowMessage = {
        eventType: 'message',
        data: {
          message: 'add_instantly',
          more: {}
        }
      };
      parent.postMessage(JSON.stringify(windowMessage), '*');
      if (event.data?.mode) {
        this.yodleeModalData = event.data;
        this.showPage = 'yodlee';
      } else {
        this.accountsData = event.data;
        this.showPage = 'yodleeOptions';
      }
    } else {
      const windowMessage = {
        eventType: 'message',
        data: {
          message: 'add_manualy',
          more: {}
        }
      };
      parent.postMessage(JSON.stringify(windowMessage), '*');
      this.showPage = 'manual-add';
    }
  }

  onYodleeOptionSelected(data: { mode?: string }) {
    this.yodleeModalData = data;
    const windowMessage: IWindowMessageModel = {
      eventType: 'message',
      data: {
        message: data?.mode ?? '',
        more: {}
      }
    };
    parent.postMessage(JSON.stringify(windowMessage), '*');
    this.showPage = 'yodlee';
  }

  postEvents(event: ISelectedStep) {
    let windowMessage: IWindowMessageModel | undefined;
    if (event?.id === 4) {
      windowMessage = {
        eventType: 'success',
        data: {
          message: 'success_instantly',
          more: { data: event.data }
        }
      };
    } else if (event?.id === 0 && event?.label === 'error') {
      windowMessage = {
        eventType: 'error',
        data: {
          message: 'something went wrong',
          more: {}
        }
      };
    } else {
      windowMessage = {
        eventType: 'message',
        data: {
          message: 'step_changed',
          more: { step: event.label }
        }
      };
    }
    parent.postMessage(JSON.stringify(windowMessage), '*');
  }

  onSuccessManually(event: INewBankDetails) {
    const windowMessage = {
      eventType: 'success',
      data: {
        message: 'success_manually',
        more: { data: event }
      }
    };
    parent.postMessage(JSON.stringify(windowMessage), '*');
  }
}

interface ISelectedStep {
  id: number;
  label: string;
  isEnabled: boolean;
  data: unknown;
}
interface INewBankDetails {
  success: boolean;
  id: string;
  check_no: string;
  bankAcData: unknown;
}
