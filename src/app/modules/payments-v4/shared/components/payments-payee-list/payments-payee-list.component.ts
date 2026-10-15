import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, debounceTime, map, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Search,
  UserRoundPlus,
  Mail,
  X,
  CircleUserRound,
  UserIcon,
  Pencil,
  History
} from 'lucide-angular';

import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  selectFilteredPayees,
  selectIsPayeesByIdLoading,
  selectIsPayeesFilterOn,
  selectIsPayeesLoading,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AddPayeeModalV4Component, IPayeeSaveUpdateResult } from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import { SendPaymentStateService } from 'src/app/modules/payments-v4/send-payment/services/send-payment-state.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { TransactionHistoryModalV4Component } from '../../modals/transaction-history-modal-v4/transaction-history-modal-v4.component';

@Component({
  selector: 'app-payments-payee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollToEndDirective,
    LucideAngularModule,
    MatTooltipModule,
    AddPayeeModalV4Component
  ],
  templateUrl: './payments-payee-list.component.html',
  styleUrl: './payments-payee-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsPayeeListComponent implements OnInit {
  private store = inject(Store);
  private payeeDataService = inject(PayeeDataV35Service);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);
  private stateService = inject(SendPaymentStateService, { optional: true });
  private elRef = inject(ElementRef);
  private dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  public paymentsService = inject(PaymentsService);

  payeeId = input<string | null>(null);
  hidePayeeSummary = input<boolean>(false);
  payeeSelected = output<IPayeeDropdown | null>();

  payees$: Observable<IPayeeDropdown[]> = this.store.select(selectPayees);

  displayedPayees$: Observable<IPayeeDropdown[]> = this.payees$.pipe(
    map((payees) =>
      [...payees]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 3)
    )
  );

  filteredPayees$: Observable<IPayeeDropdown[]> =
    this.store.select(selectFilteredPayees);

  isFilterOn$: Observable<boolean> = this.store.select(selectIsPayeesFilterOn);
  isLoading$: Observable<boolean> = this.store.select(selectIsPayeesLoading);

  selectedPayee = signal<IPayeeDropdown | null>(null);
  showAddPayeeForm = signal(false);
  searchTerm = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(
      () => {
        const editedPayee = this.payeeDataService.editedPayeeSignal();
        const currentId = untracked(() => this.selectedPayee()?.id);
        if (editedPayee && currentId === editedPayee.id) {
          this.selectedPayee.set(editedPayee);
          // Propagate to parent (modal) so the details panel updates
          this.payeeSelected.emit(editedPayee);
        }
      },
      { allowSignalWrites: true }
    );

    // Watch for edit trigger from the right panel (payee-details-panel)
    if (this.stateService) {
      effect(
        () => {
          const trigger = this.stateService!.triggerPayeeEdit();
          if (trigger > 0) {
            untracked(() => this.onEditPayee());
          }
        },
        { allowSignalWrites: true }
      );

      // Sync local selection with state when payee is cleared externally
      // (e.g. by the action-time freeze block on Confirm/Save).
      effect(
        () => {
          const statePayee = this.stateService!.selectedPayee();
          const localId = untracked(() => this.selectedPayee()?.id);
          if ((statePayee?.id ?? null) !== (localId ?? null)) {
            this.selectedPayee.set(statePayee);
            this.payeeDataService.payeeDataSignal.set(statePayee ?? undefined);
            // On external clear, reset the search input and refetch unfiltered.
            if (!statePayee) {
              this.searchTerm = '';
              this.store.dispatch(
                payeesActions.loadPayees({
                  searchTerm: '',
                  skipEmpty: true,
                  disablePermission: true
                })
              );
            }
          }
        },
        { allowSignalWrites: true }
      );
    }
  }

  showEditPayeeForm = signal(false);
  editPayeeConfig = signal<{ edit: boolean; id: string } | null>(null);

  // Lucide icons
  readonly SearchIcon = Search;
  readonly UserRoundPlusIcon = UserRoundPlus;
  readonly MailIcon = Mail;
  readonly XIcon = X;
  readonly PencilIcon = Pencil;
  readonly HistoryIcon = History;
  readonly CircleUserRoundIcon = CircleUserRound;
  readonly userIcon = UserIcon;

  ngOnInit(): void {
    this.store.dispatch(
      payeesActions.loadPayees({ searchTerm: '', skipEmpty: true, disablePermission:true})
    );

    if (this.payeeId()) {
      this.setPayeeById(this.payeeId());
    }
  }

  /**
   * Sets a payee by ID. First searches the existing store list,
   * if not found dispatches loadPayeesByIds to fetch from API.
   */
  setPayeeById(id: string | null): void {
    if (!id) return;

    combineLatest([this.payees$, this.filteredPayees$])
      .pipe(debounceTime(100), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(([payees]) => {
        const item = payees.find((p) => p.id === id);
        if (item) {
          this.selectPayee(item);
        } else {
          this.loadItemsById(id);
        }
      });
  }

  /**
   * Loads a payee by ID from the API when it's not in the current store.
   */
  private loadItemsById(id: string): void {
    this.store.dispatch(payeesActions.loadPayeesByIds({ ids: [id] }));

    combineLatest([this.payees$, this.store.select(selectIsPayeesByIdLoading)])
      .pipe(debounceTime(100), take(2), takeUntilDestroyed(this.destroyRef))
      .subscribe(([payees, isLoading]) => {
        if (!isLoading) {
          const item = payees.find((p) => p.id === id);
          if (item) {
            this.selectPayee(item);
          }
        }
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    const term = this.searchTerm.replace(/&/g, '%26');
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        payeesActions.loadPayees({ searchTerm: term, skipEmpty: true, disablePermission:true })
      );
    }, 600);
  }

  onScrollToEnd(): void {
    this.store.dispatch(payeesActions.loadMorePayees({ skipEmpty: true }));
  }

  selectPayee(payee: IPayeeDropdown): void {
    if (payee.name === 'Payee Name') {
      this.alertService.infoAlert({
        content: 'Please select a valid payee'
      });
      return;
    }
    this.selectedPayee.set(payee);
    this.payeeDataService.payeeDataSignal.set(payee);
    this.payeeSelected.emit(payee);
  }

  removeSelectedPayee(): void {
    this.selectedPayee.set(null);
    this.payeeDataService.payeeDataSignal.set(undefined);
    this.payeeSelected.emit(null);
  }

  addNewPayee(): void {
    this.payeeService
      .checkPermissionToCreatePayee()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res.success) return;
        this.showAddPayeeForm.set(true);
        this.scrollToAddForm();
      });
  }

  private scrollToAddForm(): void {
    setTimeout(() => {
      const host: HTMLElement = this.elRef.nativeElement;
      let scrollable = host.parentElement;
      while (scrollable && scrollable.scrollHeight <= scrollable.clientHeight) {
        scrollable = scrollable.parentElement;
      }
      if (scrollable) {
        scrollable.scrollTo({ top: scrollable.scrollHeight / 2, behavior: 'smooth' });
      }
    }, 50);
  }

  onPayeeSaved(res: IPayeeSaveUpdateResult): void {
    if (res?.success) {
      const payee: IPayeeDropdown = {
        id: res.id,
        name: res.name,
        nickName: res.nickName,
        email: res.email,
        phone: res.phone,
        company: res.company,
        addressLine1: res.addressLine1,
        addressLine2: res.addressLine2,
        city: res.city,
        state: res.state,
        zip: res.zip,
        country: res.country,
        payeeTypeId: res.payeeTypeId,
        encryptedId: res.encryptedId ?? res.id
      };
      this.store.dispatch(
        payeesActions.addCreatedPayeeIntoPayees({ payee })
      );
      this.showAddPayeeForm.set(false);
      this.selectPayee(payee);
    }
  }

  cancelAddPayee(): void {
    this.showAddPayeeForm.set(false);
  }

  onEditPayee(): void {
    const payee = this.selectedPayee();
    if (!payee?.id) return;
    this.payeeService
      .checkPermissionToEditPayee(payee.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.editPayeeConfig.set({ edit: true, id: payee.id });
          this.showEditPayeeForm.set(true);
          this.elRef.nativeElement.closest('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  onPayeeUpdated(res: IPayeeSaveUpdateResult): void {
    if (res?.success) {
      const updatedPayee: IPayeeDropdown = {
        ...this.selectedPayee()!,
        id: res.id ?? this.selectedPayee()!.id,
        name: res.name,
        nickName: res.nickName,
        email: res.email,
        phone: res.phone,
        company: res.company,
        addressLine1: res.addressLine1,
        addressLine2: res.addressLine2,
        city: res.city,
        state: res.state,
        zip: res.zip,
        country: res.country,
        payeeTypeId: res.payeeTypeId,
        encryptedId: res.encryptedId ?? this.selectedPayee()?.encryptedId
      };
      this.selectedPayee.set(updatedPayee);
      this.payeeDataService.editedPayeeSignal.set(updatedPayee);
      this.payeeDataService.payeeDataSignal.set(updatedPayee);
      this.store.dispatch(payeesActions.addUpdatedPayeeIntoPayees({ payee: updatedPayee }));
      this.payeeSelected.emit(updatedPayee);
    }
    this.showEditPayeeForm.set(false);
  }

  cancelEditPayee(): void {
    this.showEditPayeeForm.set(false);
  }

  openPayeeSummary(): void {
    this.dialog.open(TransactionHistoryModalV4Component, {
      maxWidth: '1200px',
      width: '93%',
      maxHeight: '860px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  getInitial(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
