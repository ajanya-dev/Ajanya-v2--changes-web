import {
  Component,
  OnDestroy,
  inject,
  OnInit,
  Injector,
  effect
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { CardTimeInterval } from 'src/app/data/data/cloud-bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CloudBankDetailsDataV35Service } from '../../services/cloud-bank-details-data-v35.service';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { CommonInputFieldComponent } from '../../../../../shared/v3/common-input-field/common-input-field.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-create-card',
  templateUrl: './create-card.component.html',
  styleUrls: ['./create-card.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    MatTooltip,
    CommonInputFieldComponent,
    ControlMessageComponent,
    MatRadioGroup,
    MatRadioButton,
    CommonButtonV35Component
  ]
})
export class CreateCardComponent implements OnInit, OnDestroy {
  /**
   * @description Injecting dependencies using inject method
   */
  private cloudService = inject(CloudBankService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private cloudBankDataService = inject(CloudBankDetailsDataV35Service);
  private injector = inject(Injector);

  subscriptions: Subscription[] = [];

  timePeriod: { name: string; value: string; checked: boolean }[] =
    CardTimeInterval.timeIntervalList();

  cardForm: FormGroup = this.fb.group({
    cardLabel: ['', [Validators.required]],
    spendingLimit: ['', [Validators.required]],
    cardLimitPeriod: ['monthly', [Validators.required]]
  });

  accountId = '';
  cardId = '';
  loading = false;
  typeOfCard: { value: string; name: string }[] = [
    { value: 'virtual', name: 'Virtual Card' },
    { value: 'physical', name: 'Physical card' }
  ];

  ngOnInit(): void {
    this.accountId = this.activatedRoute.snapshot.queryParams.id;
    this.cardId = this.activatedRoute.snapshot.queryParams.cardId;
    if (this.cardId) {
      effect(
        () => {
          this.cardForm.patchValue({
            cardLabel: this.cloudBankDataService.selectedCardSignal()?.label,
            spendingLimit:
              this.cloudBankDataService.selectedCardSignal()?.limitAmount,
            cardLimitPeriod:
              this.cloudBankDataService.selectedCardSignal()?.limitInterval
          });
        },
        { injector: this.injector }
      );
    }
  }

  /**
   * @description Submit form to create card or edit card
   * @returns return if after creating card
   */
  submit() {
    this.cardForm.markAllAsTouched();
    if (this.cardForm.invalid) {
      return;
    }
    const formValue = this.cardForm.value;
    const cardDetails = {
      accountId: this.accountId,
      cardType: 'virtual',
      label: formValue.cardLabel,
      limitAmount: formValue.spendingLimit,
      limitInterval: formValue.cardLimitPeriod
    };
    if (this.cardId) {
      this.loading = true;
      this.subscriptions.push(
        this.cloudService
          .updateCardDetail(this.cardId, cardDetails)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data = {
                title: 'Success!',
                content: 'Card details updated.',
                close: true
              };
              this.alertService.successAlert(data);
              this.cloudBankDataService.cardUpdatedOrAdded = true;
              this.cloudBankDataService.getCardDetails('edit', this.accountId);
              this.router.navigate(['/manage/cloud-bank/index']);
            }
          })
      );
      return;
    }
    this.loading = true;
    this.subscriptions.push(
      this.cloudService
        .createCard(cardDetails)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success!',
              content: 'Your card has been successfully created. Please check back after some time for confirmation.',
              close: true,
              timeout:3000
            };
            this.alertService.successAlert(data);
            this.cloudBankDataService.cardUpdatedOrAdded = true;
            this.cloudBankDataService.getCardDetails('create', this.accountId);
            this.router.navigate(['/manage/cloud-bank/index']);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
