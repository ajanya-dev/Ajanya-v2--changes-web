import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  Injector,
  effect
} from '@angular/core';
import {
  faBank,
  faCaretDown,
  faCaretUp
} from '@fortawesome/pro-solid-svg-icons';
import { Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { ICloudBankAccountDetailsAirwallex } from '../../../model/cloudbank';
import { ExistingBusinessComponent } from '../../../cloud-bank-v2/modals/existing-business/existing-business.component';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { SearchFilterPipe } from '../../../../../pipes/search-filter.pipe';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { CloudAccountDropdownV35Component } from '../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { MaintenanceAlertModalComponent } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal.component';
import { maintenanceMessages } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-data';

@Component({
  selector: 'app-cloud-bank-list-v35',
  templateUrl: './cloud-bank-list-v35.component.html',
  styleUrls: ['./cloud-bank-list-v35.component.scss'],
  standalone: true,
  imports: [
    CloudAccountDropdownV35Component,
    ListHeaderV35Component,
    MatTooltip,
    FaIconComponent,
    NgClass,
    CommonListSkeltonComponent,
    TitleCasePipe,
    TruncatePipe,
    SearchFilterPipe
  ]
})
export class CloudBankListV35Component implements OnInit, OnDestroy {
  /**
   * @description Injecting dependencies using inject method
   */
  private matDialog = inject(MatDialog);
  public cloudListV35Service = inject(CloudListV35Service);
  private injector = inject(Injector);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);

  /**
   * @description Variables
   */
  showBanks: boolean[] = [];
  searchInput = '';
  faBank = faBank;
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  destroy$ = new Subject<boolean>();
  subscriptions: Subscription[] = [];
  resize = false;

  ngOnInit(): void {
    this.cloudListV35Service.getBankAccountData();
    this.getAirwallexAccounts();
    this.checkResize();
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  /**
   * @description Get the airwallex accounts.
   */
  getAirwallexAccounts() {
    effect(
      () => {
        const accountsCount =
          this.cloudListV35Service.airWallexAccountsSignal().length;
        if (accountsCount) {
          this.showBanks.length = accountsCount;
          this.showBanks.fill(true);
        }
      },
      { injector: this.injector }
    );
  }

  /**
   * @description Select cloud bank account
   * @param account Selected account
   */
  selectAccount(account: ICloudBankAccountDetailsAirwallex) {
    this.cloudListV35Service.selectAccount(account);
  }

  /**
   * @description expand the list view of accounts in the list
   * @param index - index of account to expand
   */
  openAccountList(index: number): void {
    this.showBanks[index] = !this.showBanks[index];
  }

  /**
   * @description to create a new cloud bank account
   */
  openBusinessDetailModal(): void {
    this.openMaintainenceModal();
    return;
    const dialogRef = this.matDialog.open<
      ExistingBusinessComponent,
      { source: CVSourceType }
    >(ExistingBusinessComponent, {
      maxWidth: '440px',
      width: '95%',
      disableClose: true,
      autoFocus: false,
      data: { source: CVSourceType.cloud_bank }
    });

    dialogRef.afterClosed().subscribe((val) => {
      if (val?.success) {
        this.cloudListV35Service.getBankAccountData('create');
      }
    });
  }

  openMaintainenceModal(): void {
    this.matDialog.open(MaintenanceAlertModalComponent, {
      panelClass: 'plaid-modal',
      width: 'fit-content',
      data: {
        content: maintenanceMessages.maintenanceAlertCloud
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
