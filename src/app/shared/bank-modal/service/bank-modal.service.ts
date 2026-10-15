/* eslint-disable no-underscore-dangle */
import { Injectable, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef
} from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { IHeaderData } from 'src/app/layout/model/header';
import { IBank, IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import { AddNewBankAccountModalComponent } from 'src/app/modules/payee/payee-v2/modals/add-new-bank-account-modal/add-new-bank-account-modal.component';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { AddNewBankV4ModalComponent } from 'src/app/modules/bank/bank-v4/v4-modals/add-new-bank-v4-modal/add-new-bank-v4-modal.component';
import {
  AddPayeeBankV4Component,
  AddPayeeBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-bank-v4/add-payee-bank-v4.component';
import { BankAccountsService } from '../../service/bankAccounts/bank-accounts.service';
import { HeaderService } from '../../service/header/header.service';
import { NewBankAccountModalComponent } from '../modals/new-bank-account-modal/new-bank-account-modal.component';
import { NewBankAccountOptomizedModelComponent } from '../../yodlee/components/new-bank-account-optomized-model/new-bank-account-optomized-model.component';
import { V4NewBankAccountModalComponent } from '../modals/v4-new-bank-account-modal/v4-new-bank-account-modal.component';

interface IBankModalInjectedData {
  editMode?: boolean;
  id?: string;
  from?: string;
  account?: boolean | IPayeeViewBank | IBank;
}

interface IAddBankInjectData {
  editMode?: boolean;
  id?: string;
  payeeId?: string;
  account?: { [key: string]: unknown } | IBank | IPayeeViewBank | null;
  from?: string;
  isFromQuickPay?: boolean;
  bankId?: string;
  legalNameEdit?: boolean;
}

interface INewBankOptimizeddialogData {
  wireRoutingNumberRequired?: number;
}

interface IBankModalResponse {
  success: boolean;
  id: string;
  res?: IBankCreateRes | IBankDropdown;
  check_no?: string;
}

interface IAddBanResponse {
  success: boolean;
  data: IPayeeSingleBankData;
}

interface IOptimizedRes {
  success: boolean;
  id: string;
  bankAcData?: IBankCreateRes | IBankDropdown;
  check_no?: string;
}

export const LEGAL_NAME_EDIT_MODAL = 'PayeeBankLegalNameEditModal';

@Injectable({
  providedIn: 'root'
})
export class BankModalService {
  private dialog = inject(MatDialog);
  private bankAccountsService = inject(BankAccountsService);
  private headerService = inject(HeaderService);

  isBankPermissionChecking = signal(false);

  /**
   * @description Opens the add payee modal after checking permission.
   * @param panelClass Optional CSS class to apply to the dialog panel.
   * @param data Optional data to pass to the dialog component.
   */
  openAddBank(
    data?: IBankModalInjectedData
  ): Observable<
    MatDialogRef<NewBankAccountModalComponent, IBankModalResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        // If isUser is false, it means the logged-in user is a master user, so there’s no need to check permissions; the AddPayeeModal can be opened directly.
        if (!isUser) {
          const config: MatDialogConfig<IBankModalInjectedData | undefined> = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '510px',
            width: '93%',
            data
          };
          return of(
            this.dialog.open<
              NewBankAccountModalComponent,
              IBankModalInjectedData | undefined,
              IBankModalResponse
            >(NewBankAccountModalComponent, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        // If isUser is true, check permission to create payee before proceeding.
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                IBankModalInjectedData | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '510px',
                width: '93%',
                data
              };
              return of(
                this.dialog.open<
                  NewBankAccountModalComponent,
                  IBankModalInjectedData | undefined,
                  IBankModalResponse
                >(NewBankAccountModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openAddBankNormalModal(
    injectData?: IAddBankInjectData
  ): Observable<
    MatDialogRef<AddNewBankAccountModalComponent, IAddBanResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        // If isUser is false, it means the logged-in user is a master user, so there’s no need to check permissions; the AddPayeeModal can be opened directly.
        if (!isUser) {
          const config: MatDialogConfig<IAddBankInjectData | undefined> = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '95%',
            width: '500px',
            data: injectData
          };
          return of(
            this.dialog.open<
              AddNewBankAccountModalComponent,
              IAddBankInjectData | undefined,
              IAddBanResponse
            >(AddNewBankAccountModalComponent, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        // If isUser is true, check permission to create payee before proceeding.
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<IAddBankInjectData | undefined> = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '95%',
                width: '500px',
                data: injectData
              };
              return of(
                this.dialog.open<
                  AddNewBankAccountModalComponent,
                  IAddBankInjectData | undefined,
                  IAddBanResponse
                >(AddNewBankAccountModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openAddBankNormalModalV4(
    injectData?: AddPayeeBankDialogData
  ): Observable<
    MatDialogRef<AddPayeeBankV4Component, IAddBanResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        // If isUser is false, it means the logged-in user is a master user, so there’s no need to check permissions; the AddPayeeModal can be opened directly.
        if (!isUser) {
          const config: MatDialogConfig<AddPayeeBankDialogData | undefined> = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '95%',
            width: '500px',
            data: injectData,
            panelClass: 'paddingless-modal-rounded'
          };
          return of(
            this.dialog.open<
              AddPayeeBankV4Component,
              AddPayeeBankDialogData | undefined,
              IAddBanResponse
            >(AddPayeeBankV4Component, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        // If isUser is true, check permission to create payee before proceeding.
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                AddPayeeBankDialogData | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '95%',
                width: '500px',
                data: injectData,
                panelClass: 'paddingless-modal-rounded'
              };
              return of(
                this.dialog.open<
                  AddPayeeBankV4Component,
                  AddPayeeBankDialogData | undefined,
                  IAddBanResponse
                >(AddPayeeBankV4Component, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openAddBankOptimizedModal(
    injectData?: INewBankOptimizeddialogData
  ): Observable<
    | MatDialogRef<NewBankAccountOptomizedModelComponent, IOptimizedRes>
    | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        // If isUser is false, it means the logged-in user is a master user, so there’s no need to check permissions; the AddPayeeModal can be opened directly.
        if (!isUser) {
          const config: MatDialogConfig<
            INewBankOptimizeddialogData | undefined
          > = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '510px',
            width: '93%',
            data: injectData
          };
          return of(
            this.dialog.open<
              NewBankAccountOptomizedModelComponent,
              INewBankOptimizeddialogData | undefined,
              IOptimizedRes
            >(NewBankAccountOptomizedModelComponent, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        // If isUser is true, check permission to create payee before proceeding.
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                INewBankOptimizeddialogData | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '510px',
                width: '93%',
                data: injectData
              };
              return of(
                this.dialog.open<
                  NewBankAccountOptomizedModelComponent,
                  INewBankOptimizeddialogData | undefined,
                  IOptimizedRes
                >(NewBankAccountOptomizedModelComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openAddBankV4Modal(
    injectData?: INewBankOptimizeddialogData
  ): Observable<
    MatDialogRef<AddNewBankV4ModalComponent, IOptimizedRes> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        // If isUser is false, it means the logged-in user is a master user, so there’s no need to check permissions; the AddPayeeModal can be opened directly.
        if (!isUser) {
          const config: MatDialogConfig<
            INewBankOptimizeddialogData | undefined
          > = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '510px',
            width: '93%',
            panelClass: 'paddingless-modal-rounded',
            data: injectData
          };
          return of(
            this.dialog.open<
              AddNewBankV4ModalComponent,
              INewBankOptimizeddialogData | undefined,
              IOptimizedRes
            >(AddNewBankV4ModalComponent, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        // If isUser is true, check permission to create payee before proceeding.
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                INewBankOptimizeddialogData | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '510px',
                width: '93%',
                panelClass: 'paddingless-modal-rounded',
                data: injectData
              };
              return of(
                this.dialog.open<
                  AddNewBankV4ModalComponent,
                  INewBankOptimizeddialogData | undefined,
                  IOptimizedRes
                >(AddNewBankV4ModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openV4NewBankAccountModal(): Observable<
    MatDialogRef<V4NewBankAccountModalComponent, IOptimizedRes> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        if (!isUser) {
          const config: MatDialogConfig = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '620px',
            width: '93%',
            panelClass: 'paddingless-modal-rounded'
          };
          return of(
            this.dialog.open<
              V4NewBankAccountModalComponent,
              undefined,
              IOptimizedRes
            >(V4NewBankAccountModalComponent, config)
          );
        }

        this.isBankPermissionChecking.set(true);
        return this.bankAccountsService.checkPermissionToCreateBank().pipe(
          finalize(() => {
            this.isBankPermissionChecking.set(false);
          }),
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '620px',
                width: '93%',
                panelClass: 'paddingless-modal-rounded'
              };
              return of(
                this.dialog.open<
                  V4NewBankAccountModalComponent,
                  undefined,
                  IBankModalResponse
                >(V4NewBankAccountModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }
}
