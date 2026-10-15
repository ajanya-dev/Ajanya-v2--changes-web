import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  Type,
  inject,
  input
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { BankAccountsDetailsOcwV35Component } from 'src/app/modules/bank/bank-v3/v35-components/bank-accounts-details-ocw-v35/bank-accounts-details-ocw-v35.component';
import { BankAccountsListOcwV35Component } from 'src/app/modules/bank/bank-v3/v35-components/bank-accounts-list-ocw-v35/bank-accounts-list-ocw-v35.component';
import { CardsDetailsOcwV35Component } from 'src/app/modules/cards/components/v35/cards-details-ocw-v35/cards-details-ocw-v35.component';
import { CardsListOcwV35Component } from 'src/app/modules/cards/components/v35/cards-list-ocw-v35/cards-list-ocw-v35.component';
import { CloudBankDetailsV35Component } from 'src/app/modules/cloud-bank/cloud-bank-v3/components-v35/cloud-bank-details-v35/cloud-bank-details-v35.component';
import { CloudBankListV35Component } from 'src/app/modules/cloud-bank/cloud-bank-v3/components-v35/cloud-bank-list-v35/cloud-bank-list-v35.component';
import { PayeeDetailsOcwV35Component } from 'src/app/modules/payee/payee-v3/v35-components/payee-details-ocw-v35/payee-details-ocw-v35.component';
import { PayeeListOcwV35Component } from 'src/app/modules/payee/payee-v3/v35-components/payee-list-ocw-v35/payee-list-ocw-v35.component';
import { PayrollDetailsV35Component } from 'src/app/modules/payroll-by-card/components-v35/payroll-details-v35/payroll-details-v35.component';
import { PayrollListV35Component } from 'src/app/modules/payroll-by-card/components-v35/payroll-list-v35/payroll-list-v35.component';
import { UserManagementListV35Component } from 'src/app/modules/user-management/components/user-management-list-v35/user-management-list-v35.component';
import { UsersActivityComponent } from 'src/app/modules/user-management/components/users-activity/users-activity.component';
import { WalletDetailsV35Component } from 'src/app/modules/wallet/wallet-v3/components-V35/wallet-details-v35/wallet-details-v35.component';
import { WalletListV35Component } from 'src/app/modules/wallet/wallet-v3/components-V35/wallet-list-v35/wallet-list-v35.component';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatTooltip],
  selector: 'app-common-layout-v35',
  templateUrl: './common-layout-v35.component.html',
  styleUrls: ['./common-layout-v35.component.scss']
})
export class CommonLayoutV35Component implements OnDestroy {
  @Input({ required: true }) listComponent: Type<
    | WalletListV35Component
    | BankAccountsListOcwV35Component
    | CardsListOcwV35Component
    | CloudBankListV35Component
    | PayeeListOcwV35Component
    | PayrollListV35Component
    | UserManagementListV35Component
  >;

  @Input({ required: true }) detailsComponent: Type<
    | BankAccountsDetailsOcwV35Component
    | WalletDetailsV35Component
    | CardsDetailsOcwV35Component
    | CloudBankDetailsV35Component
    | PayeeDetailsOcwV35Component
    | PayrollDetailsV35Component
    | UsersActivityComponent
  >;

  @Input() showToggle = false;

  private commonLayoutToggleService = inject(CommonLayoutToggleService);

  listInputs = input<Record<string, unknown>>();
  detailsInputs = input<Record<string, unknown>>();
  isNarrow: boolean = false;
  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;

  @Input() isLoading = false;
  @Input() isGridView = true;

  toggle(): void {
    this.isNarrow = !this.isNarrow;
    this.commonLayoutToggleService.toggle.set(this.isNarrow);
  }

  ngOnDestroy(): void {
    this.commonLayoutToggleService.toggle.set(false);
  }
}
