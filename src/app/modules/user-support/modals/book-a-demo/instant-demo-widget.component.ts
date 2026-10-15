import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faHeadset,
  faSpinner,
  faVideo,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { Channel } from 'pusher-js';
import { Subscription, take } from 'rxjs';
import { PusherService } from 'src/app/core/services/pusher.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Router } from '@angular/router';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { environment } from 'src/environments/environment';
import {
  IInstantDemoAvailability,
  InstantDemoService
} from './instant-demo.service';

/** The screen the widget is currently showing. */
type InstantDemoPanel =
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'connecting'
  | 'ready'
  | 'noagents'
  | 'error';

/** Global availability channel — literal dotted event, bound exactly. */
const AVAILABILITY_CHANNEL = 'instant-demo.availability';
const AVAILABILITY_EVENT = 'availability.updated';

/** Per-request channel is scoped by requestId; events are literal dotted. */
const requestChannel = (requestId: string): string =>
  `instant-demo.request.${requestId}`;
const AGENT_FOUND_EVENT = 'agent.found';
const NO_AGENTS_EVENT = 'no.agents';

/**
 * @description The "Talk to someone now" instant-demo widget.
 *
 * Realtime is served by the app-wide {@link PusherService} (single client,
 * environment key/cluster) — mirroring how `header-v35` subscribes: bind the
 * literal event on the channel and call `detectChanges()` from the callback,
 * since pusher-js fires outside Angular's zone. Every websocket path has a
 * polling fallback so a dropped socket still moves the visitor forward.
 */
