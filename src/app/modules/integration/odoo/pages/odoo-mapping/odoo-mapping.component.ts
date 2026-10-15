import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { OdooService } from '../../service/odoo.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subscription } from 'rxjs';
import { IOdooMapedBankList } from '../../model/odoo';
import { MapBankAccountModalComponent } from '../../../modals/map-bank-account-modal/map-bank-account-modal.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-odoo-mapping',
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    MatTooltipModule
  ],
  templateUrl: './odoo-mapping.component.html',
  styleUrl: './odoo-mapping.component.scss'
})
export class OdooMappingComponent implements OnInit, OnDestroy {
  private odooService = inject(OdooService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  subscription: Subscription[] = [];

  loading = false;
  odooMappedBank: IOdooMapedBankList[] = [];
  isImportBank = false;
  isDelete: boolean[] = [];

  faEdit = faEdit;
  faTrash = faTrash;

  ngOnInit(): void {
    this.getMappedBanks();
  }

  /**
   * @description Retrieves the list of mapped banks from Odoo.
   */
  getMappedBanks(): void {
    this.loading = true;
    this.changeDetectorRef.markForCheck();
    this.subscription.push(
      this.odooService
        .getMappedBankList()
        .pipe(
          finalize(() => {
            this.loading = false;
            this.changeDetectorRef.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.odooMappedBank = res.data;
          }
        })
    );
  }

  /**
   * @description Initiates the import of bank accounts from Odoo.
   */
  ImportBank(): void {
    this.isImportBank = true;
    this.subscription.push(
      this.odooService
        .importOdooBankAccounts()
        .pipe(
          finalize(() => {
            this.isImportBank = false;
            this.changeDetectorRef.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.getMappedBanks();
          }
        })
    );
  }

  /**
   * @description Opens the bank account mapping modal.
   * @param {string} id - The ID of the NetSuite bank account.
   * @param {IOdooMapedBankList} bank - The Odoo bank account data.
   * @param {number} isMapping - Indicates whether the bank account is mapped.
   */
  openBankAccountMappingModal(
    id: string,
    bank: IOdooMapedBankList,
    isMapping: number
  ): void {
    this.dialog
      .open(MapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, data: bank, isMapping, app: 'odoo' }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  /**
   * @description Removes mapping for a bank account.
   * @param {string} id - The ID of the bank account to remove mapping.
   */
  removeMapping(id: string, index: number): void {
    const data = {
      content:
        'This will remove your current bank account mapping. Are you sure you want to continue?'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((response) => {
      if (response) {
        this.isDelete[index] = true;
        this.changeDetectorRef.markForCheck();
        this.subscription.push(
          this.odooService
            .removeMapping(id)
            .pipe(
              finalize(() => {
                this.isDelete[index] = false;
                this.changeDetectorRef.markForCheck();
              })
            )
            .subscribe((res) => {
              if (res?.success) {
                this.getMappedBanks();
              }
            })
        );
      }
    });
  }

  /**
   * @description Opens the bank account mapping modal for editing.
   * @param {string} id - The ID of the Odoo bank account.
   * @param {IOdooMapedBankList} bank - The Odoo bank account data.
   * @param {number} isMapping - Indicates whether the bank account is mapped.
   */
  onEditRow(id: string, bank: IOdooMapedBankList, isMapping: number): void {
    this.dialog
      .open(MapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, data: bank, mode: 'edit', isMapping, app: 'odoo' }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  /**
   * @description Delete selected Odoo bank account.
   * @param {string} bankId - The ID of the Odoo bank account to delete.
   * @param {number} index - The index of the bank account row.
   */
  onDeleteRow(bankId: string, index: number): void {
    const data = {
      content: 'Are you sure you want to delete this bank account?'
    };
    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isDelete[index] = true;
        this.changeDetectorRef.markForCheck();
        this.subscription.push(
          this.odooService
            .deleteBank(bankId)
            .pipe(
              finalize(() => {
                this.isDelete[index] = false;
                this.changeDetectorRef.markForCheck();
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getMappedBanks();
                this.alertService.successAlert({
                  content: 'Deleted Successfully'
                });
              }
            })
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
