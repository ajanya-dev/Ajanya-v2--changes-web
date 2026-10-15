import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Plus,
  Building2,
  FileText
} from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { IBusinessDetails } from 'src/app/models/bank';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { TextMaskingPipe } from 'src/app/pipes/text-masking.pipe';
import { PhoneNumberFormatterPipe } from 'src/app/pipes/phone-number-formatter.pipe';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-v4-my-businesses-list',
  templateUrl: './v4-my-businesses-list.component.html',
  styleUrls: ['./v4-my-businesses-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    TextMaskingPipe,
    PhoneNumberFormatterPipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4MyBusinessesListComponent implements OnInit, OnDestroy {
  private verificationService = inject(CommonVerificationService);
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private userProfileService = inject(UserProfileService);

  userName = input('');
  isManualEntry = input<boolean>(false);
  businessDetails = signal<IBusinessDetails[]>([]);
  isLoading = signal(false);
  userBusinessDetails$ = toObservable(
    this.userProfileService.userBusinessListSignal
  );

  readonly ChevronDownIcon = ChevronDown;
  readonly DownloadIcon = Download;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly PlusIcon = Plus;
  readonly BuildingIcon = Building2;
  readonly FileTextIcon = FileText;

  subscriptions: Subscription[] = [];
  openedBusinessesId = '';
  isEINShown = '';
  companyId = '';

  ngOnInit(): void {
    this.getStoredData();
    this.companyId = this.localStorageService.getItem('userId') || '';
  }

  getStoredData(): void {
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

  getBusinessDetails(): void {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(finalize(() => this.isLoading.set(false)))
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

  toggleCollapse(id: string): void {
    this.isEINShown = '';
    if (this.openedBusinessesId !== id) {
      this.openedBusinessesId = id;
    } else {
      this.openedBusinessesId = '';
    }
  }

  toggleEINView(id: string): void {
    if (this.isEINShown === id) {
      this.isEINShown = '';
    } else {
      this.isEINShown = id;
    }
  }

  newBusiness(): void {
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
      } else if (this.isManualEntry()) {
        this.router.navigate(['/v4/manage/user-profile/verify-business'], {
          queryParams: {
            type: 7,
            from: 'profileBusinessCreate',
            returnUrl: this.router.url,
            isManualEntry: 'true'
          }
        });
      } else {
        this.personaHelperService
          .openModal('kyb', CVSourceType.add_new_business)
          .subscribe((res) => {
            if (res) {
              this.getBusinessDetails();
            }
          });
      }
    } else {
      this.router.navigate(['/v4/manage/user-profile/verify-business'], {
        queryParams: {
          type: 7,
          from: 'profileBusinessCreate',
          returnUrl: this.router.url
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