@Component({
  selector: 'app-instant-demo-widget',
  templateUrl: './instant-demo-widget.component.html',
  styleUrls: ['./instant-demo-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstantDemoWidgetComponent implements OnInit, OnDestroy {
  panel: InstantDemoPanel = 'checking';
  agentCount = 0;
  connectingText = 'Finding someone to join you…';
  errorText = '';
  agentName = '';
  joinUrl: string | null = null;
  /** Seconds left on the countdown shown inside the "Join" button. */
  joinCountdown = 0;

  faXmark = faXmark;
  faSpinner = faSpinner;
  faHeadset = faHeadset;
  faVideo = faVideo;
  faCircleCheck = faCircleCheck;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  private api = inject(InstantDemoService);
  private pusherService = inject(PusherService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private clickTrackingService = inject(ClickTrackingService);
  private dialogRef = inject(MatDialogRef, { optional: true });
  private dialogData = inject<{ autoStart?: boolean } | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  /** Poll fallbacks — websocket is the fast path, these cover a dead socket. */
  // private readonly availabilityPollMs = 5000;
  private readonly statusPollMs = 3000;

  private subscriptions: Subscription[] = [];
  /** Names of the Pusher channels we've subscribed to, for teardown. */
  private pusherChannels: string[] = [];
  private availabilityTimer?: ReturnType<typeof setInterval>;
  private statusTimer?: ReturnType<typeof setInterval>;

  /** Guards the single-shot handoff to the "ready" screen (socket vs. poll race). */
  private navigated = false;
  private currentJoinUrl: string | null = null;
  /** Id of the in-flight request — needed to ping `/joined`. */
  private currentRequestId: string | null = null;
  private destroyed = false;

  /** How long the "Join" button counts down before we auto-ping `/joined`. */
  private readonly joinCountdownSeconds = 20;
  private joinTimer?: ReturnType<typeof setInterval>;
  /** `/joined` is pinged at most once (countdown expiry or an early click). */
  private joinedPinged = false;

  /** Skin selector — the same widget renders V3 or V4 tokens off this flag. */
  isV4 =
    this.router.url.startsWith('/v4/') ||
    this.localStorageService.getItem('isV4LayoutEnabled') === 1;

  ngOnInit(): void {
    if (this.dialogData?.autoStart) {
      this.startDemo();
      return;
    }
    this.checkAvailability();
    this.listenForAvailability();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearInterval(this.availabilityTimer);
    this.stopStatusPoll();
    this.stopJoinCountdown();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.pusherChannels.forEach((channel) =>
      this.pusherService.unsubscribePusher(channel)
    );
    this.pusherChannels = [];
  }

  /**
   * @description Starts the request for the logged-in user (id from
   * localStorage). On `NO_AGENTS` we skip straight to the booking screen;
   * otherwise we show the connecting screen and arm both the websocket fast
   * path and the poll fallback.
   */
  startDemo(): void {
    const userId = String(this.localStorageService.getItem('userId'));
    this.panel = 'connecting';
    this.connectingText = 'Finding someone to join you…';
    this.refresh();
    const domain = environment.env_id === 'zilMoney' ? 'zilmoney' : 'ocw';
    this.subscriptions.push(
      this.api
        .request(userId,domain)
        .subscribe({
          next: (res) => {
            if (res.status === 'NO_AGENTS') {
              this.showNoAgents();
              return;
            }
            this.currentRequestId = res.requestId;
            this.currentJoinUrl = res.joinUrl;
            this.listenForRequest(res.requestId); // fast path (websocket)
            this.startStatusPoll(res.requestId); // fallback (poll)
          },
          error: () => this.fail('Could not start the demo. Please try again.')
        })
    );
  }

  /**
   * @description Resets the widget back to the start (from the error screen).
   */
  startAgain(): void {
    this.navigated = false;
    this.currentJoinUrl = null;
    this.currentRequestId = null;
    this.joinUrl = null;
    this.agentName = '';
    this.joinedPinged = false;
    this.joinCountdown = 0;
    this.stopJoinCountdown();
    this.panel = 'checking';
    this.checkAvailability();
  }

  /**
   * @description Hands off to the existing Book-a-Demo / Calendly flow, then
   * closes this widget if it was opened as a dialog.
   */
  bookDemoPage(): void {

    this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    let path: string = '';

    let { origin } = window;

    origin = origin.replace('https://', '');

    path = this.router.url;

    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    window.open(
      `https://calendly.com/zmn/demo?utm_source=${origin}&utm_campaign=${path}`
    );

    this.dialogRef?.close();
  }

  /**
   * @description Closes the widget when opened as a dialog.
   */
  close(): void {
    this.dialogRef?.close();
    if(this.panel === 'ready' && this.currentRequestId){
      this.api.cancelDemo(this.currentRequestId);
    }
  }

  // ── availability ───────────────────────────────────────────────────────────

  private checkAvailability(): void {
    if (this.panel === 'connecting' || this.panel === 'noagents') {
      return;
    }
    this.subscriptions.push(
      this.api.availability().subscribe({
        next: (res) => this.applyAvailability(res.available, res.agent_count),
        error: () => this.fail('Could not reach the demo service.')
      })
    );
  }

  private listenForAvailability(): void {
    const channel: Channel =
      this.pusherService.subscribePusher(AVAILABILITY_CHANNEL);
    channel.bind(AVAILABILITY_EVENT, (data: IInstantDemoAvailability) => {      
      this.applyAvailability(!!data?.available, data?.agent_count ?? 0);
    });
    this.pusherChannels.push(AVAILABILITY_CHANNEL);
  }

  private applyAvailability(available: boolean, count: number): void {
    if (this.panel === 'connecting' || this.panel === 'noagents') {
      return;
    }
    this.agentCount = count || 0;
    this.panel = available ? 'available' : 'unavailable';
    this.refresh();
  }

  // ── per-request websocket (agent.found / no.agents) ─────────────────────────

  private listenForRequest(requestId: string): void {
    const name = requestChannel(requestId);
    const channel: Channel = this.pusherService.subscribePusher(name);
    channel.bind(AGENT_FOUND_EVENT, (data: { agentName?: string }) => {
      this.agentName = data?.agentName || 'An expert';
      this.agentAccepted(null); // the widget already holds the joinUrl
    });
    channel.bind(NO_AGENTS_EVENT, () => this.showNoAgents());
    this.pusherChannels.push(name);
  }

  // ── status poll fallback ────────────────────────────────────────────────────

  private startStatusPoll(requestId: string): void {
    this.stopStatusPoll();
    this.statusTimer = setInterval(() => {
      this.subscriptions.push(
        this.api.status(requestId).subscribe({
          next: (res) => {
            if (res.status === 'CONNECTED') {
              this.agentAccepted(res.joinUrl);
            } else if (res.status === 'NO_AGENTS' || res.status === 'FAILED') {
              this.showNoAgents();
            }
          },
          error: () => {
            /* transient network blip — keep polling */
          }
        })
      );
    }, this.statusPollMs);
  }

  private stopStatusPoll(): void {
    clearInterval(this.statusTimer);
    this.statusTimer = undefined;
  }

  // ── handoff into the room (gesture-driven, popup-blocker safe) ───────────────

  /**
   * @description The expert has accepted. We do NOT auto-open the room here —
   * that call would run inside a websocket/poll callback with no user gesture
   * and get eaten by the popup blocker. Instead we land on the "ready" screen
   * and let the visitor click {@link joinRoom}. Both the socket event and the
   * poll can reach this; only the first wins.
   */
  private agentAccepted(joinUrl: string | null): void {
    const url = joinUrl || this.currentJoinUrl;
    if (this.navigated || !url) {
      return;
    }
    this.navigated = true;
    this.joinUrl = url;
    this.stopStatusPoll();
    this.panel = 'ready';
    this.startJoinCountdown();
    this.refresh();
  }

  /**
   * @description Opens the meeting room. Called from a real click, so the
   * browser treats it as a user gesture and won't block the new tab. Pings
   * `/joined` first so the backend doesn't no-show us — see {@link notifyJoined}.
   */
  joinRoom(): void {
    if (!this.joinUrl) {
      return;
    }
    this.stopJoinCountdown();
    // Open the room on the user gesture first, then ping /joined and close.
    window.open(this.joinUrl, '_blank', 'noopener');
    this.notifyJoined();
  }

  /**
   * Runs the 20s countdown shown inside the "Join" button once the room is
   * ready. Visitors are often slow to click Join, so if the countdown reaches
   * zero we ping `/joined` ourselves — that's what stops the backend from
   * no-showing a demo the visitor actually intends to join.
   */
  private startJoinCountdown(): void {
    this.stopJoinCountdown();
    this.joinCountdown = this.joinCountdownSeconds;
    this.joinTimer = setInterval(() => {
      this.joinCountdown -= 1;
      if (this.joinCountdown <= 0) {
        this.joinCountdown = 0;
        this.stopJoinCountdown();
        this.cancelJoining(true);
      }
      this.refresh();
    }, 1000);
  }

  private stopJoinCountdown(): void {
    clearInterval(this.joinTimer);
    this.joinTimer = undefined;
  }

  private notifyJoined(): void {
    if (this.joinedPinged || !this.currentRequestId) {
      return;
    }
    this.joinedPinged = true;
    this.api.joiningDemo(this.currentRequestId);
    this.dialogRef?.close();
  }

  private cancelJoining(fromTimer = false): void {
    if (this.joinedPinged || !this.currentRequestId) {
      return;
    }
    this.joinedPinged = true;
    this.api.cancelDemo(this.currentRequestId);
    this.dialogRef?.close(fromTimer);
  }

  private showNoAgents(): void {
    this.stopStatusPoll();
    this.panel = 'noagents';
    this.refresh();
  }

  private fail(message: string): void {
    this.errorText = message;
    this.panel = 'error';
    this.refresh();
  }

  /**
   * Repaints the OnPush view after an async state change. pusher-js callbacks
   * fire outside Angular's zone, so — like `header-v35` — we drive change
   * detection manually. Guarded so a late poll/socket callback can't paint a
   * destroyed view.
   */
  private refresh(): void {
    if (!this.destroyed) {
      this.changeDetectorRef.detectChanges();
    }
  }
}
