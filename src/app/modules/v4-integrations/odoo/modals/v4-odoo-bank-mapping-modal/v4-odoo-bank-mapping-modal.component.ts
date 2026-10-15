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
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MapBankAccountComponent } from '../../../modals/v4-map-bank-account/v4-map-bank-account.component';
import { IOdooMapedBankList } from 'src/app/modules/integration/odoo/model/odoo';

@Component({
  selector: 'app-v4-odoo-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-odoo-bank-mapping-modal.component.html',
  styleUrl: './v4-odoo-bank-mapping-modal.component.scss'
})
export class V4OdooBankMappingModalComponent implements OnInit {
  private odooService = inject(OdooService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  odooMappedBank = signal<IOdooMapedBankList[]>([]);
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
    this.odooService
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
          this.odooMappedBank.set(res.data);
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
    this.odooService
      .importOdooBankAccounts()
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
    bank: IOdooMapedBankList,
    isMapping: number
  ): void {
    this.dialog
      .open(V4MapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app: 'Odoo', qbId: id, data: bank, isMapping }
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
        this.odooService
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

  onEditRow(id: string, bank: IOdooMapedBankList, isMapping: number): void {
    this.dialog
      .open(V4MapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app: 'Odoo', qbId: id, data: bank, isMapping, mode: 'edit' }
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
        this.odooService
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
