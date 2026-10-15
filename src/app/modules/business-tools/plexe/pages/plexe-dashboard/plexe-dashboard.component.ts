import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { PlexeWithdrawModalComponent } from '../../modals/plexe-withdraw-modal/plexe-withdraw-modal.component';
import { finalize } from 'rxjs/operators';
import { IApplicationDetails } from 'src/app/modules/business-tools/plexe/model/plexe';
import { QuestionSection } from 'src/app/data/data/plexe';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { PlexeWithdrawelsComponent } from '../../components/plexe-withdrawels/plexe-withdrawels.component';
import { PlexeTransactionsComponent } from '../../components/plexe-transactions/plexe-transactions.component';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgClass, NgFor, NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-plexe-dashboard',
  templateUrl: './plexe-dashboard.component.html',
  styleUrls: ['./plexe-dashboard.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    MatTabGroup,
    NgFor,
    MatTab,
    NgIf,
    PlexeTransactionsComponent,
    PlexeWithdrawelsComponent,
    CustomerSupportComponent,
    DecimalPipe
  ]
})
export class PlexeDashboardComponent implements OnInit, OnDestroy {
  instructions: string[] = [
    'Funds available (Funds available to withdraw immediately once activated)',
    'Available limit (Your available funds automatically increase to your available limit as your business grows, so you don’t need to reapply)'
  ];

  tabArray = [
    { value: 1, name: 'Transaction Details' },
    { value: 2, name: 'Withdrawal History' }
  ];

  applicationId: string;
  selectedTable = 'Transaction Details';
  isLoading = false;
  subscription: Subscription[] = [];
  fundDetails: IApplicationDetails;
  isStatusLoading = false;
  loanEnable: number;
  onboardingId: string;
  questionList: { qst: string; ans: string }[] =
    QuestionSection.questionAnswerList();
  isRefresh = false;
  applicationStatus: number;

  constructor(
    private _dialog: MatDialog,
    private _plexeService: PlexeService
  ) {}

  ngOnInit(): void {
    this.getUserApplications();
  }

  /**
   * @description Select table.
   *
   */
  onTabChanged(selectedTab: string): void {
    this.selectedTable = selectedTab;
  }

  /**
   * @description Get application details.
   *
   */
  getApplicationDetails(id: string): void {
    this.subscription.push(
      this._plexeService
        .getApplicationsDetails(id)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.fundDetails = res?.data;
          }
        })
    );
  }

  /**
   * @description Get user application.
   *
   */
  getUserApplications(): void {
    this.isLoading = true;
    this.subscription.push(
      this._plexeService.getUserApplications().subscribe((res) => {
        if (res?.success) {
          this.onboardingId = res?.data[0]?.plexe_onboarding_id;
          this.loanEnable = res?.data[0]?.loan_enabled;
          this.applicationStatus = res?.data[0]?.application_status;
          this.getApplicationDetails(this.onboardingId);
        }
      })
    );
  }

  /**
   * @description open plexe withdraw modal component.
   *
   */
  openWithdraw(): void {
    if (this.loanEnable === 0) {
      return;
    }
    this.isRefresh = false;
    const dialogueRef: MatDialogRef<
      PlexeWithdrawModalComponent,
      { id: string; loanEnable: string; edit: boolean }
    > = this._dialog.open(PlexeWithdrawModalComponent, {
      maxWidth: '500px',
      width: '65%',
      disableClose: true,
      data: {
        id: this.onboardingId,
        loanEnable: this.loanEnable,
        edit: false,
        limit: this.fundDetails?.creditLimit
      }
    });
    dialogueRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isRefresh = true;
        this.getApplicationDetails(this.onboardingId);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
