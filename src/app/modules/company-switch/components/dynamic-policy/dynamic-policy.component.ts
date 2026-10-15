import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { IApiRes } from 'src/app/models/api';
import { Observable, Subscription, finalize } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { SignupPolicyComponent } from '../../shared/components/signup-policy/signup-policy.component';
import { CompanySwitchRepository } from '../../repository/companySwitch.repository';
import { PoliciesService } from '../../services/policies.service';
import { IPolicy } from '../../model/company-switch';

@Component({
  selector: 'app-dynamic-policy',
  templateUrl: './dynamic-policy.component.html',
  styleUrls: ['./dynamic-policy.component.scss'],
  standalone: true,
  imports: [NgIf, SignupPolicyComponent, NgFor, FormsModule, AsyncPipe]
})
export class DynamicPolicyComponent implements OnInit, OnDestroy {
  policies$: Observable<IApiRes<IPolicy[]>>;
  pendingPolicy: number;
  acceptedPolicy = false;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];
  isLoading: boolean;
  appConfig: IAppConfig;

  private cpSwitchRepo = inject(CompanySwitchRepository);
  private policiesService = inject(PoliciesService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);

  ngOnInit() {
    this.policies$ = this.cpSwitchRepo.getPolicies();
    this.subscriptions.push(
      this.policiesService.pendingPolicy.subscribe((res) => {
        this.pendingPolicy = res;
      })
    );
  }

  /**
   * @description Toggles the acceptance status of a policy.
   */
  acceptPolicy() {
    this.acceptedPolicy = !this.acceptedPolicy;
  }

  /**
   * @description  Handles the proceed action after checking if the policy has been accepted.
   */
  onProceed() {
    if (this.pendingPolicy && this.acceptedPolicy) {
      this.isLoading = true;
      this.subscriptions.push(
        this.cpSwitchRepo
          .setPolicyAccepted()
          .pipe(finalize(() => {(this.isLoading = false);}))
          .subscribe(() => {
            this.pendingPolicy = 0;
            this.policiesService.pendingPolicy.next(0);
            this.localStorageService.setItem('policyPending', '0');
          })
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

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
