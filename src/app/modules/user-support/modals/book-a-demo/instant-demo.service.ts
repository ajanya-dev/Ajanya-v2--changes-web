import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, merge } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { PusherService } from 'src/app/core/services/pusher.service';
import { environment } from 'src/environments/environment';

/** Live agent availability for the instant-demo widget. */
export interface IInstantDemoAvailability {
  available: boolean;
  agent_count: number;
}

/** Response to starting an instant-demo request. */
export interface IInstantDemoRequest {
  requestId: string;
  /** SEARCHING | RINGING | CONNECTED | NO_AGENTS | FAILED | ENDED | NO_SHOW */
  status: string;
  /** Only populated once status === 'CONNECTED'. */
  joinUrl: string | null;
}

/** Poll response for a pending instant-demo request. */
export interface IInstantDemoStatus {
  /** SEARCHING | RINGING | CONNECTED | NO_AGENTS | FAILED | ENDED | NO_SHOW */
  status: string;
  joinUrl: string | null;
}

/**
 * @description HTTP calls for the "Talk to someone now" instant-demo widget.
 * The three endpoints are public (no auth) and live under `outside/instant-demo/`.
 */
@Injectable({
  providedIn: 'root'
})
export class InstantDemoService {
  /**
   * The `outside/instant-demo/*` routes are public and live on the feature's
   * own backend host (from the integration guide's staging deploy for this
   * ticket) — NOT under the app's `/api/v4` prefix. Change this host per
   * environment when the feature is promoted past staging.
   */
  ROOT_URL = environment.rootUrl;
  OUTSIDE_ROOT_URL = environment.rootUrl.split('/api/v4')[0];
  private readonly base = `${this.OUTSIDE_ROOT_URL}/outside/instant-demo`;

  /**
   * `availability` (~5s) and `status` (~3s) are polled on an interval, so we
   * suppress the global progress bar (see InterceptorService's `isHideLoader`
   * handling). The widget shows its own spinner; the header bar must not flash
   * on every poll.
   */
  private readonly silentOptions = { headers: { isHideLoader: 'true' } };

  /**
   * Global availability channel — literal dotted event, bound exactly. Owned
   * here so every surface (book-a-demo modals, widget) shares one source of
   * truth instead of re-declaring the channel/event strings.
   */
  private readonly availabilityChannel = 'instant-demo.availability';
  private readonly availabilityEvent = 'availability.updated';

  constructor(
    private http: HttpClient,
    private pusher: PusherService
  ) {}

  /**
   * @description Fetches the current agent availability.
   */
  availability(): Observable<IInstantDemoAvailability> {
    return this.http.get<IInstantDemoAvailability>(
      `${this.base}/availability`,
      this.silentOptions
    );
  }

  /**
   * @description Live agent availability as a single stream: the initial HTTP
   * snapshot followed by realtime updates pushed on the global availability
   * channel. The channel is subscribed on subscribe and torn down on
   * unsubscribe, and a failed snapshot is swallowed so live updates still flow
   * (callers keep their "Talk now" button hidden until the first push).
   *
   * pusher-js fires outside Angular's zone, so subscribers must drive change
   * detection themselves (e.g. `ChangeDetectorRef.detectChanges()`).
   */
  watchAvailability(): Observable<IInstantDemoAvailability> {
    const snapshot = this.availability().pipe(catchError(() => EMPTY));

    const live = new Observable<IInstantDemoAvailability>((subscriber) => {
      const channel = this.pusher.subscribePusher(this.availabilityChannel);
      const handler = (data: IInstantDemoAvailability): void => {
        subscriber.next({
          available: !!data?.available,
          agent_count: data?.agent_count ?? 0
        });
      };
      channel.bind(this.availabilityEvent, handler);
      return () => {
        channel.unbind(this.availabilityEvent, handler);
        this.pusher.unsubscribePusher(this.availabilityChannel);
      };
    });

    return merge(snapshot, live);
  }

  /**
   * @description Starts an instant-demo request for the logged-in user.
   * param {string | number} userId - The current user's id (from localStorage).
   */
  request(userId: string | number,domain:string): Observable<IInstantDemoRequest> {
    return this.http.post<IInstantDemoRequest>(
      `${this.base}/request`,
      { userId,domain },
      this.silentOptions
    );
  }

  /**
   * @description Polls the status of a pending request (fallback for a dropped
   * websocket).
   * @param {string} requestId - The id returned by `request`.
   */
  status(requestId: string): Observable<IInstantDemoStatus> {
    return this.http.get<IInstantDemoStatus>(
      `${this.base}/status/${encodeURIComponent(requestId)}`,
      this.silentOptions
    );
  }

  /** Fire-and-forget notification POST (`/joined`, `/cancel`) — response ignored. */
  private notify(action: 'joined' | 'cancel', requestId: string): void {
    this.http
      .post(`${this.base}/${action}`, { requestId }, this.silentOptions)
      .pipe(take(1))
      .subscribe();
  }

  joiningDemo(requestId: string): void {
    this.notify('joined', requestId);
  }

  cancelDemo(requestId: string): void {
    this.notify('cancel', requestId);
  }
}
