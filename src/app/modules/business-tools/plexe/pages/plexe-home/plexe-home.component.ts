import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PlexeWithdrawModalComponent } from '../../modals/plexe-withdraw-modal/plexe-withdraw-modal.component';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { IGettingStartedData } from 'src/app/models/getting-started';
import { NgClass, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-plexe-home',
  templateUrl: './plexe-home.component.html',
  styleUrls: ['./plexe-home.component.scss'],
  standalone: true,
  imports: [NgClass, DecimalPipe]
})
export class PlexeHomeComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  onboardingId: string;
  appilcationStatus: number;
  isStatusLoading = false;
  loanEnable: number;
  creditLimit: number;
  isLoading = false;
  gettingStartedInfo: IGettingStartedData;

  constructor(
    private _plexeService: PlexeService,
    private _router: Router,
    private _dialog: MatDialog,
    private _gettingStarted: GettingStartedService
  ) {}

  ngOnInit(): void {
    this.getUserApplications();
    this.getGettingStartedData();
  }

  /**
   * @description Get getting started data.
   */
  getGettingStartedData(): void {
    this._gettingStarted.initialGettingStartedData$.subscribe((res) => {
      this.gettingStartedInfo = res;
    });
  }

  /**
   * @description Get user applications details.
   */
  getUserApplications(): void {
    this.isStatusLoading = true;
    this.subscription.push(
      this._plexeService
        .getUserApplications()
        .pipe(
          finalize(() => {
            this.isStatusLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.onboardingId = res?.data[0]?.plexe_onboarding_id;
            this.appilcationStatus = res?.data[0]?.application_status;
            this.loanEnable = res?.data[0]?.loan_enabled;

            this.getApplicationDetails(this.onboardingId);
          }
        })
    );
  }

  /**
   * @description Get applications details.
   */
  getApplicationDetails(id: string): void {
    this.isLoading = true;
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
            this.creditLimit = res?.data?.creditLimit;
          }
        })
    );
  }

  /**
   * @description Get start.
   */
  getStart(): void {
    if (
      !this.gettingStartedInfo.isKybStatusDone ||
      !this.gettingStartedInfo.isKycStatusDone
    ) {
      this._router.navigate(['/manage/users/verify-user-id'], {
        queryParams: { plexeId: this.onboardingId }
      });
      return;
    }
    if (this.appilcationStatus) {
      this._router.navigate(['/manage/working-capital/application-Setup'], {
        queryParams: { id: this.onboardingId }
      });
    }
  }

  /**
   * @description Open withdrawal modal.
   */
  openWithdrawModal(): void {
    this._dialog.open(PlexeWithdrawModalComponent, {
      maxWidth: '500px',
      width: '65%',
      data: {
        id: this.onboardingId,
        loanEnable: this.loanEnable,
        edit: true,
        status: this.appilcationStatus,
        limit: this.creditLimit
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
