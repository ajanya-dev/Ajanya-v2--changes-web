/* eslint-disable no-param-reassign */
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, race, Subject, take, takeUntil, timer } from 'rxjs';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { IBusinessIndustryTypes } from 'src/app/modules/user/model/user';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * How long the onboarding event waits for verification state before sending
 * without it. Matches the budget AuthDataService allows the same stream.
 */
const VERIFICATION_WAIT_MS = 10000;

@Component({
  selector: 'app-feature-list-v4',
  standalone: true,
  imports: [NgClass, CommonButtonV4Component,MatTooltip],
  templateUrl: './feature-list-v4.component.html',
  styleUrl: './feature-list-v4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureListV4Component implements OnInit, OnDestroy {
  private userService = inject(UserProfileService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private postHogService = inject(PostHogService);
  private localStorageService = inject(LocalStorageService);

  destroy$ = new Subject();
  featureList = signal<IBusinessIndustryTypes[]>([]);
  isLoading = signal(false);
  isSubmit = signal(false);

  pageStartTime = performance.now();
  obj: Record<number, number> = {};
  isSelectionChanged = signal(false);

  ngOnInit(): void {
    this.getFeatureList();
    this.pageStartTime = performance.now();
  }

  getFeatureList() {
    this.isLoading.set(true);
    this.userService
      .getOnboardingListData({ type: 'helpText' })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.featureList.set(res.data);
          if (this.featureList()?.length) {
            this.featureList.update(() => {
              const newList = res.data.map((item) => ({
                ...item,
                isChecked: false
              }));
              return newList;
            });
          }
        }
      });
  }

  check(event: Event, index: number) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.updateItemCheckedState(index, isChecked);
  }

  toggleCheckbox(item: IBusinessIndustryTypes, index: number) {
    this.updateItemCheckedState(index, !item.isChecked);
  }

  private updateItemCheckedState(index: number, isChecked: boolean) {
    this.featureList.update((currentList) =>
      currentList.map((item, i) => {
      if(i===index && item.isChecked !==isChecked) {
        this.obj[index]=(this.obj[index] || 0) + 1;
        if (this.obj[index] >= 2) {
          this.isSelectionChanged.set(true);
        }
      }
      return i === index ? { ...item, isChecked } : item;
      })
    );
  }

  submit() {
    const pageEndTime = performance.now();
    const executionTime = pageEndTime - this.pageStartTime;
    const featuresneeded = this.featureList()
      .map((element) => {
        if (element.isChecked) {
          return element.id;
        }
        return null;
      })
      .filter((id): id is number => id !== null);

    const featuresChecked = this.featureList()
      .filter((element) => element.isChecked)
      .map((element) => element.value);

    if (featuresneeded.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one item'
      });
      return;
    }
    this.isSubmit.set(true);
    const payload = {
      featuresNeeded: JSON.stringify(featuresneeded)
    };

    this.userService
      .postOnboardingDataStep1(payload)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {

        if (res.success) {
          // Raced against a timer rather than awaited: loadUserVerification is
          // dispatched only for a session that started already signed in, so on
          // the signup -> onboarding path the store slice is still null here and
          // UserVerification$ — which filters nulls out — would never emit,
          // taking the event with it. The fallback sends it with the contact
          // fields absent instead of not sending it at all.
          race(
            this.userService.UserVerification$,
            timer(VERIFICATION_WAIT_MS).pipe(map(() => null))
          )
            .pipe(take(1))
            .subscribe((verification) => {
              this.postHogService.trackFeatureList({
                ...this.postHogService.customerPayload(
                  {
                    name: this.localStorageService.getItem('username') || '',
                    customerId: String(
                      this.localStorageService.getItem('parentUserId') ||
                        this.localStorageService.getItem('userId') ||
                        ''
                    ),
                    companyId: String(
                      this.localStorageService.getItem('activeCompanyId') || ''
                    ),
                    companyName: String(
                      this.localStorageService.getItem('activeCompanyName') || ''
                    ),
                    email: String(this.localStorageService.getItem('email') || '')
                  },
                  verification
                ),
                features_needed: featuresChecked,
                total_features_selected: featuresChecked.length,
                primary_feature: featuresChecked[0],
                selection_duration_seconds: Math.round(executionTime / 1000),
                is_changed_selection: this.isSelectionChanged()
              });
            });
          this.goToVerificationPage();
        }
      });
  }

  goToVerificationPage() {
    const queryParams = { returnUrl : this.route.snapshot.queryParams.returnUrl };

    if(queryParams.returnUrl){
      this.router.navigate([queryParams.returnUrl]);
      return;
    }

    this.router.navigate(['/v4/manage/payments-out/detailed/all']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
