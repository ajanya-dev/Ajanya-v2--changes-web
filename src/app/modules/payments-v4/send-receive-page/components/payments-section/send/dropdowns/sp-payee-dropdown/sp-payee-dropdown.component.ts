import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Pencil,
  Search,
  User,
  UserRoundPlus
} from 'lucide-angular';

import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import type { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  AddPayeeModalV4Component,
  type IPayeeSaveUpdateResult
} from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { SendStateService } from '../../shared/services/send-state.service';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

@Component({
  selector: 'app-sp-payee-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    ScrollToEndDirective,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-payee-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpPayeeDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpPayeeDropdownComponent extends PayeeDropdownV4Component {
  private readonly dialog = inject(MatDialog);
  private readonly payees = inject(PayeeService);
  private readonly ngrx = inject(Store);
  private readonly destroy = inject(DestroyRef);
  private readonly sendState = inject(SendStateService);
  private readonly payeeData = inject(PayeeDataV35Service);

  readonly PencilIcon = Pencil;
  readonly SearchIcon = Search;
  readonly UserRoundPlusIcon = UserRoundPlus;
  override readonly UserIcon = User;

  // Overridable so a sibling section can relabel the same control.
  readonly label = input('Who are you paying?');
  readonly tooltip = input(
    'Select the person or business receiving this payment.'
  );
  
  readonly required = input(false);

  readonly open = signal(false);
  readonly term = signal('');
  readonly selected = signal<IPayeeDropdown | null | undefined>(null);

  private editing: IPayeeDropdown | null = null;
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    // The base writes a newly added payee straight to `selectedPayee`, the
    // ng-select control this template does not render. Without this the payee
    // is created and set on the form, but the trigger keeps showing the
    // previous one.
    this.selectedPayee.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((value) => this.selected.set(value ?? null));
  }

  override writeValue(value: IPayeeDropdown): void {
    super.writeValue(value);
    this.selected.set(this.selectedPayee.value);
  }

  /**
   * The base clears through ng-select, which this template does not render, so
   * its call would silently no-op. null, not undefined: registerOnChange is wired
   * to selectedPayee.valueChanges and getChange only propagates null.
   */
  override clearSelection(): void {
    this.selected.set(null);
    this.payeeData.payeeDataSignal.set(undefined);
    this.selectedPayee.setValue(null, { emitEvent: true });
    this.clearEvent.emit();
  }

  override close(): void {
    this.open.set(false);
  }

  /**
   * `Name (Nickname)`, as `payee-dropdown-v4` reads it. A nickname is an alias
   * for the payee, not a replacement: showing it on its own put a name on the
   * cheque that was nowhere on the form.
   */
  payeeLabel(payee: IPayeeDropdown | null | undefined): string {
    const name = payee?.name?.trim() ?? '';
    const nickName = payee?.nickName?.trim() ?? '';

    if (!name) {
      return nickName;
    }
    return nickName ? `${name} (${nickName})` : name;
  }

  onSelectPayee(payee: IPayeeDropdown | null): void {
    this.selectedPayee.setValue(payee, { emitEvent: false });
    this.selected.set(payee);
    this.open.set(false);
    this.getChange(payee);
  }

  onSearchInput(value: string): void {
    clearTimeout(this.debounce);
    this.term.set(value);
    const searchTerm = value.replace(/&/g, '%26');
    this.debounce = setTimeout(() => {
      this.ngrx.dispatch(
        payeesActions.loadPayees({
          searchTerm,
          skipEmpty: true,
          disablePermission: true
        })
      );
    }, 600);
  }

  editPayeeRow(payee: IPayeeDropdown): void {
    if (!payee?.id) {
      return;
    }
    this.editing = payee;
    this.payees
      .checkPermissionToEditPayee(payee.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((res) => {
        if (!res.success) {
          return;
        }
        this.dialog
          .open(AddPayeeModalV4Component, {
            maxWidth: '700px',
            width: '95%',
            maxHeight: '90vh',
            disableClose: true,
            autoFocus: false,
            panelClass: 'paddingless-modal-rounded',
            data: { edit: true, id: payee.id }
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroy))
          .subscribe((result: IPayeeSaveUpdateResult) =>
            this.onPayeeUpdated(result)
          );
      });
  }

  private onPayeeUpdated(res: IPayeeSaveUpdateResult): void {
    if (res?.success && this.editing) {
      const payee: IPayeeDropdown = {
        ...this.editing,
        id: res.id ?? this.editing.id,
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
        encryptedId: res.encryptedId ?? this.editing.encryptedId
      };
      this.ngrx.dispatch(
        payeesActions.addUpdatedPayeeIntoPayees({ payee })
      );
      if (this.selected()?.id === payee.id) {
        this.onSelectPayee(payee);
      }
      // The modal can add a bank account, and the payee-bank dropdown keeps a
      // list of its own. Without this the new account is missing from that list
      // while the payment already counts it as chosen — an empty-looking field
      // that Confirm accepts.
      this.sendState.payeeBankReloadTrigger.update((n) => n + 1);
    }
    this.editing = null;
  }
}
