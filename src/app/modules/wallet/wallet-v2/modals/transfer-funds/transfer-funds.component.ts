import {
  Component,
  HostListener,
  Inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { finalize } from 'rxjs/operators';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { IWalletData } from '../../../../../models/wallet';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-transfer-funds',
  templateUrl: './transfer-funds.component.html',
  styleUrls: ['./transfer-funds.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    ControlMessageComponent,
    NgxMaskDirective,
    NgIf
  ]
})
export class TransferFundsComponent implements OnInit, OnDestroy {
  transferFundsForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  submitting = false;
  walletList: IWalletData[];
  disableTooltip: boolean;

  constructor(
    private fb: UntypedFormBuilder,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private walletService: WalletService,
    private dataTableService: DataTableService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.initTransferForm(params?.wallet);
      })
    );

    this.getWalletInformation();
    this.transferFundsForm.patchValue({ fromWallet: this.data });
  }

  @HostListener('window:resize', []) toolTipDisable() {
    if (window.innerWidth >= 1024) {
      this.disableTooltip = false;
    } else {
      this.disableTooltip = true;
    }
  }

  // Get Wallet Information
  getWalletInformation() {
    this.subscriptions.push(
      this.walletService.getWalletInformation().subscribe((res) => {
        if (res.success) {
          this.walletList = res.data.map((value) => {
            value.displayName = `${value.walletName} (${value.availableBalance}) (${value.bankAccountNumber})`;
            return value;
          });
        }
      })
    );
  }

  // Clicking Submit Button
  onSubmit() {
    this.transferFundsForm.markAllAsTouched();
    if (this.transferFundsForm.invalid) {
      return;
    }

    this.submitting = true;
    this.subscriptions.push(
      this.walletService
        .transferFunds(this.transferFundsForm.value)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialog.closeAll();
            this.dataTableService.setRefreshStatus(true, 20);
            this.successAlert('Fund transferred successfully');
          }
        })
    );
  }

  // Alerts and Pop Ups
  successAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  initTransferForm(walletUuid: string) {
    this.transferFundsForm = this.fb.group({
      fromWallet: [walletUuid || null, [Validators.required]],
      toWallet: [null, [Validators.required]],
      amount: [null, [Validators.required]],
      comment: [null, [Validators.required]]
    });
  }

  totalAmountCal() {
    const amount = this.transferFundsForm.value.amount
      ? this.transferFundsForm.value.amount * 1
      : 0;
    if (amount > 0) {
      const fee = (amount + 0.5 + 1) * 0.03019 + 0.5 + 1;
      let totalAmount = amount + fee;
      totalAmount = parseFloat(totalAmount.toFixed(2));
      this.transferFundsForm.controls.totalAmount.setValue(totalAmount);
    } else {
      this.transferFundsForm.controls.totalAmount.setValue(0);
    }
  }

  // Function to Open Calculator
  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: {addAmountButton : true}
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.transferFundsForm.patchValue({ amount: calculatedValue });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
