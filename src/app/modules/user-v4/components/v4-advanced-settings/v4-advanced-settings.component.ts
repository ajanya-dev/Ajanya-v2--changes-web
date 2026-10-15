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
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-multi-select-dropdown-v4/bank-multi-select-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Save, Loader } from 'lucide-angular';
import { IUserAdvancedSettings } from '../../../user/model/user';

@Component({
  selector: 'app-v4-advanced-settings',
  templateUrl: './v4-advanced-settings.component.html',
  styleUrls: ['./v4-advanced-settings.component.scss'],
  standalone: true,
  imports: [
    BankMultiSelectDropdownV4Component,
    CommonButtonV4Component,
    NgClass,
    LucideAngularModule
  ]
})
export class V4AdvancedSettingsComponent implements OnInit, OnDestroy {
  public userService = inject(UserService);
  public alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);

  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;

  adVanceSettings = input<IUserAdvancedSettings[]>([]);
  @Output() refresh = new EventEmitter();

  destroy$ = new Subject<boolean>();
  showBanksList = signal<boolean>(false);
  selectedBankIds: string[] = [];
  loading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const bankAccounts =
        this.adVanceSettings().find((item) => Number(item.en_id) === 12)
          ?.bank_accounts ?? [];
      this.selectedBankIds = bankAccounts;
    });
  }

  ngOnInit(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
          this.showBanksList.set(true);
        }
      });
  }

  getBankAccounts() {
    return (
      this.adVanceSettings().find((item) => Number(item.en_id) === 12)
        ?.bank_accounts ?? []
    );
  }

  onChange(id: string, val: number | string) {
    const newStatus = val === 1 || val === '1' ? 0 : 1;
    this.updateAdvSettings(
      id,
      newStatus,
      undefined,
      this.showBanksList() && id === '5' && newStatus === 1
    );
    if (this.showBanksList() && id === '5' && newStatus === 0) {
      this.updateAdvSettings('12', 0, [], true);
    }
  }

  onBankSelection(banks: IBankDropdown[]) {
    const bankIds = banks.map((bank) => bank.id);
    this.selectedBankIds = bankIds;
  }

  applyWithBanks() {
    if (this.selectedBankIds.length === 0) {
      this.alertService.failedAlert({
        content: 'Please select at least one bank account'
      });
      return;
    }
    this.updateAdvSettings('12', 1, this.selectedBankIds);
  }

  updateAdvSettings(
    id: string,
    status: number,
    bankAccounts?: string[],
    isSkipSuccessAlert = false
  ) {
    const payload: {
      status_id: string;
      status: number;
      bank_accounts?: string[];
    } = {
      status_id: id,
      status
    };

    if (bankAccounts?.length) {
      payload.bank_accounts = bankAccounts;
    }

    this.loading.set(true);
    this.userService
      .uploadAdavanceStatus(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        this.refresh.emit('changed1');

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
