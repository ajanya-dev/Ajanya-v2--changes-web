import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, take } from 'rxjs/operators';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  BankModalService,
  LEGAL_NAME_EDIT_MODAL
} from 'src/app/shared/bank-modal/service/bank-modal.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayeeHeaderV4Component } from '../../v4-components/payee-header-v4/payee-header-v4.component';
import { PayeeDataTableV4Component } from '../../v4-components/payee-data-table-v4/payee-data-table-v4.component';
import { PayeeDetailsV4Component } from '../../v4-components/payee-details-v4/payee-details-v4.component';
import { PayeeV4StateService } from '../../v4-components/payee-v4-state.service';

@Component({
  selector: 'app-payee-ocw-v4',
  templateUrl: './payee-ocw-v4.component.html',
  styleUrls: ['./payee-ocw-v4.component.scss'],
  standalone: true,
  imports: [
    PayeeHeaderV4Component,
    PayeeDataTableV4Component,
    PayeeDetailsV4Component
  ]
})
export class PayeeOcwV4Component implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private bankModalService = inject(BankModalService);
  private headerService = inject(HeaderService);
  payeeV4State = inject(PayeeV4StateService);

  private bankEditOpened = false;

  ngOnInit() {
    // This is a dedicated single-type page (no tabs), so the add-payee modal
    // should only allow adding the current page type (e.g. Customers only).
    this.payeeV4State.lockPayeeType.set(true);
    this.activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const type = params.type || 'vendor';
        this.payeeV4State.pageType.set(type);
        this.handleLegalNameEditRedirect(params);
      });
  }

  private handleLegalNameEditRedirect(params: Params): void {
    if (params['payee-bank-edit'] === undefined || this.bankEditOpened) {
      return;
    }
    const bankId = params.payeebank_account_id;
    const payeeId = params.payee_id;
    if (!bankId || !payeeId) {
      return;
    }
    this.bankEditOpened = true;
    this.queueLegalNameEditModal(payeeId, bankId);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        'payee-bank-edit': null,
        payeebank_account_id: null,
        payee_id: null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private queueLegalNameEditModal(payeeId: string, bankId: string): void {
    this.headerService.enqueueModal(LEGAL_NAME_EDIT_MODAL, true);
    this.headerService.modalQueue$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((queue) => {
        if (
          !queue.length ||
          queue[0].modal !== LEGAL_NAME_EDIT_MODAL ||
          queue[0].wasOpened
        ) {
          return;
        }
        this.headerService.updateModalStatus();
        this.bankModalService
          .openAddBankNormalModalV4({
            payeeId,
            bankId,
            edit: true,
            legalNameEdit: true
          })
          .pipe(take(1), takeUntilDestroyed(this.destroyRef))
          .subscribe((dialogRef) => {
            if (!dialogRef) {
              this.headerService.dequeueModal();
              return;
            }
            dialogRef
              .afterClosed()
              .pipe(take(1))
              .subscribe(() => this.headerService.dequeueModal());
          });
      });
  }

  ngOnDestroy() {
    this.payeeV4State.lockPayeeType.set(false);
  }
}
