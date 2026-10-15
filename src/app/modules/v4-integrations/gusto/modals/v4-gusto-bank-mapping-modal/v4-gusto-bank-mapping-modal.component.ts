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
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IGustobankAccount } from 'src/app/modules/integration/model/integration';
import { V4GustoMapBankAccountModalComponent } from '../v4-gusto-map-bank-account-modal/v4-gusto-map-bank-account-modal.component';

@Component({
  selector: 'app-v4-gusto-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-gusto-bank-mapping-modal.component.html',
  styleUrls: ['./v4-gusto-bank-mapping-modal.component.scss'],
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4GustoBankMappingModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  mappedBanks = signal<IGustobankAccount[]>([]);
  loading = signal(false);
  deleteBank = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    this.getMappedBanks();
  }

  getMappedBanks(): void {
    this.loading.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .geGustoBankMappedData()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.mappedBanks.set(res.data || []);
          const deleteState: Record<number, boolean> = {};
          (res.data || []).forEach((_, i) => {
            deleteState[i] = false;
          });
          this.deleteBank.set(deleteState);
          this.changeDetector.markForCheck();
        }
      });
  }

  openMapModal(bank: IGustobankAccount, mode?: 'edit'): void {
    if (mode === 'edit' && !bank.isMapped) return;
    this.dialog
      .open(V4GustoMapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { bank, mode }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.getMappedBanks();
      });
  }

  onDeleteRow(bank: IGustobankAccount, index: number): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account mapping?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.deleteBank.update((s) => ({ ...s, [index]: true }));
      this.changeDetector.markForCheck();
      this.integrationService
        .deleteGustoMappedBank(bank.id)
        .pipe(
          finalize(() => {
            this.deleteBank.update((s) => ({ ...s, [index]: false }));
            this.changeDetector.markForCheck();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Bank account mapping deleted.',
              close: true
            });
            this.getMappedBanks();
          }
        });
    });
  }
}
