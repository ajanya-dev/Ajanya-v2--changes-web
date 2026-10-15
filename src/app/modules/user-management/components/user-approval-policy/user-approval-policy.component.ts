import { ComponentType } from '@angular/cdk/portal';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddNewRuleComponent } from '../../modals/add-new-rule/add-new-rule.component';
import { AddMultiLevelRuleComponent } from '../../modals/add-multi-level-rule/add-multi-level-rule.component';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IExistingRules, IMultiLevelExistingRule } from 'src/app/models/user';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { finalize, Subscription } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';

const MULTI_LEVEL_PLUGIN_KEY = 'enterprise-steno-agency';
const MULTI_LEVEL_CRITERIA_TYPE = 'submitter_two_level';

@Component({
  selector: 'app-user-approval-policy',
  templateUrl: './user-approval-policy.component.html',
  styleUrls: ['./user-approval-policy.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, CurrencyPipe]
})
export class UserApprovalPolicyComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private userService = inject(UserManagementService);
  private alertService = inject(AlertService);
  private localStorageService = inject(LocalStorageService);

  existingPolicies: IExistingRules[] = [];
  loading = false;
  subscriptions: Subscription[] = [];
  multiLevelCriteriaType = MULTI_LEVEL_CRITERIA_TYPE;
  private userIdToName = signal<Map<string, string>>(new Map());

  ngOnInit(): void {
    this.getExistingRules();
    this.loadUsersForLookup();
  }

  private loadUsersForLookup(): void {
    this.subscriptions.push(
      this.userService.getApprovalRequiredUsers().subscribe((res) => {
        const map = new Map<string, string>();
        (res?.data ?? []).forEach((u) => map.set(u.client_id, u.client_name));
        this.userIdToName.set(map);
      })
    );
  }

  appliesToName(rule: IExistingRules): string {
    const id = this.asMultiLevel(rule).approvalRequiredData.submitterUserId;
    return this.userIdToName().get(id) ?? id;
  }

  private isMultiLevelPluginEnabled(): boolean {
    const plugins = this.localStorageService.getItem('userPlugins') as
      | string[]
      | null;
    return plugins?.includes(MULTI_LEVEL_PLUGIN_KEY) ?? false;
  }

  isMultiLevelRule(rule: IExistingRules): boolean {
    return rule.criteriaType === MULTI_LEVEL_CRITERIA_TYPE;
  }

  asMultiLevel(rule: IExistingRules): IMultiLevelExistingRule {
    return rule as unknown as IMultiLevelExistingRule;
  }

  getExistingRules() {
    this.loading = true;
    this.subscriptions.push(
      this.userService
        .getExistingRules()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          this.existingPolicies = res.data;
        })
    );
  }

  addNewRule() {
    const ModalComponent: ComponentType<unknown> = this.isMultiLevelPluginEnabled()
      ? AddMultiLevelRuleComponent
      : AddNewRuleComponent;
    this.dialog
      .open(ModalComponent, {
        width: '550px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.edit) {
          this.getExistingRules();
        }
      });
  }

  deleteRule(id: string) {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete this rule?' })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.userService.deleteRule(id).subscribe((res) => {
              if (res) {
                const index = this.existingPolicies.findIndex(
                  (el) => el.id === id
                );
                this.existingPolicies.splice(index, 1);
                this.alertService.successAlert({
                  content: 'Rule deleted successfully'
                });
              }
            })
          );
        }
      });
  }

  editPolicy(id: string) {
    const policy = this.existingPolicies.find((el) => el.id === id);
    if (!policy) return;
    const ModalComponent: ComponentType<unknown> = this.isMultiLevelRule(policy)
      ? AddMultiLevelRuleComponent
      : AddNewRuleComponent;
    this.dialog
      .open(ModalComponent, {
        width: '550px',
        data: policy
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.edit) {
          const index = this.existingPolicies.findIndex((el) => el.id === id);
          this.existingPolicies[index] = res.rule;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
