import { finalize } from 'rxjs/operators';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlexeService } from 'src/app/shared/service/plexe/plexe.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { PlexeInformationModalComponent } from '../../modals/plexe-information-modal/plexe-information-modal.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-plexe-intro',
  templateUrl: './plexe-intro.component.html',
  styleUrls: ['./plexe-intro.component.scss'],
  standalone: true,
  imports: [NgOptimizedImage, FaIconComponent, CommonButtonV35Component]
})
export class PlexeIntroComponent implements OnInit {
  private dialog = inject(MatDialog);
  private plexeService = inject(PlexeService);
  private router = inject(Router);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private gettingStartedService = inject(GettingStartedService);

  subscriptions: Subscription[] = [];
  plexeApplicationStatus: number;
  plexeOnboardingId: string;
  plexeUserStatus: number;
  isloading = false;
  isSpinner = true;
  env = environment;
  registrationFailed = true;

  ngOnInit(): void {
    this.getKycStatus();
  }

  /**
   * Method for getting use kyc status
   */
  getKycStatus() {
    this.subscriptions.push(
      this.gettingStartedService
        .getGettingStartedDataApi()
        .pipe(
          finalize(() => {
            this.isSpinner = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.data.kycStatus === 3) {
              return;
            }
            this.isSpinner = true;
            this.registrationFailed = false;
            this.getApplicationStatus();
          },
          error: () => {
            this.getApplicationStatus();
          }
        })
    );
  }

  /**
   * @description
   * ## PlexeUserStatus and PlexeApplicationStatus used for redirect link
   *
   * @usageNotes
   * #### If it is plexeUserStatus === 10 it means that user never appiled to lineofcredit
   *
   * #### If it is plexeUserStatus === 1 it means that user appiled to lineofcredit
   *
   * #### If it is plexeUserStatus === 2 it means that user waiting for approvel of plexe
   *
   * #### If it is plexeApplicationStatus === 11 it means that user raedy to withdrew money
   *
   * #### If it is plexeApplicationStatus === 4 it means that user complete all  step of lineofcredit
   *
   */
  getPlexeOnboard(): void {
    this.subscriptions.push(
      this.plexeService
        .getUserApplications()
        .pipe(
          finalize(() => {
            this.isloading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.plexeOnboardingId = res?.data[0]?.plexe_onboarding_id;
            this.plexeApplicationStatus = res?.data[0]?.application_status;
            if (this.plexeUserStatus === 1) {
              this.router.navigate(['manage/working-capital/success']);
            } else if (
              this.plexeUserStatus === 2 &&
              this.plexeApplicationStatus === 11
            ) {
              this.router.navigate(['manage/working-capital/dashboard/']);
            } else if (
              (this.plexeUserStatus === 2 &&
                this.plexeApplicationStatus >= 6 &&
                this.plexeApplicationStatus < 11) ||
              (this.plexeUserStatus === 2 &&
                (this.plexeApplicationStatus === 21 ||
                  this.plexeApplicationStatus === 29))
            ) {
              this.router.navigate(['manage/working-capital/home']);
            } else if (
              (this.plexeUserStatus === 2 &&
                this.plexeApplicationStatus === 4) ||
              (this.plexeUserStatus === 2 && this.plexeApplicationStatus === 20)
            ) {
              if (res?.data[0]?.document_requested === 1) {
                this.router.navigate(['manage/working-capital/success'], {
                  queryParams: { id: this.plexeOnboardingId }
                });
              } else {
                this.router.navigate(['manage/working-capital/success']);
              }
            } else if (
              this.plexeUserStatus === 5 ||
              this.plexeApplicationStatus === 22
            ) {
              this.router.navigate(['manage/working-capital/reject']);
            } else if (
              this.plexeUserStatus === 2 ||
              this.plexeApplicationStatus === 12
            ) {
              this.isSpinner = false;
            }
          }
        })
    );
  }

  /**
   * @description Get applications status.
   */
  getApplicationStatus(): void {
    this.isloading = true;
    this.subscriptions.push(
      this.plexeService.getApllicationStatus().subscribe((res) => {
        if (res?.success) {
          this.plexeUserStatus = res?.status;
          if (this.plexeUserStatus === 10) {
            this.isSpinner = false;
          }
          if (this.plexeUserStatus === 2) {
            this.getPlexeOnboard();
          }
          if (this.plexeUserStatus === 5) {
            this.router.navigate(['manage/working-capital/reject']);
          }
          if (this.plexeUserStatus === 1) {
            this.router.navigate(['manage/working-capital/success']);
          }
        }
      })
    );
  }

  /**
   * @description Open information modal
   */
  onGetStart() {
    const dialog = this.dialog.open(PlexeInformationModalComponent, {
      disableClose: true,
      maxWidth: '550px',
      width: '50%',
      height: '50%'
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/working-capital/apply']);
      }
    });
  }

  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  goToHomePage() {
    this.router.navigateByUrl('/manage/home');
  }
}
