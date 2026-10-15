import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Subscription, finalize } from 'rxjs';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faPenToSquare, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { MapBankAccountModalComponent } from '../../../modals/map-bank-account-modal/map-bank-account-modal.component';
import { INetsuiteMapedBankList } from '../../model/netsuite';

@Component({
  selector: 'app-netsuite-mapping',
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    MatTooltipModule
  ],
  templateUrl: './netsuite-mapping.component.html',
  styleUrl: './netsuite-mapping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetsuiteMappingComponent implements OnInit, OnDestroy {
  private netsuiteService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);

  netsuiteMappedBank: INetsuiteMapedBankList[] = [];
  subscription: Subscription[] = [];
  loading = false;
  isImportBank = false;
  faTrash = faTrash;
  faEdit = faPenToSquare;
  isClear: boolean[] = [];
  deleteBank: boolean[] = [];

  ngOnInit(): void {
    this.getMappedBanks();
  }

  /**
   * @description Retrieves the list of mapped banks from Netsuite.
   */
  getMappedBanks(): void {
    this.loading = true;
    this.changeDetector.markForCheck();
    this.subscription.push(
      this.netsuiteService
        .getMappedBankList()
        .pipe(
          finalize(() => {
            this.loading = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.netsuiteMappedBank = res.data;
            this.deleteBank.length = this.netsuiteMappedBank.length;
            this.deleteBank.fill(false);
          }
        })
    );
  }

  /**
   * @description Initiates the import of bank accounts from Netsuite.
   */
  ImportBank(): void {
    this.isImportBank = true;
    this.subscription.push(
      this.netsuiteService
        .importNetsuiteSettings('import-bank-accounts')
        .pipe(
          finalize(() => {
            this.isImportBank = false;
            this.changeDetector.markForCheck();
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
   * @param {INetsuiteMapedBankList} bank - The NetSuite bank account data.
   * @param {number} isMapping - Indicates whether the bank account is mapped.
   */
  openBankAccountMappingModal(
    id: string,
    bank: INetsuiteMapedBankList,
    isMapping: number
  ): void {
    this.dialog
      .open(MapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, data: bank, isMapping, app: 'NetSuite' }
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
  removeMapping(id: string,index:number): void {    
    const data = {
      content:'This will remove your current bank account mapping. Are you sure you want to continue?'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((response) => {
      if(response){
        this.isClear[index] = true;
        this.changeDetector.markForCheck();
        this.subscription.push(
          this.netsuiteService
            .removeMapping(id)
            .pipe(
              finalize(() => {
                this.isClear[index] = false;
                this.changeDetector.markForCheck();
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getMappedBanks();
              }
            })
        );
      }
    });
  }

  /**
   * @description Opens the bank account mapping modal for editing.
   * @param {string} id - The ID of the NetSuite bank account.
   * @param {INetsuiteMapedBankList} bank - The NetSuite bank account data.
   * @param {number} isMapping - Indicates whether the bank account is mapped.
   */
  onEditRow(id: string, bank: INetsuiteMapedBankList, isMapping: number): void {
    this.dialog
      .open(MapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, data: bank, mode: 'edit', isMapping, app: 'NetSuite' }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  /**
   * @description Delete selected netsuite bank account.
   * @param {string} bankId - The ID of the bank account to delete.
   * @param {number} index - The index of the bank account row.
   */
  onDeleteRow(bankId: string, index: number): void {
    const data = {
      content: 'Are you sure you want to delete this bank account?'
    };
    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteBank[index] = true;
        this.changeDetector.markForCheck();
        this.subscription.push(
          this.netsuiteService
            .deleteBank(bankId)
            .pipe(
              finalize(() => {
                this.deleteBank[index] = false;
                this.changeDetector.markForCheck();
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
