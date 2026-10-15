import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PayeeHeaderV4Component } from '../../v4-components/payee-header-v4/payee-header-v4.component';
import { PayeeDataTableV4Component } from '../../v4-components/payee-data-table-v4/payee-data-table-v4.component';
import { PayeeDetailsV4Component } from '../../v4-components/payee-details-v4/payee-details-v4.component';
import {
  PayeePageType,
  PayeeV4StateService
} from '../../v4-components/payee-v4-state.service';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';

@Component({
  selector: 'app-payee-list-v4',
  templateUrl: './payee-list-v4.component.html',
  styleUrls: ['./payee-list-v4.component.scss'],
  standalone: true,
  imports: [
    PayeeHeaderV4Component,
    PayeeDataTableV4Component,
    PayeeDetailsV4Component,
    CommonTabV4Component
  ]
})
export class PayeeListV4Component implements OnInit, OnDestroy {
  private payeeV4State = inject(PayeeV4StateService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly tabs: ITabItem[] = [
    { label: 'All', value: 'payee' },
    { label: 'Vendors', value: 'vendor' },
    { label: 'Employees', value: 'employee' },
    { label: 'Customers', value: 'customer' }
  ];

  private readonly validTypes: ReadonlyArray<PayeePageType> = [
    'payee',
    'vendor',
    'employee',
    'customer'
  ];

  activeTab = signal<PayeePageType>('payee');

  ngOnInit() {
    this.payeeV4State.lockTitleToPayees.set(true);
    // `manage/payee/:id` (e.g. "Open payee" from a payment panel) filters the
    // list down to that payee.
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) =>
        this.payeeV4State.routePayeeId.set(params.get('id'))
      );
    this.activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const type = params['type'] as PayeePageType;
        const next = this.validTypes.includes(type) ? type : 'payee';
        this.activeTab.set(next);
        this.payeeV4State.pageType.set(next);
      });
  }

  onTabChange(value: string) {
    const next = value as PayeePageType;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { type: next === 'payee' ? null : next },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  ngOnDestroy() {
    this.payeeV4State.lockTitleToPayees.set(false);
    this.payeeV4State.routePayeeId.set(null);
  }
}
