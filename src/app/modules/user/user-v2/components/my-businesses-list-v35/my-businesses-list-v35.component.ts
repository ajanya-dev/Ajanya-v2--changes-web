import { CommonModule, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleDown,
  faDownload,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { IBusinessDetails } from 'src/app/models/bank';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-my-businesses-list-v35',
  templateUrl: './my-businesses-list-v35.component.html',
  styleUrls: ['./my-businesses-list-v35.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    CommonButtonV35Component,
    PipesModule,
    NgClass
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyBusinessesListV35Component implements OnInit {
  private verificationService = inject(CommonVerificationService);
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private userProfileService = inject(UserProfileService);

  userName = input('');
  isManualEntry = input('');
  businessDetails = signal<IBusinessDetails[]>([]);
  isLoading = signal(false);
  userBusinessDetails$ = toObservable(
    this.userProfileService.userBusinessListSignal
  );

  subscriptions: Subscription[] = [];
  openedBusinessesId: string = '';
  isEINShown: string = '';
  companyId: string;

  faAngleDown = faAngleDown;
  faDownload = faDownload;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  ngOnInit(): void {
    this.getStoredData();
    this.companyId = this.localStorageService.getItem('userId') || '';
  }

  getStoredData() {
    this.subscriptions.push(
      this.userBusinessDetails$.subscribe((res) => {
        if (res.length > 0) {
          this.businessDetails.set(res);
          this.openedBusinessesId = res[0]?.id;
        } else {
          this.getBusinessDetails();
        }
      })
    );
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getBusinessDetails(): void {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success && res.data?.length > 0) {
            this.businessDetails.set(res.data as IBusinessDetails[]);
            this.userProfileService.userBusinessListSignal.set(
              this.businessDetails()
            );
            this.openedBusinessesId = res.data[0].id;
          }
        })
    );
  }

  toggleCollapse(id: string) {
    this.isEINShown = '';
    if (this.openedBusinessesId !== id) {
      this.openedBusinessesId = id;
    } else {
      this.openedBusinessesId = '';
    }
  }

  toggleEINView(id: string) {
    if (this.isEINShown === id) {
      this.isEINShown = '';
    } else {
      this.isEINShown = id;
    }
  }

  newBusiness() {
    if (environment.isV4Persona) {
      const isKycVerifed =
        this.gettingStartedService.gettingStartedData.isKycStatusDone;
      if (!isKycVerifed) {
        this.personaHelperService
          .openModal('kyc', CVSourceType.add_new_business)
          .subscribe((res) => {
            if (res?.data.inquiry_type === 'kyb') {
              this.getBusinessDetails();
            }
          });
      } else if(this.isManualEntry()){
          this.router.navigate(['/manage/users/verify-user-id'], {
            queryParams: {
              type: 7,
              from: 'profileBusinessCreate',
              returnUrl: this.router.url,
              isManualEntry: 'true'
            }
          });
      } else{
          this.personaHelperService
            .openModal('kyb', CVSourceType.add_new_business)
            .subscribe((res) => {
              if (res) {
                this.getBusinessDetails();
              }
            });
        }
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: {
          type: 7,
          from: 'profileBusinessCreate',
          returnUrl: this.router.url
        }
      });
    }
  }
}
