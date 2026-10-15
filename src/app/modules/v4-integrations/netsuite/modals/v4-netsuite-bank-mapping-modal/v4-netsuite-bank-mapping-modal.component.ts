import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MapBankAccountComponent } from '../../../modals/v4-map-bank-account/v4-map-bank-account.component';
import { INetsuiteMapedBankList } from 'src/app/modules/integration/netsuite/model/netsuite';

@Component({
  selector: 'app-v4-netsuite-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatDialogModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-netsuite-bank-mapping-modal.component.html',
  styleUrl: './v4-netsuite-bank-mapping-modal.component.scss'
})
export class V4NetsuiteBankMappingModalComponent implements OnInit {
  private netsuiteService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  netsuiteMappedBank = signal<INetsuiteMapedBankList[]>([]);
  loading = signal(false);
  isImportBank = signal(false);
  isClear = signal<Record<number, boolean>>({});
  deleteBank = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    this.getMappedBanks();
  }

  getMappedBanks(): void {
    this.loading.set(true);
    this.changeDetector.markForCheck();
    this.netsuiteService
      .getMappedBankList()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.netsuiteMappedBank.set(res.data);
          const deleteState: Record<number, boolean> = {};
          res.data.forEach((_, i) => (deleteState[i] = false));
          this.deleteBank.set(deleteState);
          this.changeDetector.markForCheck();
        }
      });
  }

  importBank(): void {
    this.isImportBank.set(true);
    this.changeDetector.markForCheck();
    this.netsuiteService
      .importNetsuiteSettings('import-bank-accounts')
      .pipe(
        finalize(() => {
          this.isImportBank.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.getMappedBanks();
        }
      });
  }

  openBankAccountMappingModal(
    id: string,
    bank: INetsuiteMapedBankList,
    isMapping: number
  ): void {
    this.dialog
      .open(V4MapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app: 'NetSuite', qbId: id, data: bank, isMapping }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  removeMapping(id: string, index: number): void {
    const dRef = this.alertService.confirmAlert({
      content:
        'This will remove your current bank account mapping. Are you sure you want to continue?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((response) => {
      if (response) {
        this.isClear.update((s) => ({ ...s, [index]: true }));
        this.changeDetector.markForCheck();
        this.netsuiteService
          .removeMapping(id)
          .pipe(
            finalize(() => {
              this.isClear.update((s) => ({ ...s, [index]: false }));
              this.changeDetector.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.getMappedBanks();
            }
          });
      }
    });
  }

  onEditRow(id: string, bank: INetsuiteMapedBankList, isMapping: number): void {
    this.dialog
      .open(V4MapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app: 'NetSuite', qbId: id, data: bank, isMapping, mode: 'edit' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  onDeleteRow(bankId: string, index: number): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteBank.update((s) => ({ ...s, [index]: true }));
        this.changeDetector.markForCheck();
        this.netsuiteService
          .deleteBank(bankId)
          .pipe(
            finalize(() => {
              this.deleteBank.update((s) => ({ ...s, [index]: false }));
              this.changeDetector.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.getMappedBanks();
              this.alertService.successAlert({
                content: 'Deleted Successfully'
              });
            }
          });
      }
    });
  }
}
