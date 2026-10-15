import { ComponentType } from '@angular/cdk/portal';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, Subscription } from 'rxjs';
import { IExistingRules, IMultiLevelExistingRule } from 'src/app/models/user';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { AddMultiLevelRuleV4Component } from '../../v4-modals/add-multi-level-rule-v4/add-multi-level-rule-v4.component';
import { AddNewRuleV4Component } from '../../v4-modals/add-new-rule-v4/add-new-rule-v4.component';

const MULTI_LEVEL_PLUGIN_KEY = 'enterprise-steno-agency';
const MULTI_LEVEL_CRITERIA_TYPE = 'submitter_two_level';

/**
 * V4 parallel of the v3 UserApprovalPolicyComponent.
 * Lists approval-policy rules (simple amount-based and multi-level) and lets
 * the user create, edit and delete them. The create/edit modal switches
 * between the multi-level and simple variants based on the active plugin.
 */
@Component({
  selector: 'app-approval-policy-v4',
  standalone: true,
  templateUrl: './approval-policy-v4.component.html',
  imports: [CommonModule, CurrencyPipe, LucideAngularModule, CommonButtonV4Component]
})
export class ApprovalPolicyV4Component implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private userService = inject(UserManagementService);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

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

  goBack(): void {
    this.router.navigate(['/v4/manage/manage-users']);
  }

  getExistingRules(): void {
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

  addNewRule(): void {
    const ModalComponent: ComponentType<unknown> = this.isMultiLevelPluginEnabled()
      ? AddMultiLevelRuleV4Component
      : AddNewRuleV4Component;
    this.dialog
      .open(ModalComponent, {
        maxWidth: '600px',
        width: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.edit) {
          this.getExistingRules();
        }
      });
  }

  editPolicy(id: string): void {
    const policy = this.existingPolicies.find((el) => el.id === id);
    if (!policy) return;
    const ModalComponent: ComponentType<unknown> = this.isMultiLevelRule(policy)
      ? AddMultiLevelRuleV4Component
      : AddNewRuleV4Component;
    this.dialog
      .open(ModalComponent, {
        maxWidth: '600px',
        width: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
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

  deleteRule(id: string): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete this rule?' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
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
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
