import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import {
  IConnectBank,
  ISelectAccountData,
  ISelectYodleeAccount
} from 'src/app/models/yodlee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialogClose } from '@angular/material/dialog';
import { NgIf, NgFor, NgClass, SlicePipe } from '@angular/common';

/**
 * @description Modal component to select banks.
 */
@Component({
  selector: 'app-select-accounts',
  templateUrl: './select-accounts.component.html',
  styleUrls: ['./select-accounts.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogClose, NgFor, NgClass, SlicePipe]
})
export class SelectAccountsComponent implements OnInit, OnDestroy {
  @Input() data: ISelectYodleeAccount | ISelectAccountData[];
  @Input() commonData: IConnectBank;
  @Output() next = new EventEmitter<ISelectAccountData[]>();
  @Output() prev = new EventEmitter<boolean>();
  appConfig: IAppConfig | null;
  accountsArray: ISelectAccountData[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private _alertService: AlertService,
    private _appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    if (
      this.commonData.dialogueInitializationData?.mode == 'connect_new_bank'
    ) {
      if ((this.data as ISelectYodleeAccount)?.bankAccounts?.length > 0) {
        this.accountsArray = (this.data as ISelectYodleeAccount).bankAccounts;
        this.commonData.dialogueInitializationData.key = (
          this.data as ISelectYodleeAccount
        ).key;
      } else {
        this._alertService.infoAlert({
          content: 'All your accounts in this bank is linked'
        });
        this.prev.emit();
      }
    } else if (
      this.commonData.dialogueInitializationData?.mode ==
      'connect_old_bank_accounts'
    ) {
      this.accountsArray = this.data as ISelectAccountData[];
    }

    this.accountsArray.forEach((account: ISelectAccountData) => {
      account.isChecked = account.isChecked ? account.isChecked : false;
    });

    this.subscriptions.push(
      this._appSettingService.appConfig$.subscribe((res) => {
        this.appConfig = res;
      })
    );
  }

  /**
   * @description Method invoked when bank account is selected. Sets `isChecked` property of selected account to true and all others to false.
   * @param item - selected account.
   */
  check(item: ISelectAccountData, event: Event) {
    if (event.target === null) return;
    item.isChecked = (event.target as HTMLInputElement).checked;
    if (this.commonData?.singleSelection && item.isChecked) {
      this.accountsArray.forEach((account) => {
        if (item !== account) {
          account.isChecked = false;
        }
      });
    }
  }

  /**
   * @description Emits `next` event with selected accounts.
   */
  nextPage() {
    const selectedAccounts = this.accountsArray.filter(
      (item: ISelectAccountData) => {
        return item.isChecked;
      }
    );
    if (selectedAccounts && selectedAccounts.length > 0) {
      this.next.emit([...selectedAccounts]);
    } else {
      this._alertService.warningAlert({
        content: 'Please select a bank account'
      });
    }
  }

  /**
   * @description Emits `prev` event.
   */
  previousPage() {
    this.prev.emit(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
