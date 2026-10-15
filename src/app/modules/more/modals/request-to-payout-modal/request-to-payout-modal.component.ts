import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';

export interface IEarningFrom {
  requestPayoutAmount: number;
}

/**
 * Angular component representing the Request to Payout Modal.
 * @class
 */
@Component({
  selector: 'app-request-to-payout-modal',
  templateUrl: './request-to-payout-modal.component.html',
  styleUrls: ['./request-to-payout-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    MatDialogActions,
    NgIf
  ]
})
export class RequestToPayoutModalComponent implements OnInit, OnDestroy {
  /**
   * An array of subscriptions to manage subscriptions.
   * @type {Subscription[]}
   */
  subscriptions: Subscription[] = [];

  /**
   * Flag indicating whether the component is in a loading state.
   * @type {boolean}
   */
  loading = false;

  /**
   * The earnings form group for requesting payout.
   * @type {FormGroup}
   */
  earningFrom: FormGroup;

  /**
   * Initializes a new instance of the RequestToPayoutModalComponent.
   * @constructor
   * @param {number} amount - The requested payout amount.
   * @param {AffiliateProgramsService} _affiliateService - The AffiliateProgramsService for handling affiliate-related operations.
   * @param {AlertService} _alertService - The AlertService for displaying alert messages.
   * @param {MatDialog} _dialog - The MatDialog service for managing dialog boxes.
   * @param {FormBuilder} _formBuilder - The FormBuilder service for creating form controls.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public amount: number,
    private _affiliateService: AffiliateProgramsService,
    private _alertService: AlertService,
    private _dialog: MatDialog,
    private _formBuilder: FormBuilder
  ) {}

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Initializes the form and sets the requested payout amount.
   * @method
   */
  ngOnInit(): void {
    this.initForm(this.amount);
  }

  /**
   * Initializes the earnings form with the requested payout amount.
   * @method
   * @param {number} amount - The requested payout amount.
   */
  initForm(amount: number): void {
    this.earningFrom = this._formBuilder.group({
      requestPayoutAmount: amount
    });
  }

  /**
   * Constructs the body of the payout request form data.
   * @method
   * @returns {IEarningFrom} - The payout request form data.
   */
  formBody(): IEarningFrom {
    const formValues = this.earningFrom?.value;
    return {
      requestPayoutAmount: formValues?.requestPayoutAmount
    };
  }

  /**
   * Handles the payout request.
   * @method
   */
  requestPayout() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    const data = { amount: this.formBody().requestPayoutAmount };
    this.subscriptions.push(
      this._affiliateService
        .requestPayout(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (!res.success) {
            const errorData = {
              title: 'Error',
              content: res.message,
              doneMsg: 'Ok'
            };
            this._alertService.warningAlert(errorData);
            return;
          }
          if (res.success) {
            this._dialog.closeAll();
            const data = {
              content: res.message,
              close: true,
              timeout: 1500
            };
            this._alertService.successAlert(data);
          }
        })
    );
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
