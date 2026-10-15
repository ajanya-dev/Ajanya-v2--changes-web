import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription, finalize } from 'rxjs';
import { fabric } from 'fabric';
import { ICheckDesignData } from 'src/app/models/check-design';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { IBankData, IBankDropdown } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DropDownBankMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { faQuestionCircle } from '@fortawesome/pro-solid-svg-icons';

@Component({
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    DropDownBankMultiSelectComponent,
    TruncatePipe,
    MatTooltip
  ],
  selector: 'app-clone-check-design',
  templateUrl: './clone-check-design.component.html',
  styleUrls: ['./clone-check-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloneCheckDesignComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<CloneCheckDesignComponent>);
  private checkDesignCanvasService = inject(CheckdesignCanvasService);
  private checkDesignService = inject(CheckDesignService);
  public dialogData: IBankData = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  public canvas: fabric.Canvas;
  subscriptions: Subscription[] = [];
  bankAccountCheckDesignData: ICheckDesignData;
  checkTemplate = '';
  bankNickName: string = '';
  bankAccounts: IBankDropdown[] = [];
  isLoading: boolean = true;
  cloning = false;
  cloningBankId: string;
  removedBankId: string;
  isSelectedAllCheckBox = false;

  faQuestionCircle = faQuestionCircle;

  ngOnInit() {
    this.bankNickName = this.dialogData.bank_account_nick_name;
    this.getTemplate(this.dialogData.encrypted_bankacc_id);
    this.cloningBankId = this.dialogData.encrypted_bankacc_id;
  }

  /**
   * Method to get selected bank from dropdown
   */
  getSelectedBank(bankEvent: IBankDropdown[]) {
    this.bankAccounts = bankEvent;
  }

  /**
   * clear bank selection
   */
  onRemoveBank(id: string) {
    const data = {
      content: 'Are you sure you want to remove this bank from selection?'
    };
    const alert = this.alertService.confirmAlert(data);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.removedBankId = id as string;
        this.bankAccounts = this.bankAccounts.filter(
          (banks) => banks.id !== id
        );
        this.changeDetectorRef.detectChanges();
        this.alertService.successAlert({ content: 'Removed Successfully' });
      }
    });
  }

  /**
   * @description Get template of bank check design
   * @param bankId Bank account id
   */
  getTemplate(bankId: string) {
    this.subscriptions.push(
      this.checkDesignService
        .getTemplate(bankId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data) => {
            if (data?.success) {
              this.bankAccountCheckDesignData = data.data;
              this.canvas = new fabric.Canvas('checkDesign');
              try {
                this.checkTemplate = JSON.parse(
                  data.data.checkDesign as string
                );
              } catch (e) {
                this.checkTemplate = '';
              }
              this.checkDesignCanvasService.removeNullText(this.checkTemplate);
              this.canvas.loadFromJSON(this.checkTemplate, () => 1);
              this.isLoading = false;
              this.changeDetectorRef.detectChanges();
            }
          }
        })
    );
  }

  clone() {
    if (!this.bankAccounts.length && !this.isSelectedAllCheckBox) {
      this.alertService.warningAlert({
        content: 'Please select at least one bank account'
      });
      return;
    }

    const bankIds = this.bankAccounts.map((banks) => banks.id);

    const data = {
      bankId: this.dialogData.encrypted_bankacc_id,
      cloneToBankIds: this.isSelectedAllCheckBox ? [] : bankIds,
      cloneToAllBanks: this.isSelectedAllCheckBox ? 1 : 0
    };
    this.cloning = true;
    this.subscriptions.push(
      this.checkDesignService
        .cloneCheckDesign(data)
        .pipe(
          finalize(() => {
            this.cloning = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res) {
              this.alertService.successAlert({
                content: 'Cloned successfully'
              });
              this.dialogRef?.close({ success: true });
            }
          },
          error: (err) => {
            this.alertService.warningAlert({ content: err.error.errorMsg });
          }
        })
    );
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
}
