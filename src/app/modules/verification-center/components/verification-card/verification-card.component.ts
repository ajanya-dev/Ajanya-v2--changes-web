import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  faBuildingColumns,
  faCheck,
  faLock,
  faStar
} from '@fortawesome/pro-regular-svg-icons';
import { faPlayCircle } from '@fortawesome/pro-solid-svg-icons';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { DemoVideoService } from 'src/app/shared/service/common/demo-video/demo-video.service';
import { Subject, takeUntil } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatTooltip } from '@angular/material/tooltip';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { verificationData } from '../../data/verification-center.data';
import { verificationDataNew } from '../../data/verification-center-new.data';
import { VerificationCenterCardsValue } from '../../model/verification-center.model';
import { CardTypes } from '../../constants/verification-center.constants';

/**
 * Component representing a verification card.
 */
@Component({
  selector: 'app-verification-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, CommonButtonV35Component, NgClass, MatTooltip],
  templateUrl: './verification-card-new.component.html',
  styleUrl: './verification-card.component.scss'
})
export class VerificationCardComponent implements OnInit, OnDestroy {
  /** The type of card to display, provided as an input. */
  cardType = input.required<VerificationCenterCardsValue>();

  /** Details for the verification data based on card type. */
  details: (typeof verificationDataNew)[VerificationCenterCardsValue];

  /** Router service for navigation. */
  private router = inject(Router);

  /** Service for accessing local storage. */
  private localStorageService = inject(LocalStorageService);
  private demoVideoService = inject(DemoVideoService);
  private headerService = inject(HeaderService);

  /** FontAwesome icons used in the component. */
  faLock = faLock;
  faCheck = faCheck;
  faBuildingColumns = faBuildingColumns;
  faStar = faStar;
  faPlay = faPlayCircle;

  /** Verification status fetched from local storage. */
  verificationStatus: IGettingStartedAPI;

  /** Boolean indicating if the user is verified. */
  userVerfied = false;

  /** Boolean indicating if KYC (Know Your Customer) is done. */
  kycDone = false;

  /** Boolean indicating if KYB (Know Your Business) is done. */
  kybDone = false;
  bankAdded = false;
  cardAdded = false;

  bankVerified = false;
  destroy$ = new Subject();
  helpVideosList: IDemoVideo;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  /**
   * Constructor to initialize the verification status and related booleans.
   */
  constructor() {
    this.verificationStatus =
      this.localStorageService.getItem('gettingStartedData');
    this.userVerfied = this.verificationStatus?.verification === 1;
    this.bankAdded = this.verificationStatus?.bankAccount !== 0;

    this.kycDone = this.verificationStatus?.kycStatus !== null;
    this.cardAdded = this.verificationStatus?.adp?.isCardAdded === 1;

    this.kybDone =
      this.verificationStatus?.kybStatus !== 0 &&
      this.verificationStatus?.kybStatus !== null;
    this.bankVerified = this.verificationStatus?.bankAccount === 2;
  }

  ngOnInit(): void {
    this.details = verificationData[this.cardType()];
    this.getHelpVideos();
  }

  stylesAndIcon = computed(() => {
    const type = verificationData[this.cardType()].id;

    switch (type) {
      case 'check': {
        const isVerified = this.userVerfied;
        const secondCase = isVerified && this.bankAdded;

        const bgClass = isVerified
          ? 'bg-common-secondary-blue-color'
          : 'bg-common-secondary-yellow-color';

        const textClass = isVerified
          ? 'text-common-blue-color'
          : 'text-common-yellow-color';

        const icon = isVerified ? faCheck : faLock;

        let buttonText = 'Get Approved';
        let bottonColor = 'var(--common-blue-color)';

        if (isVerified) {
          if (!secondCase) {
            buttonText = 'Continue';
          } else {
            buttonText = 'Make Payment';
            bottonColor = 'var(--common-green-color)';
          }
        }

        return {
          bgClass,
          textClass,
          icon,
          buttonText,
          bottonColor
        };
      }

      case 'card': {
        const isVerified = this.userVerfied && this.kycDone;
        const secondCase = isVerified && this.cardAdded;
        const bgClass = isVerified
          ? 'bg-common-secondary-green-color'
          : 'bg-common-secondary-yellow-color';

        const textClass = isVerified
          ? 'text-common-green-color'
          : 'text-common-yellow-color';

        const icon = isVerified ? faCheck : faLock;

        let buttonText = 'Activate Now';
        let bottonColor = 'var(--common-blue-color)';

        if (isVerified) {
          if (!secondCase) {
            buttonText = 'Continue';
          } else {
            buttonText = 'Make Payment';
            bottonColor = 'var(--common-green-color)';
          }
        }

        return {
          bgClass,
          textClass,
          icon,
          buttonText,
          bottonColor
        };
      }

      case 'payment': {
        const isVerified = this.userVerfied && this.kycDone && this.kybDone;
        const secondCase = isVerified && this.bankVerified;

        const bgClass = isVerified
          ? 'bg-common-violet-color'
          : 'bg-common-secondary-yellow-color';

        const textClass = isVerified
          ? 'text-common-violet-color'
          : 'text-common-yellow-color';

        const icon = isVerified ? faCheck : faLock;

        let buttonText = 'Get Approved';
        let bottonColor = 'var(--common-violet-color)';

        if (isVerified) {
          if (!secondCase) {
            buttonText = 'Continue';
          } else {
            buttonText = 'Make Payment';
            bottonColor = 'var(--common-green-color)';
          }
        }

        return {
          bgClass,
          textClass,
          icon,
          buttonText,
          bottonColor
        };
      }

      case 'demo': {
        return {
          bgClass: 'bg-common-secondary-blue-color',
          textClass: 'text-common-blue-color',
          icon: faStar,
          buttonText: 'Book a Free Demo',
          bottonColor: 'var(--common-blue-color)'
        };
      }

      default: {
        return {
          bgClass: true,
          textClass: true,
          icon: true,
          buttonText: '',
          bottonColor: ''
        };
      }
    }
  });

  onClickEvent(cardType: CardTypes): void {
    this.localStorageService.setItem('verificationStep', cardType);
    if (cardType !== 'demo') {
      this.router.navigateByUrl(`/manage/verification/steps`);
    }else {
      this.headerService.openDemoModal('home');
    }
  }

  getHelpVideos(): void {
    this.demoVideoService.loadDemoVideos();
    this.demoVideoService
      .getHelpVideos()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.helpVideosList = res as IDemoVideo;
        }
      });
  }

  getLink(videoSlug: string | undefined): string | undefined {
    if (!videoSlug) return undefined;
    if (!this.helpVideosList) return undefined;
    return videoSlug in this.helpVideosList
      ? this.helpVideosList[videoSlug as keyof IDemoVideo]
      : undefined;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
