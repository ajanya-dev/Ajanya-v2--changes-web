/* eslint-disable no-restricted-globals */
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocationStrategy, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CompanySwitchRepository } from '../../../repository/companySwitch.repository';
import { PoliciesService } from '../../../services/policies.service';
import { OcwPolicyComponent } from '../ocw-policy/ocw-policy.component';
import { QuickbankPolicyComponent } from '../quickbank-policy/quickbank-policy.component';

@Component({
  selector: 'app-signup-policy',
  templateUrl: './signup-policy.component.html',
  styleUrls: ['./signup-policy.component.scss'],
  standalone: true,
  imports: [FormsModule,OcwPolicyComponent,QuickbankPolicyComponent,WhiteLabelDirective,CommonButtonV35Component,NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SignupPolicyComponent implements OnDestroy {

  private companySwitchRepo = inject(CompanySwitchRepository);
  private policiesService = inject(PoliciesService);
  public localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);
  private location = inject(LocationStrategy);

  @Output() completed = new EventEmitter();
  acceptedPolicy = false;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];
  isLoading: boolean;
  appConfig: IAppConfig;

  constructor() {
    history.pushState('', '', window.location.href);
    this.location.onPopState(() => {
      history.pushState('', '', window.location.href);
    });
  }

  acceptPolicy() {
    this.acceptedPolicy = !this.acceptedPolicy;
  }

  onProceed() {
    if (this.acceptedPolicy) {
      this.isLoading = true;
      this.subscriptions.push(
        this.companySwitchRepo
          .setPolicyAccepted()
          .pipe(finalize(() => {(this.isLoading = false);}))
          .subscribe(() => {
            this.policiesService.pendingPolicy.next(0);
            this.localStorageService.setItem('policyPending', '0');
            this.completed.emit();
          }
        )
      );
    } else {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept Terms to Continue',
        content:
          'To continue, please confirm your acceptance of the terms and conditions.'
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
