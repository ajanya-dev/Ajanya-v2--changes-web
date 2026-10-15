import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  Optional,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  Calendar,
  X,
  Printer,
  CreditCard,
  Wallet,
  Check,
  Video
} from 'lucide-angular';
import { Subscription, take } from 'rxjs';
import { Router } from '@angular/router';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { faCalendarCheck } from '@fortawesome/pro-regular-svg-icons';
import { InstantDemoService } from '../../book-a-demo/instant-demo.service';

@Component({
  selector: 'app-book-a-demo-modal-v4',
  templateUrl: './book-a-demo-modal-v4.component.html',
  styleUrls: ['./book-a-demo-modal-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BookADemoModalV4Component implements OnInit, OnDestroy {
  @Optional() dialogData: { page: string; hideNotShowDemoBtn: number } =
    inject(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<BookADemoModalV4Component>);
  private router = inject(Router);
  private clickTrackingService = inject(ClickTrackingService);
  private localStorageService = inject(LocalStorageService);
  private instantDemoService = inject(InstantDemoService);
  private headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);

  // Lucide icons
  readonly CalendarIcon = Calendar;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly VideoIcon = Video;

  // FontAwesome icons (for CommonButtonV4Component)
  readonly faCalendarCheck = faCalendarCheck;
  readonly PrinterIcon = Printer;
  readonly CreditCardIcon = CreditCard;
  readonly WalletIcon = Wallet;

  /** An expert is online for an instant demo — reveals the "Talk now" button. */
  instantAvailable = false;
  instantAgentCount = 0;
  /** No expert turned up within {@link availabilityTimeoutMs} — swap the spinner for a retry. */
  instantCheckTimedOut = false;

  /** How long the "Checking who's online…" spinner may run before we give up. */
  private readonly availabilityTimeoutMs = 30000;
  private availabilityTimeoutTimer?: ReturnType<typeof setTimeout>;

  subscription: Subscription[] = [];
  private destroyed = false;

  readonly demoOptionsLeft: { segments: { text: string; bold?: boolean }[] }[] =
    [
      {
        segments: [
          { text: 'We want to make your life easier.', bold: true }
        ]
      },
      {
        segments: [
          { text: 'Explore ' },
          { text: 'thousands of features', bold: true },
          { text: ' customized for your business needs.' }
        ]
      },
      {
        segments: [
          { text: 'We demand nothing less than ' },
          { text: '100% satisfaction', bold: true },
          { text: '.' }
        ]
      },
      {
        segments: [
          { text: 'Join ' },
          { text: 'over 1 million users', bold: true },
          { text: ' on our platform.' }
        ]
      },
      {
        segments: [
          { text: 'All the ways you need to ' },
          { text: 'send or receive payments', bold: true },
          { text: '.' }
        ]
      }
    ];

  readonly demoOptionsRight: {
    segments: { text: string; bold?: boolean }[];
    icon: unknown;
  }[] = [
    {
      segments: [
        { text: 'Instant ' },
        { text: 'online check printing', bold: true },
        { text: ' by yourself, or mail it via ' },
        { text: 'USPS/FedEx', bold: true },
        { text: '.' }
      ],
      icon: Printer
    },
    {
      segments: [
        { text: 'Same Day ACH', bold: true },
        { text: ' (Push or Pull), ' },
        { text: 'RTP', bold: true },
        { text: ', ' },
        { text: 'Wire', bold: true },
        { text: ' (Online) and more.' }
      ],
      icon: CreditCard
    },
    {
      segments: [
        { text: 'Short on cash? ' },
        { text: 'Make payments, run payroll and taxes', bold: true },
        { text: ' using your credit card balance.' }
      ],
      icon: Wallet
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
    this.headerService.openInstantDemoFromBookDemo(true);
    this.dialogRef.close();
  }

  bookDemoPage(): void {
    this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    let path: string = '';
    let { origin } = window;
    origin = origin.replace('https://', '');
    path = this.router.url;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    if (this.dialogData?.page === 'home') {
      path = 'interstitial';
    }
    window.open(
      `https://calendly.com/zmn/demo?utm_source=${origin}&utm_campaign=${path}`
    );
    this.dialogRef.close(true);
  }

  close(): void {
    this.localStorageService.setItem('isShowDemo', '2');
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.availabilityTimeoutTimer);
    this.subscription.forEach((sub) => sub.unsubscribe());
  }
}
