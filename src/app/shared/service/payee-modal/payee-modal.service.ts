/* eslint-disable no-underscore-dangle */
import { Injectable, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef
} from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IPayeeModalResponse } from 'src/app/modules/intro-tour/pages/intro-payees/payeeModel';
import { IHeaderData } from 'src/app/layout/model/header';
import { IApiRes } from 'src/app/models/api';
import { IPayeeDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { AddPayeeModalV4Component } from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import { PayeeService } from '../payee/payee.service';
import { AddPayeeModalComponent } from '../../modal/payee-modal/add-payee-modal/add-payee-modal.component';
import { HeaderService } from '../header/header.service';

interface IEditPayeeDialogData {
  edit: boolean;
  id: string;
  type?: string | string[];
  slug?: string;
  page?:
    | 'addBankDetails'
    | 'addAddress'
    | 'addInternationalBankDetails'
    | 'bryanCohenPayee'
    | 'addCompany'
    | 'payeeEmail';
  payeeType?: string;
  entityLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayeeModalService {
  private dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private headerService = inject(HeaderService);

  /**
   * @description Opens the add payee modal after checking permission.
   * @param panelClass Optional CSS class to apply to the dialog panel.
   * @param data Optional data to pass to the dialog component.
   */
  openAddPayee(
    panelClass?: string,
    data?: { payeeType?: number; slug?: string; payeeTypeOptions?: string[] },
    useV4 = false
  ): Observable<
    | MatDialogRef<
        AddPayeeModalComponent | AddPayeeModalV4Component,
        IPayeeModalResponse
      >
    | undefined
  > {
    if (useV4) {
      return this.openAddPayeeV4(panelClass, data);
    }
    return this.openAddPayeeV3(panelClass, data);
  }

  private openAddPayeeV3(
    panelClass?: string,
    data?: { payeeType?: number; slug?: string }
  ): Observable<
    MatDialogRef<AddPayeeModalComponent, IPayeeModalResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        if (!isUser) {
          const config: MatDialogConfig<
            { payeeType?: number; slug?: string } | undefined
          > = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '590px',
            width: '85%',
            panelClass: panelClass || '',
            data
          };
          return of(
            this.dialog.open<
              AddPayeeModalComponent,
              { payeeType?: number; slug?: string } | undefined,
              IPayeeModalResponse
            >(AddPayeeModalComponent, config)
          );
        }

        return this.payeeService.checkPermissionToCreatePayee().pipe(
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                { payeeType?: number; slug?: string } | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '590px',
                width: '85%',
                panelClass: panelClass || '',
                data
              };
              return of(
                this.dialog.open<
                  AddPayeeModalComponent,
                  { payeeType?: number; slug?: string } | undefined,
                  IPayeeModalResponse
                >(AddPayeeModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openAddPayeeV4(
    panelClass?: string,
    data?: { payeeType?: number; slug?: string; payeeTypeOptions?: string[] }
  ): Observable<
    MatDialogRef<AddPayeeModalV4Component, IPayeeModalResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        if (!isUser) {
          const config: MatDialogConfig<
            { payeeType?: number; slug?: string } | undefined
          > = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '768px',
            width: '85%',
            maxHeight: '85vh',
            panelClass: 'paddingless-modal-rounded',
            data
          };
          return of(
            this.dialog.open<
              AddPayeeModalV4Component,
              { payeeType?: number; slug?: string } | undefined,
              IPayeeModalResponse
            >(AddPayeeModalV4Component, config)
          );
        }

        return this.payeeService.checkPermissionToCreatePayee().pipe(
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<
                { payeeType?: number; slug?: string } | undefined
              > = {
                autoFocus: false,
                disableClose: true,
                maxWidth: '768px',
                width: '85%',
                maxHeight: '85vh',
                panelClass: 'paddingless-modal-rounded',
                data
              };
              return of(
                this.dialog.open<
                  AddPayeeModalV4Component,
                  { payeeType?: number; slug?: string } | undefined,
                  IPayeeModalResponse
                >(AddPayeeModalV4Component, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  /**
   * @description Opens the edit payee modal after checking permission.
   * @param panelClass Optional CSS class to apply to the dialog panel.
   * @param data Optional data to pass to the dialog component.
   */
  openEditPayee(
    id: string,
    panelClass?: string,
    data?: IEditPayeeDialogData,
    useV4 = false
  ): Observable<
    | MatDialogRef<
        AddPayeeModalComponent | AddPayeeModalV4Component,
        IPayeeModalResponse
      >
    | undefined
  > {
    if (useV4) {
      return this.openEditPayeeV4(id, panelClass, data);
    }
    return this.openEditPayeeV3(id, panelClass, data);
  }

  private openEditPayeeV3(
    id: string,
    panelClass?: string,
    data?: IEditPayeeDialogData
  ): Observable<
    MatDialogRef<AddPayeeModalComponent, IPayeeModalResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        if (!isUser) {
          const config: MatDialogConfig<IEditPayeeDialogData | undefined> = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '590px',
            width: '85%',
            panelClass: panelClass || '',
            data
          };
          return of(
            this.dialog.open<
              AddPayeeModalComponent,
              IEditPayeeDialogData | undefined,
              IPayeeModalResponse
            >(AddPayeeModalComponent, config)
          );
        }

        return this.payeeService.checkPermissionToEditPayee(id).pipe(
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<IEditPayeeDialogData | undefined> =
                {
                  autoFocus: false,
                  disableClose: true,
                  maxWidth: '590px',
                  width: '85%',
                  panelClass: panelClass || '',
                  data
                };
              return of(
                this.dialog.open<
                  AddPayeeModalComponent,
                  IEditPayeeDialogData | undefined,
                  IPayeeModalResponse
                >(AddPayeeModalComponent, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  openEditPayeeV4(
    id: string,
    panelClass?: string,
    data?: IEditPayeeDialogData
  ): Observable<
    MatDialogRef<AddPayeeModalV4Component, IPayeeModalResponse> | undefined
  > {
    return this.headerService._headerData.pipe(
      switchMap((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;

        if (!isUser) {
          const config: MatDialogConfig<IEditPayeeDialogData | undefined> = {
            autoFocus: false,
            disableClose: true,
            maxWidth: '768px',
            width: '85%',
            maxHeight: '85vh',
            panelClass: 'paddingless-modal-rounded',
            data
          };
          return of(
            this.dialog.open<
              AddPayeeModalV4Component,
              IEditPayeeDialogData | undefined,
              IPayeeModalResponse
            >(AddPayeeModalV4Component, config)
          );
        }

        return this.payeeService.checkPermissionToEditPayee(id).pipe(
          switchMap((apiRes) => {
            if (apiRes.success) {
              const config: MatDialogConfig<IEditPayeeDialogData | undefined> =
                {
                  autoFocus: false,
                  disableClose: true,
                  maxWidth: '768px',
                  width: '85%',
                  maxHeight: '85vh',
                  panelClass: 'paddingless-modal-rounded',
                  data
                };
              return of(
                this.dialog.open<
                  AddPayeeModalV4Component,
                  IEditPayeeDialogData | undefined,
                  IPayeeModalResponse
                >(AddPayeeModalV4Component, config)
              );
            }
            return of(undefined);
          })
        );
      })
    );
  }

  getPayeeById(id: string): Observable<IApiRes<IPayeeDetails>> {
    return this.payeeService.getPayeeEditData(id);
  }
}
