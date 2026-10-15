import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  Optional,
  inject
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription, finalize, take } from 'rxjs';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Router } from '@angular/router';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import {
  faCalendarCheck,
  faFaceSmile,
  faTableCells,
  faPercent,
  faUsers,
  faPaperPlane,
  faPrint,
  faBolt,
  faCreditCard
} from '@fortawesome/pro-regular-svg-icons';
import { faVideo } from '@fortawesome/pro-solid-svg-icons';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { InstantDemoService } from './instant-demo.service';

@Component({
  selector: 'app-book-a-demo',
  templateUrl: './book-a-demo.component.html',
  styleUrls: ['./book-a-demo.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CommonButtonV35Component,
    AngularMaterialModule,
    FontAwesomeModule,
    WhiteLabelDirective,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookADemoComponent implements OnInit, OnDestroy {
  @Optional() dialogData: { page: string; hideNotShowDemoBtn: number } =
    inject(MAT_DIALOG_DATA);

  private userSupportService = inject(UserSupportService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef);
  private clickTrackingService = inject(ClickTrackingService);
  private instantDemoService = inject(InstantDemoService);
  private headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);

  subscription: Subscription[] = [];
  private destroyed = false;
  isLoading = false;
  faCalendarCheck = faCalendarCheck;
  faVideo = faVideo;
  faFaceSmile = faFaceSmile;
  faTableCells = faTableCells;
  faPercent = faPercent;
  faUsers = faUsers;
  faPaperPlane = faPaperPlane;
  faPrint = faPrint;
  faBolt = faBolt;
  faCreditCard = faCreditCard;

  /** An expert is online for an instant demo — reveals the "Talk now" button. */
  instantAvailable = false;
  instantAgentCount = 0;
  /** No expert turned up within {@link availabilityTimeoutMs} — swap the spinner for a retry. */
  instantCheckTimedOut = false;

  /** How long the "Checking who's online…" spinner may run before we give up. */
  private readonly availabilityTimeoutMs = 30000;
  private availabilityTimeoutTimer?: ReturnType<typeof setTimeout>;

  demoOptionsLeft: { text: string; icon: string }[] = [
    { text: 'We want to make your life easier!', icon: 'left-pointer-1.svg' },
    {
      text: 'Explore thousands of features customized for your business needs.',
      icon: 'left-pointer-2.svg'
    },
    {
      text: 'We demand nothing less than 100% satisfaction!',
      icon: 'left-pointer-3.svg'
    },
    {
      text: 'Join over 1 million users on our platform.',
      icon: 'left-pointer-4.svg'
    },
    {
      text: 'All the ways you need to send or receive payments.',
      icon: 'left-pointer-5.svg'
    }
  ];

  demoOptionsRight: { text: string; icon: string }[] = [
    {
      text: 'Instant online check printing by yourself, or mail it via USPS/FedEx.',
      icon: 'right-pointer-1.svg'
    },
    {
      text: 'Same Day ACH (Push or Pull), RTP, Wire (Online) and more',
      icon: 'right-pointer-2.svg'
    },
    {
      text: 'Short on cash? Make payments, run payroll and taxes using your credit card balance.',
      icon: 'right-pointer-3.svg'
    }
  ];

  ngOnInit(): void {
    this.startAvailabilityTimeout();
    this.watchInstantAvailability();
  }

  /**
   * @description Reveals the "Talk to someone now" button while an expert is
   * online. The service streams the initial snapshot and any realtime pusher
   * updates as one subscription (a failed snapshot simply keeps the button
   * hidden). pusher-js fires outside Angular's zone, so we drive change
   * detection manually, guarded so a late push can't paint a destroyed modal.
   */
  private watchInstantAvailability(): void {
    this.subscription.push(
      this.instantDemoService.watchAvailability().subscribe((res) => {
        this.instantAvailable = !!res.available;
        this.instantAgentCount = res.agent_count || 0;
        if (this.instantAvailable) {
          this.stopAvailabilityTimeout();
        }
        if (!this.destroyed) {
          this.cdr.detectChanges();
        }
      })
    );
  }

  /**
   * @description Caps how long the "Checking who's online…" spinner may run.
   * Nobody online is a normal answer, so the stream can legitimately never
   * report an expert — after the cap we stop spinning and offer a re-check
   * instead of implying the check is still in flight.
   */
  private startAvailabilityTimeout(): void {
    clearTimeout(this.availabilityTimeoutTimer);
    this.instantCheckTimedOut = false;
    this.availabilityTimeoutTimer = setTimeout(() => {
      this.instantCheckTimedOut = !this.instantAvailable;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }, this.availabilityTimeoutMs);
  }

  private stopAvailabilityTimeout(): void {
    clearTimeout(this.availabilityTimeoutTimer);
    this.availabilityTimeoutTimer = undefined;
    this.instantCheckTimedOut = false;
  }

  /**
   * @description Re-checks availability from the timed-out state. The pusher
   * subscription from {@link watchInstantAvailability} is still live, so this
   * only needs a fresh snapshot plus a new timeout window.
   */
  checkAvailabilityAgain(): void {
    this.startAvailabilityTimeout();
    this.subscription.push(
      this.instantDemoService.availability().subscribe({
        next: (res) => {
          this.instantAvailable = !!res.available;
          this.instantAgentCount = res.agent_count || 0;
          if (this.instantAvailable) {
            this.stopAvailabilityTimeout();
          }
          if (!this.destroyed) {
            this.cdr.detectChanges();
          }
        },
        error: () => {
          /* keep the spinner running until the timeout window closes */
        }
      })
    );
  }

  /**
   * @description Closes this modal and hands off to the instant-demo widget,
   * telling it to connect straight away since availability is already known.
   * Routed through the header service so the widget takes this modal's place in
   * the modal queue — nothing else pops on top of it.
   */
  talkToExpert(): void {
    this.headerService.openInstantDemoFromBookDemo(false);
    this.dialogRef.close();
  }

  /**
   * Opens a new window to the Calendly booking page with specific UTM parameters
   * and closes the current dialog.
   *
   * This method constructs a URL with UTM parameters based on the current router URL
   * and the window origin, then opens this URL in a new browser window.
   */
  bookDemoPage(): void {
    // Track when clicked on book a demo.
    this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    let path: string = '';

    // Get the current origin from the window object
    let { origin } = window;

    // Remove the protocol (https://) from the origin
    origin = origin.replace('https://', '');

    path = this.router.url;

    // Remove the leading slash from the path if it exists
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    if (this.dialogData?.page === 'home') {
      path = 'interstitial'; // Used to indicate that a demo booking modal opens after logging in or signing up.
    }

    // Construct the Calendly URL with UTM parameters and open it in a new window
    window.open(
      `https://calendly.com/zmn/demo?utm_source=${origin}&utm_campaign=${path}`
    );

    this.dialogRef.close(true);
  }

  /**
   * @description Used to block demo modal.
   */
  blockDemo() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.subscription.push(
      this.userSupportService
        .onBlockDemo()
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        })
    );
  }

  /**
   * @description Close modal.
   */
  close() {
    this.localStorageService.setItem('isShowDemo', '2');
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.availabilityTimeoutTimer);
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
