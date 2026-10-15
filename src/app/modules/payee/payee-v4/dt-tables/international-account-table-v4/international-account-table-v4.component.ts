import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AddPayeeInternationalBankV4Component } from '../../v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { InternationalBankActionV4Component } from './international-bank-action-v4.component';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-international-account-table-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  templateUrl: './international-account-table-v4.component.html',
  styleUrls: ['./international-account-table-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [V3DataTableService]
})
export class InternationalAccountTableV4Component implements OnInit {
  private payeeDataService = inject(PayeeDataV35Service);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  payeeId = input<string>();

  additionalPayload = computed(() => {
    const id = this.payeeId();
    return id ? { payeeId: id } : undefined;
  });

  private onClickNewButton$ = toObservable(
    computed(() => this.payeeDataService.payeeBankTableActions().onClickNewBank)
  );

  colDefAccountNumber: ICoulmnDefFields = {
    headerName: 'Account Number',
    field: 'account_number',
    minWidth: 140,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefBankName: ICoulmnDefFields = {
    headerName: 'Bank Name',
    field: 'bank_name',
    minWidth: 160,
    flex: 1.5,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefAccountType: ICoulmnDefFields = {
    headerName: 'Account Type',
    field: 'account_type',
    minWidth: 120,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    cellRenderer: (params: ICellRendererParams) => {
      const val = params.value;
      if (!val) return '';
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
  };

  colDefIdentifierType: ICoulmnDefFields = {
    headerName: 'Identifier Type',
    field: 'bank_identifier_type',
    minWidth: 120,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefSwiftBic: ICoulmnDefFields = {
    headerName: 'SWIFT / BIC',
    field: 'swift_or_bic',
    minWidth: 120,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefDefaultBank: ICoulmnDefFields = {
    headerName: 'Default Bank',
    field: 'is_default_for_business',
    minWidth: 110,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    cellRenderer: (params: ICellRendererParams) => {
      const { data } = params;
      if (!data) return '-';
      const isDefault =
        (data.account_type === 'business' &&
          data.is_default_for_business === 1) ||
        (data.account_type === 'personal' &&
          data.is_default_for_personal === 1);
      if (isDefault) {
        return `<span class="text-v4-badge-success-text-color !font-semibold">Yes</span>`;
      }
      return '-';
    }
  };

  colDefCountry: ICoulmnDefFields = {
    headerName: 'Country',
    field: 'bank_account_details',
    minWidth: 110,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    cellRenderer: (params: ICellRendererParams) =>
      params.value?.beneficiary_country ?? ''
  };

  colDefAction: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    sortable: false,
    minWidth: 70,
    maxWidth: 80,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'pl-1',
    cellRenderer: 'intlBankActionButton',
    floatingFilter: false,
    suppressHeaderMenuButton: true
  };

  // Kebab icon column pinned left first, per the v4 placement contract.
  columnDefs: ICoulmnDefFields[] = [
    this.colDefAction,
    this.colDefAccountNumber,
    this.colDefBankName,
    this.colDefAccountType,
    this.colDefIdentifierType,
    this.colDefSwiftBic,
    this.colDefDefaultBank,
    this.colDefCountry
  ];

  frameworkComponents = {
    intlBankActionButton: InternationalBankActionV4Component
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.listenForNewBankAction();
  }

  private listenForNewBankAction(): void {
    this.onClickNewButton$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        if (action === 'international') {
          this.addInternationalBankAccount();
        }
      });
  }

  addInternationalBankAccount(): void {
    const dialogRef = this.dialog.open(AddPayeeInternationalBankV4Component, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        payeeId: this.payeeDataService.payeeDataSignal()?.encryptedId
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: { success: boolean }) => {
        if (response?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Bank account added successfully'
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }
}
