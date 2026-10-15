import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { fabric } from 'fabric';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, X, CircleHelp } from 'lucide-angular';
import { ICheckDesignData } from 'src/app/models/check-design';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { IBankData, IBankDropdown } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';

@Component({
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    TruncatePipe
  ],
  selector: 'app-clone-check-design-v4',
  templateUrl: './clone-check-design-v4.component.html',
  styleUrls: ['./clone-check-design-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloneCheckDesignV4Component implements OnInit {
  readonly XIcon = X;
  readonly CircleHelpIcon = CircleHelp;

  private dialogRef = inject(MatDialogRef<CloneCheckDesignV4Component>);
  private checkDesignCanvasService = inject(CheckdesignCanvasService);
  private checkDesignService = inject(CheckDesignService);
  private dialogData: IBankData = inject(MAT_DIALOG_DATA);
  private alertService = inject(V4AlertService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  bankDropdown = viewChild(BankAcDropdownV4Component);

  canvas: fabric.Canvas;
  bankAccountCheckDesignData: ICheckDesignData;
  checkTemplate = '';
  bankNickName = '';
  bankAccounts: IBankDropdown[] = [];
  isLoading = signal(true);
  cloning = signal(false);
  cloningBankId = '';
  isSelectedAllCheckBox = false;

  ngOnInit(): void {
    this.bankNickName = this.dialogData.bank_account_nick_name;
    this.cloningBankId = this.dialogData.encrypted_bankacc_id;
    this.getTemplate(this.dialogData.encrypted_bankacc_id);
  }

  getSelectedBank(bank: IBankDropdown | null | undefined): void {
    if (!bank) return;
    const isDuplicate = this.bankAccounts.some((b) => b.id === bank.id);
    if (isDuplicate) return;
    this.bankAccounts = [...this.bankAccounts, bank];
    this.bankDropdown()?.clearSelection();
  }

  onRemoveBank(id: string): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to remove this bank from selection?'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.bankAccounts = this.bankAccounts.filter((bank) => bank.id !== id);
        this.changeDetectorRef.detectChanges();
        this.alertService.successAlert({ content: 'Removed Successfully' });
      }
    });
  }

  getTemplate(bankId: string): void {
    this.checkDesignService
      .getTemplate(bankId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.bankAccountCheckDesignData = data.data;
            this.canvas = new fabric.Canvas('checkDesignV4');
            try {
              this.checkTemplate = JSON.parse(data.data.checkDesign as string);
            } catch {
              this.checkTemplate = '';
            }
            this.checkDesignCanvasService.removeNullText(this.checkTemplate);
            this.canvas.loadFromJSON(this.checkTemplate, () => 1);
          }
        }
      });
  }

  clone(): void {
    if (!this.bankAccounts.length && !this.isSelectedAllCheckBox) {
      this.alertService.warningAlert({
        content: 'Please select at least one bank account'
      });
      return;
    }

    const bankIds = this.bankAccounts.map((bank) => bank.id);

    const data = {
      bankId: this.dialogData.encrypted_bankacc_id,
      cloneToBankIds: this.isSelectedAllCheckBox ? [] : bankIds,
      cloneToAllBanks: this.isSelectedAllCheckBox ? 1 : 0
    };
    this.cloning.set(true);
    this.checkDesignService
      .cloneCheckDesign(data)
      .pipe(
        finalize(() => {
          this.cloning.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.alertService.successAlert({
              content: 'Cloned successfully'
            });
            this.dialogRef.close({ success: true });
          }
        },
        error: (err) => {
          this.alertService.warningAlert({ content: err.error.errorMsg });
        }
      });
  }

  selectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!isChecked) {
      this.isSelectedAllCheckBox = false;
      return;
    }

    this.alertService
      .confirmAlert({
        content:
          'Are you sure you want to clone the design to all bank accounts?'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isSelectedAllCheckBox = true;
        } else {
          this.isSelectedAllCheckBox = false;
        }
        this.changeDetectorRef.detectChanges();
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
