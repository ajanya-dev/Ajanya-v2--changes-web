import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { UserService } from 'src/app/shared/service/user/user.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DropDownBankMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IBankDropdown } from 'src/app/models/bank';
import { NgClass } from '@angular/common';
import { IUserAdvancedSettings } from '../../../model/user';

/**
 * @description Component for advanced settings in application settings.
 */
@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  standalone: true,
  imports: [DropDownBankMultiSelectComponent, CommonButtonV35Component,NgClass]
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  public userService = inject(UserService);
  public alertService = inject(AlertService);
  private headerService = inject(HeaderService);

  adVanceSettings = input<IUserAdvancedSettings[]>([]);
  @Output() refresh = new EventEmitter();

  destroy$ = new Subject<boolean>();
  showBanksList = signal<boolean>(false);
  selectedBankIds: string[] = [];
  loading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const bankAccounts = this.adVanceSettings().find(item => Number(item.en_id) === 12)?.bank_accounts ?? [];
      this.selectedBankIds = bankAccounts;
    });
  }

  ngOnInit(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData.pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      if(res && res.enabledPlugins.includes('qb-auto-sub-account-mapping')){
        this.showBanksList.set(true);
      }
    });
  }

  getBankAccounts() {
    return this.adVanceSettings().find(item => Number(item.en_id) === 12)?.bank_accounts ?? [];
  }


  /**
   * @description Method to change the status value of the selected setting based on checked or unchecked status.
   * @param val - status of the setting
   */
  onChange(id: string, val: number | string) {
    const newStatus = val === 1 || val === '1' ? 0 : 1;
    this.updateAdvSettings(id, newStatus, undefined, this.showBanksList() && id === '5' && newStatus === 1);
    /* If the banks list is shown and the setting is disabled and the status is changed to disabled, then disable the bank accounts */
    if(this.showBanksList() && id === '5' && newStatus === 0) {
      this.updateAdvSettings('12', 0, [],true);
    }
  }

  /**
   * @description Handles bank selection from dropdown
   * @param banks - selected banks
   */
  onBankSelection(banks: IBankDropdown[]) {
    const bankIds = banks.map(bank => bank.id);
    this.selectedBankIds = bankIds;
  }

  /**
   * @description Apply setting with selected banks
   */
  applyWithBanks() {
    if(this.selectedBankIds.length === 0) {
      this.alertService.failedAlert({
        content: 'Please select at least one bank account'
      });
      return;
    }
    this.updateAdvSettings('12', 1, this.selectedBankIds);
  }

  /**
   * @description Update advanced settings based on selection and emits 'refresh' event
   * @param id - id of the setting
   * @param status - status of setting
   * @param bankAccounts - optional array of bank account IDs
   */
  updateAdvSettings(id: string, status: number, bankAccounts?: string[], isSkipSuccessAlert = false) {
    const payload: { status_id: string; status: number; bank_accounts?: string[] } = {
      status_id: id,
      status
    };

    if (bankAccounts?.length) {
      payload.bank_accounts = bankAccounts;
    }

    this.loading.set(true);
    this.userService
      .uploadAdavanceStatus(payload)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.refresh.emit('changed1');

        // Skip success alert 
        if (isSkipSuccessAlert) return;

        this.alertService.successAlert({
          content: res.message ?? 'Successfully Updated'
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
