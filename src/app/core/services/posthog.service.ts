import { Injectable, inject, ErrorHandler } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IUserVerification } from 'src/app/models/user';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { IFirstTouchAttribution } from 'src/app/core/services/attribution.service';
import { POSTHOG_APP_EVENTS } from 'src/app/data/scripts/posthog-events';

/** Customer contact fields carried by the auth/onboarding events. */
export interface ICustomerEventPayload {
  customer_name: string;
  customer_id: string;
  company_id: string;
  company_name: string;
  email: string;
  phone: string;
}

/**
 * The approved `register_success` event contract. Optional fields are omitted
 * when unavailable rather than sent blank, so the type makes the difference
 * between "required" and "send when known" explicit at the call site.
 */
export interface IRegisterSuccessPayload {
  /** ISO-8601 UTC, taken when the backend confirmed the account. */
  registered_at: string;
  user_id: string;
  company_id?: string;
  email?: string;
  /** Allowlisted landing property, not the OCW/ZM build identifier. */
  site_identifier?: string;
  gclid?: string;
  /** The Meta click id, sent on the same terms as `gclid`: only when the
   * landing URL carried one. */
  fbclid?: string;
  utm_source?: string;
  utm_campaign?: string;
  referrer?: string;
  landing_page?: string;
  /** SHA of the lowercased email, for matching against ad-platform audiences
   * without sending the address itself. Omitted when the hash could not be
   * computed — crypto.subtle is absent on non-secure origins. */
  email_hash?: string;
}

/**
 * The approved `user_login` event contract: these four keys and nothing else.
 * Anything else about the user belongs on the person profile, not the event.
 */
export interface IUserLoginPayload {
  /** 'OCW' or 'ZM', from the build. */
  site_identifier: string;
  is_first_login: boolean;
  /** ISO-8601 UTC of this login. */
  timestamp: string;
  /** ISO-8601 UTC of the previous login; equals `timestamp` on a first login. */
  last_login_at: string;
}

/** Minimal typing of the PostHog browser SDK surface this app uses. */
interface PostHogInstance {
  __loaded?: boolean;
  identify(
    distinctId: string,
    userProperties?: Record<string, any>,
    userPropertiesToSetOnce?: Record<string, unknown>
  ): void;
  capture(eventName: string, properties?: Record<string, any>): void;
  register(properties: Record<string, unknown>): void;
  unregister(property: string): void;
  get_property?(key: string): unknown;
  reset(resetDeviceId?: boolean): void;
  get_distinct_id(): string;
  _isIdentified?(): boolean;
  opt_in_capturing?(): void;
  opt_out_capturing?(): void;
  has_opted_out_capturing?(): boolean;
}

declare global {
  interface Window {
    posthog: PostHogInstance;
  }
}

/** User identification and event tracking. The SDK loader lives in ScriptService. */
@Injectable({
  providedIn: 'root'
})
export class PostHogService {
  private errorHandler = inject(ErrorHandler);
  private localStorageService = inject(LocalStorageService);


  /** Matches the readiness budget ScriptService allows MoEngage. */
  private readonly READY_TIMEOUT_MS = 10000;

  private readonly READY_POLL_MS = 100;

  /** Cached so the poll runs once, however many callers ask. */
  private readyPromise: Promise<boolean> | undefined;

  /**
   * Super properties older builds registered at signup. The SDK persists super
   * properties in the browser and stamps them on every event until they are
   * unregistered, so they kept reaching events long after the code stopped
   * sending them. `referral_code` is not listed: it is still registered on
   * purpose.
   */
  private readonly STALE_SUPER_PROPERTY_KEYS: string[] = [
    'registration_method',
    'is_integration_signup'
  ];

  /**
   * Drops the stale super properties from browser storage. Call once the loader
   * snippet has run: the stub queues unregister() and replays it after the SDK
   * restores its storage, so this works before posthog-js has loaded.
   * @returns {void}
   */
  clearStaleSuperProperties(): void {
    if (!this.isTrackingAllowed()) {
      return;
    }

    const instance = this.getPostHogInstance();
    if (!instance) {
      return;
    }

    try {
      this.STALE_SUPER_PROPERTY_KEYS.forEach((key) => instance.unregister(key));
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`PostHogService: Error unregistering stale super properties - ${error}`)
      );
    }
  }

  /**
   * True once the real SDK has replaced the loader stub.
   * @returns {boolean} Whether posthog-js has finished initialising.
   * @private
   */
  private isSdkLoaded(): boolean {
    // eslint-disable-next-line no-underscore-dangle
    return !!this.getPostHogInstance()?.__loaded;
  }

  /**
   * Resolves once the real SDK has replaced the loader stub. Only identify()
   * needs this: it reads SDK state before deciding whether to reset(), and the
   * stub answers `get_distinct_id()` with undefined and has no `_isIdentified`
   * at all. capture() and setPersonProperties() are safe without it because the
   * stub queues those calls and replays them on load.
   * @returns {Promise<boolean>} True once loaded, false if it never loads.
   */
  private whenPostHogReady(): Promise<boolean> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    if (this.isSdkLoaded()) {
      this.readyPromise = Promise.resolve(true);
      return this.readyPromise;
    }

    this.readyPromise = new Promise<boolean>((resolve) => {
      const startedAt = Date.now();
      const poll = (): void => {
        if (this.isSdkLoaded()) {
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= this.READY_TIMEOUT_MS) {
          // Drop the cached miss so a later load is not locked out forever.
          this.readyPromise = undefined;
          resolve(false);
          return;
        }
        setTimeout(poll, this.READY_POLL_MS);
      };
      poll();
    });

    return this.readyPromise;
  }

  /**
   * Which product this build serves, read from the build's environment file
   * exactly as MoEngageService does. `site_identifier` derives from it.
   */
  private readonly isZilMoney = environment.env_id === 'zilMoney';

  /**
   * The customer id exactly as the app holds it — the product is already told
   * apart by `site_identifier`, so the id is not namespaced here.
   * @param id - The raw customer id.
   * @returns {string} The id as a trimmed string, '' when blank.
   */
  private customerId(id: string | number | null | undefined): string {
    return String(id ?? '').trim();
  }

  /** The super properties this app registers, so both sides agree on the list. */
  private readonly SIGNUP_ATTRIBUTION_KEYS = ['referral_code'];

  /**
   * Registers signup attribution as PostHog super properties. The SDK persists
   * these in its own storage and stamps them on every subsequent event by
   * itself, so nothing has to be threaded through call sites — and reset() on
   * logout clears them, which stops one signup's attribution reaching the next
   * user of a shared browser.
   * @param attribution - Values known only at signup.
   * @returns {void}
   */
  registerSignupAttribution(attribution: {
    referral_code: string | null;
  }): void {
    if (!this.isTrackingAllowed()) {
      return;
    }

    const instance = this.getPostHogInstance();
    if (!instance) {
      return;
    }

    try {
      // Registered as a super property, so the SDK stamps it on every later
      // event by itself. Omitted rather than null, so "no referral" reads as
      // absent — and with nothing to register the call does nothing at all.
      if (!attribution.referral_code) {
        return;
      }

      instance.register({ referral_code: attribution.referral_code });
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`PostHogService: Error registering super properties - ${error}`)
      );
    }
  }

  /**
   * Reads the registered attribution back. Super properties reach events on
   * their own but not person profiles, so capture() folds them into the `$set`
   * of any event that writes to the profile. Safe to call unguarded: it is read
   * inside send(), once the real SDK has loaded.
   * @returns {Record<string, unknown>} Whatever attribution is registered.
   */
  private signupAttribution(): Record<string, unknown> {
    const instance = this.getPostHogInstance();
    if (!instance?.get_property) {
      return {};
    }

    return this.SIGNUP_ATTRIBUTION_KEYS.reduce<Record<string, unknown>>(
      (carried, key) => {
        const value = instance.get_property?.(key);
        return value === undefined || value === null
          ? carried
          : { ...carried, [key]: value };
      },
      {}
    );
  }

  /**
   * Properties stamped on every captured event. The customer block is included
   * here rather than left to each call site, so no event can ship without the
   * identity fields. An event that knows better — the auth events, which read
   * the verification stream — spreads its own block afterwards and wins, since
   * capture() merges the caller's properties over these.
   */
  private getCommonTrackingProperties():
    | (ICustomerEventPayload & {
        ts: string;
        site_identifier: string;
        platform: string;
      })
    | null {
    // Still gated on a stored user, so an event with nobody behind it is
    // dropped rather than sent against an anonymous distinct id.
    const userId =
      this.localStorageService.getItem('parentUserId') ||
      this.localStorageService.getItem('userId');
    if (!userId) {
      return null;
    }

    return {
      ...this.customerPayloadFromStorage(),
      ts: new Date().toISOString(),
      site_identifier: this.isZilMoney ? 'ZM' : 'OCW',
      platform: 'web'
    };
  }

  /**
   * Strips blank values before they reach a person profile. PostHog treats an
   * empty string as a real value and overwrites what is already stored, while
   * an omitted property leaves it untouched — so a blank phone must never be
   * sent. Only for profile writes: events are immutable snapshots, and some
   * event payloads deliberately carry null.
   * @param attributes - Raw properties from the caller.
   * @returns {Record<string, unknown>} The properties worth sending.
   * @private
   */
  private dropBlankProperties(
    attributes: Record<string, unknown>
  ): Record<string, unknown> {
    const kept: Record<string, unknown> = {};

    Object.entries(attributes).forEach(([name, value]) => {
      if (!name) {
        return;
      }
      if (value !== undefined && value !== null && value !== '') {
        kept[name] = value;
      }
    });

    return kept;
  }

  /**
   * Whether to print each outgoing payload to the console. On for any
   * non-production build, and switchable on a deployed one with
   * `localStorage.setItem('phDebug', '1')` — so a payload can be confirmed in a
   * real session without shipping console noise to every user. Read straight
   * off window.localStorage rather than LocalStorageService, so the switch does
   * not depend on the app's own storage wrapper.
   * @returns {boolean} Whether payload logging is on.
   * @private
   */
  private isDebugLoggingOn(): boolean {
    if (!environment.production) {
      return true;
    }

    try {
      return window.localStorage.getItem('phDebug') === '1';
    } catch {
      return false;
    }
  }

  /**
   * Whether a Super Admin is driving this session through "Log into Live".
   * The URL is checked as well as storage, because addPostHogScript() runs
   * before authGuard has stored the marker.
   * @returns {boolean} Whether this is an agent session.
   */
  isAdminImpersonationSession(): boolean {
    if (this.localStorageService.getItem('ocw-admin')) {
      return true;
    }

    try {
      if (typeof window === 'undefined') {
        return false;
      }
      const marker = /[?&]ocw-admin=/;
      return (
        marker.test(window.location.search) || marker.test(window.location.hash)
      );
    } catch {
      return false;
    }
  }

  /**
   * @returns {boolean} Whether this session may send to PostHog.
   * @private
   */
  private isTrackingAllowed(): boolean {
    return (
      !!environment?.ocw_trackers?.postHog?.enabled &&
      !this.isAdminImpersonationSession()
    );
  }

  /**
   * Opts out and unlinks the identified customer when a running SDK turns into
   * an agent session. Called from authGuard.
   * @returns {void}
   */
  stopForAdminSession(): void {
    const instance = this.getPostHogInstance();
    if (!instance) {
      return;
    }

    try {
      instance.opt_out_capturing?.();
      instance.reset();
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`PostHogService: Error opting out for admin session - ${error}`)
      );
    }
  }

  /**
   * Re-enables capture on a normal customer login, since the SDK persists the
   * opt-out across sessions.
   * @returns {void}
   */
  resumeForCustomerSession(): void {
    if (!this.isTrackingAllowed()) {
      return;
    }

    const instance = this.getPostHogInstance();
    if (!instance?.has_opted_out_capturing?.()) {
      return;
    }

    try {
      instance.opt_in_capturing?.();
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`PostHogService: Error opting back in - ${error}`)
      );
    }
  }

  /**
   * @param {string} eventName - PostHog event name.
   * @returns {boolean} Whether the event is enabled in POSTHOG_APP_EVENTS.
   * @private
   */
  private isEventEnabled(eventName: string): boolean {
    return !!eventName && POSTHOG_APP_EVENTS.includes(eventName);
  }

  private isPostHogReady(): boolean {
    return typeof window !== 'undefined' && typeof window.posthog !== 'undefined';
  }

  private getPostHogInstance(): PostHogInstance | null {
    return this.isPostHogReady() ? window.posthog : null;
  }

  /**
   * Binds the SDK to this user. Runs straight away once the SDK is loaded;
   * before that it waits, because the merge check below cannot read the stub's
   * state and would silently skip the reset().
   *
   * The `$identify` event this produces never leaves the browser — `before_send`
   * drops it, so the project sees only the app's own events. What survives is
   * the part that matters: the distinct id becomes `userId` and the SDK marks
   * the session identified, which is the precondition for
   * `person_profiles: 'identified_only'` attributing any later event to a
   * person.
   *
   * It takes no person properties, and deliberately so: anything passed here
   * would go out on the `$identify` event and be dropped with it. Profile
   * updates belong on the event that knows them, as `$set` / `$set_once`.
   * @param {string} userId - The user to bind this session to.
   * @returns {void}
   */
  identify(userId: string): void {
    if (!this.isTrackingAllowed() || !userId) {
      return;
    }

    if (this.isSdkLoaded()) {
      this.applyIdentity(userId);
      return;
    }

    // Best effort on timeout: a queued identify still beats none at all.
    this.whenPostHogReady().then(() => this.applyIdentity(userId));
  }

  /**
   * @param {string} userId - The user to identify against.
   * @returns {void}
   * @private
   */
  private applyIdentity(userId: string): void {
    const instance = this.getPostHogInstance();
    if (!instance) {
      return;
    }

    try {
      const existingId = instance.get_distinct_id();
      const alreadyIdentified = instance._isIdentified?.() ?? false;

      // Unlink a different person first: a merged profile cannot be undone.
      if (
        alreadyIdentified &&
        existingId &&
        String(existingId) !== String(userId)
      ) {
        instance.reset();
      }

      if (this.isDebugLoggingOn()) {
        // eslint-disable-next-line no-console
        console.log(
          `[PostHog] identified ${userId} locally - the "$identify" event itself is dropped by before_send`
        );
      }

      instance.identify(userId);
    } catch (error) {
      this.errorHandler.handleError(new Error(`PostHogService: Error identifying user - ${error}`));
    }
  }

  /**
   * Sends an event. The payload is built at call time so `ts` records when the
   * action happened, not when the SDK became available.
   * @param eventName - PostHog event name.
   * @param properties - Event-specific properties; these win over the common block.
   * @param options - `includeCommonProperties: false` sends the caller's
   * properties alone. Only for an event whose contract is a closed list, where
   * a field the common block would add is a schema violation rather than a
   * bonus. The stored-user gate below still applies either way, so an event
   * with nobody behind it is dropped whichever mode it uses.
   *
   * `personProperties` and `personPropertiesOnce` ride along as `$set` and
   * `$set_once`. PostHog consumes them while ingesting the event — the profile
   * is updated, and neither key is stored on the event — so this is how the
   * person is kept current without a separate `$identify` or `$set` event.
   * Blank values are dropped, since an empty string would overwrite what the
   * profile already holds while an absent key leaves it alone.
   * @returns {void}
   */
  capture(
    eventName: string,
    properties: Record<string, any> = {},
    options: {
      includeCommonProperties?: boolean;
      personProperties?: Record<string, unknown>;
      personPropertiesOnce?: Record<string, unknown>;
    } = {}
  ): void {
    if (!this.isTrackingAllowed() || !this.isEventEnabled(eventName)) {
      return;
    }

    const commonProps = this.getCommonTrackingProperties();
    if (!commonProps) {
      return;
    }

    const eventProperties = {
      ...(options.includeCommonProperties === false ? {} : commonProps),
      ...properties
    };

    // Nothing is stripped from an event, but JSON serialisation discards
    // undefined, so those keys reach PostHog as missing rather than empty.
    const undefinedKeys = Object.entries(eventProperties)
      .filter(([, value]) => value === undefined)
      .map(([key]) => key);
    if (undefinedKeys.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PostHog] ${eventName}: ${undefinedKeys.join(', ')} are undefined and will not appear in PostHog — send null or a real value`
      );
    }

    const send = (): void => {
      // The profile blocks are built here rather than at call time, because
      // signupAttribution() reads the SDK's own storage and that is only
      // restored once posthog-js has loaded. Attribution goes underneath, so an
      // explicit value from the caller wins — and it is merged only when the
      // caller is writing to the profile at all, so an event that sets nothing
      // stays an event that sets nothing.
      const payload = {
        ...eventProperties,
        ...this.personPropertyBlock(
          '$set',
          options.personProperties && {
            ...this.signupAttribution(),
            ...options.personProperties
          }
        ),
        ...this.personPropertyBlock('$set_once', options.personPropertiesOnce)
      };

      const instance = this.getPostHogInstance();
      if (!instance) {
        // eslint-disable-next-line no-console
        console.warn(
          `[PostHog] DROPPED "${eventName}" - the loader snippet never ran`,
          payload
        );
        return;
      }

      // The snippet installs a stub on window.posthog before posthog-js is
      // fetched, so an instance existing proves nothing. A call handed to the
      // stub sits in its replay array and is sent only if the real SDK arrives
      // — if the fetch was blocked, it silently never leaves the browser. Said
      // out loud, because the payload was already logged as if it had gone.
      if (!this.isSdkLoaded()) {
        // eslint-disable-next-line no-console
        console.warn(
          `[PostHog] "${eventName}" queued on the loader stub - posthog-js did not load within ${this.READY_TIMEOUT_MS}ms (ad blocker, CSP or network). It leaves the browser only if the SDK still arrives.`,
          payload
        );
      }

      if (this.isDebugLoggingOn()) {
        // eslint-disable-next-line no-console
        console.log(
          `[PostHog] SENT "${eventName}"`,
          JSON.parse(JSON.stringify(payload))
        );
      }

      try {
        instance.capture(eventName, payload);
      } catch (error) {
        this.errorHandler.handleError(
          new Error(`PostHogService: Error capturing event - ${error}`)
        );
      }
    };

    // Gated on the real SDK, not on the stub, because identify() waits for it
    // too. Queueing into the stub instead would replay this event ahead of the
    // identify that has not run yet, against the anonymous distinct id — and
    // `person_profiles: 'identified_only'` attaches no person to those, so the
    // event lands in PostHog with nobody behind it. whenPostHogReady() hands
    // back one cached promise, so these run in the order they were called.
    if (this.isSdkLoaded()) {
      send();
      return;
    }

    this.whenPostHogReady().then(send);
  }

  /**
   * Builds the `$set` / `$set_once` block for an event, or nothing at all when
   * there is nothing worth writing. Spread into the payload, so an empty block
   * never reaches PostHog as a bare `$set: {}`.
   * @param {'$set' | '$set_once'} key - Which profile-write semantics to use.
   * @param {Record<string, unknown>} attributes - Raw properties from the caller.
   * @returns {Record<string, unknown>} The block, or `{}`.
   * @private
   */
  private personPropertyBlock(
    key: '$set' | '$set_once',
    attributes: Record<string, unknown> | undefined
  ): Record<string, unknown> {
    if (!attributes) {
      return {};
    }

    const cleaned = this.dropBlankProperties(attributes);
    return Object.keys(cleaned).length ? { [key]: cleaned } : {};
  }

  /** The identity block every event carries, maintained by identify(). */
  private readonly CUSTOMER_PAYLOAD_KEYS: string[] = [
    'customer_name',
    'customer_id',
    'company_id',
    'company_name',
    'email',
    'phone'
  ];

  /**
   * The subset of an event's properties worth mirroring onto the person. A
   * property sent with an event is visible only on that event — PostHog never
   * carries it onto the person — so anything the profile should show has to be
   * sent as `$set` too. The identity block is stripped out: the contact fields
   * are written by the auth events, which know them first-hand, and re-sending
   * them from every event would let an older copy overwrite a newer one.
   * Typed as `object` rather than an index signature so the trackers can pass
   * their own interfaces straight through.
   * @param {object} params - The event's full property block.
   * @returns {Record<string, unknown>} The properties to send as `$set`.
   * @private
   */
  private profileProperties(params: object): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (!this.CUSTOMER_PAYLOAD_KEYS.includes(key)) {
        attributes[key] = value;
      }
    });

    return attributes;
  }

  /**
   * Customer, company and verification fields shared by the auth and onboarding
   * events. These are named for the customer/company vocabulary the analytics
   * spec uses. They are the only identity on an event: the common block carries
   * no `user_id`/`org_id`/`org_name`, since these already say the same thing.
   * @param customer - Identity taken from the auth response.
   * @param verification - Settled verification state, or null if unavailable.
   * @returns {ICustomerEventPayload} Properties to merge into the event.
   */
  customerPayload(
    customer: {
      name: string;
      customerId: string;
      companyId: string;
      companyName: string;
      email: string;
    },
    verification: IUserVerification | null
  ): ICustomerEventPayload {
    return {
      customer_name: customer.name,
      customer_id: this.customerId(customer.customerId),
      company_id: customer.companyId,
      company_name: customer.companyName,
      // The auth response always carries the email; verification is only a
      // fallback, since its effect is not registered on the signup route.
      email: customer.email || verification?.email || '',
      phone: verification?.phone ?? ''
    };
  }

  /**
   * The same payload built entirely from local storage, for events that fire
   * deep in the app where no auth response or verification stream is in scope.
   * Login and signup seed every key it reads.
   * @returns {ICustomerEventPayload} Properties to merge into the event.
   */
  customerPayloadFromStorage(): ICustomerEventPayload {
    const read = (key: LocalStorageKeys): string =>
      String(this.localStorageService.getItem(key) ?? '');

    return {
      customer_name: read('username'),
      customer_id: this.customerId(read('parentUserId') || read('userId')),
      company_id: read('activeCompanyId'),
      company_name: read('activeCompanyName'),
      email: this.resolveContactEmail(read('email')),
      phone: read('phone')
    };
  }

  /**
   * Email for events and the person profile. Prefer the caller, then storage,
   * so 2FA / `/me` paths that omit `res.email` still send what login stored.
   */
  resolveContactEmail(preferred?: string | null): string {
    const fromCaller = String(preferred ?? '').trim();
    if (fromCaller) {
      return fromCaller;
    }
    return String(this.localStorageService.getItem('email') ?? '').trim();
  }

  /**
   * Login event, built the same way as `register_success`: identify() so the
   * SDK is bound to this user, then one capture() carrying both the approved
   * event contract and the person properties.
   *
   * `user_login` is the only thing PostHog receives here. The person bag rides
   * on it as `$set` instead of going out as its own `$identify` and `$set`
   * events — PostHog applies it while ingesting this event and does not keep it
   * on the stored event, so the profile is just as current as before and the
   * project is left with one event per login.
   *
   * The common block is excluded. The fields that used to be on the event —
   * login_method, user_type, is_verified, is_two_factor_enabled, device_type,
   * login_count, days_since_last_login and the customer block — are not typed
   * in IUserLoginPayload, so they cannot be passed back in by accident; the
   * durable ones travel in `identity`, onto the profile.
   *
   * @param {string} userId - The canonical user id, used as the distinct id.
   * @param {Record<string, unknown>} identity - Durable person properties.
   * @param {IUserLoginPayload} event - The approved event properties.
   * @returns {void}
   */
  trackUserLogin(
    userId: string,
    identity: Record<string, unknown>,
    event: IUserLoginPayload
  ): void {
    const email = this.resolveContactEmail(
      typeof identity.email === 'string' ? identity.email : undefined
    );

    // Binds the distinct id and marks the session identified. Sends nothing:
    // the `$identify` event it produces is dropped on its way out.
    this.identify(userId);

    this.capture('user_login', this.dropBlankProperties({ ...event }), {
      includeCommonProperties: false,
      personProperties: {
        ...identity,
        email,
        // Not in `identity` on every path, and the contract carries no phone,
        // so storage is the only source; a blank one is dropped and leaves
        // what the profile holds untouched.
        phone: String(this.localStorageService.getItem('phone') ?? '')
      }
    });
  }

  /**
   * Successful account creation, with the Google Ads click that brought the
   * user. Fired only once the backend has confirmed the registration, and only
   * after identify(), so the event lands on the identified person rather than
   * the anonymous distinct id that `person_profiles: 'identified_only'` throws
   * away.
   *
   * The payload is exactly the approved contract and nothing else. The removed
   * fields — registration_id, account_id, gbraid, wbraid, utm_medium,
   * utm_content, utm_term, environment, app_version — are not typed here, so
   * they cannot be passed back in by accident. Blank values are dropped rather
   * than sent as '', which is what the spec asks for an unavailable field.
   *
   * The common block is deliberately excluded. Its identity fields say the same
   * thing this contract says under different names — `customer_id` beside
   * `user_id` — and its `site_identifier` is the build's 'OCW'/'ZM', not the
   * landing property this event reports. Two spellings of one fact on the same
   * event is what the closed list exists to prevent, which is also why
   * `company` is gone: the profile already carries `company_name`.
   *
   * One super property, `referral_code`, still reaches the event when a referral
   * exists: the SDK stamps registered super properties itself. It is registered
   * only when non-empty, so a direct signup carries nothing extra.
   *
   * Same order as login: identify() so the person exists, then the first-touch
   * properties with set-once semantics, then capture(). The spec fixes that
   * order, and set-once is what stops a later campaign rewriting the original
   * one.
   *
   * @param {string} userId - The canonical user id, used as the distinct id.
   * @param {Record<string, unknown>} identity - Durable person properties.
   * @param {IFirstTouchAttribution} firstTouch - The landing attribution.
   * @param {IRegisterSuccessPayload} event - The approved event properties.
   * @returns {void}
   */
  trackRegisterSuccess(
    userId: string,
    identity: Record<string, unknown>,
    firstTouch: IFirstTouchAttribution,
    event: IRegisterSuccessPayload
  ): void {
    const email = this.resolveContactEmail(event.email);
    const payload = this.dropBlankProperties({ ...event, email });

    // Binds the distinct id and marks the session identified. Sends nothing:
    // the `$identify` event it produces is dropped on its way out.
    this.identify(userId);

    this.capture('register_success', payload, {
      includeCommonProperties: false,
      personProperties: {
        ...identity,
        email,
        // The contract carries no phone, so storage is the only source; a blank
        // one is dropped downstream and leaves the profile untouched.
        phone: String(this.localStorageService.getItem('phone') ?? ''),
        // No `company`: the identity block already carries `company_name`, and
        // two spellings of one fact on the same profile is what this contract
        // exists to avoid.
        signup_date: event.registered_at
      },
      // Set-once, so a later campaign cannot rewrite the landing attribution
      // that actually brought this user.
      personPropertiesOnce: {
        $initial_gclid: firstTouch.gclid,
        $initial_fbclid: firstTouch.fbclid,
        $initial_utm_source: firstTouch.utm_source,
        $initial_utm_campaign: firstTouch.utm_campaign,
        $initial_referrer: firstTouch.referrer,
        $initial_site_identifier: firstTouch.site_identifier
      }
    });
  }

  /**
   * Onboarding feature selection. No identify()/reset() — the event records a
   * choice, it does not change who the user is. The choice itself is mirrored
   * onto the profile, because event properties never show on the person: only
   * this event's own fields go across, since the customer block is already on
   * the profile from identify().
   */
  trackFeatureList(
    params: {
      features_needed: string[];
      total_features_selected: number;
      primary_feature: string;
      selection_duration_seconds: number;
      is_changed_selection: boolean;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'onboarding_selected_features',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Persona verification widget opened. capture() only — the user is already
   * identified and nothing about their profile has changed yet.
   */
  trackBusinessVerificationInitiated(
    params: {
    verification_type: string;
    is_first_attempt: boolean;
    attempt_number: number;
    persona_inquiry_id: string;
  } & ICustomerEventPayload
  ): void {
    this.capture(
      'business_verification_initiated',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Persona form submitted. capture() only — the outcome is still pending, so
   * nothing about the person's verified state has changed yet.
   */
  trackBusinessVerificationSubmitted(
    params: {
    verification_type: string;
    persona_inquiry_id: string;
    persona_status: string;
    form_duration_seconds: number;
    attempt_number: number;
    documents_submitted: number;
    is_resubmission: boolean;
  } & ICustomerEventPayload
  ): void {
    this.capture(
      'business_verification_submitted',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Persona widget closed or errored without a submission. capture() only —
   * nothing was submitted, so no profile state changed.
   */
  trackBusinessVerificationAbandoned(
    params: {
    verification_type: string;
    persona_inquiry_id: string | null;
    form_duration_seconds: number;
    attempt_number: number;
    exit_reason: string;
    exit_page: string;
  } & ICustomerEventPayload
  ): void {
    this.capture(
      'business_verification_abandoned',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Bank linking started. capture() only — nothing is linked yet, so no profile
   * state has changed.
   */
  trackBankSetupInitiated(
    params: {
      bank_add_method: 'instant' | 'manual';
      is_first_bank_attempt: boolean;
      bank_count_before: number;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'bank_setup_initiated',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Bank linking left without a linked account. capture() only — nothing was
   * linked, so no profile state changed.
   */
  trackBankSetupAbandoned(
    params: {
      setup_duration_seconds: number;
      exit_reason: 'user_exit' | 'error';
      bank_selected: string | null;
      steps_completed: number;
      error_code: string | null;
      bank_selected_type: string | null;
      bank_add_method: 'instant' | 'manual';
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'bank_setup_abandoned',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Bank linking rejected by the API. capture() only in spirit — nothing was
   * linked, so no identity changed; the failure fields still mirror onto the
   * profile the way every other event here does.
   */
  trackBankLinkedFailed(
    params: {
      bank_add_method: 'instant' | 'manual';
      failure_reason_code: string | number;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'bank_linked_failed',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * A transfer flow was opened. capture() only — the user is already identified
   * and nothing has been entered yet, so no profile state has changed.
   *
   * Fire this on the button click, before the form is shown, and keep the
   * timestamp taken alongside it: transaction_submitted and
   * transaction_abandoned both measure form_duration_seconds from that point.
   */
  trackTransactionInitiated(
    params: {
      transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
      is_first_attempt: boolean;
      // Always a number: an absent count is 0, never null.
      bank_count: number;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'transaction_initiated',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Confirm was clicked and the request is on its way to the backend.
   * capture() only — the transaction is pending, so nothing about the person
   * has changed until the backend confirms the result.
   *
   * Unlike the MoEngage equivalent, `amount` and `wallet_balance_before` are
   * real numbers rather than bucketed categories, per the PostHog spec.
   */
  trackTransactionSubmitted(
    params: {
      transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
      amount: number;
      currency: string;
      // No 'unknown': the user has chosen a method by this point.
      funding_method: 'ach' | 'wire' | 'other';
      form_duration_seconds: number;
      wallet_balance_before: number;
      // null, never '' — the blank case has to stay distinguishable.
      bank_account_id: string | null;
      source_wallet_id: string | null;
      destination_wallet_id: string | null;
      is_first_transaction: boolean;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'transaction_submitted',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * The transfer flow was closed without submitting. capture() only — nothing
   * was transacted, so no profile state has changed.
   *
   * Fires from ngOnDestroy, guarded by the submitted flag, so a completed
   * transaction is never also counted as an abandonment. As with
   * transaction_submitted, `amount_entered` is a real number rather than the
   * bucketed notional value MoEngage takes.
   */
  trackTransactionAbandoned(
    params: {
      transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
      form_duration_seconds: number;
      amount_entered: number;
      // 'unknown' is a real case here: the form can be left before a method
      // is chosen, unlike transaction_submitted.
      funding_method: 'ach' | 'wire' | 'unknown';
      exit_step: 'amount_entry' | 'method_selection' | 'review_confirm' | 'unknown';
      exit_reason: 'user_exit' | 'session_expired' | 'error' | 'otp_verification';
      // null, never '' — the blank case has to stay distinguishable.
      bank_account_id: string | null;
    } & ICustomerEventPayload
  ): void {
    this.capture(
      'transaction_abandoned',
      { ...params },
      { personProperties: this.profileProperties(params) }
    );
  }

  /**
   * Clears the identity on logout so the next user is not merged into this one.
   * Not gated on isTrackingAllowed(): unlinking must still work in an agent
   * session.
   */
  reset(): void {
    if (!environment?.ocw_trackers?.postHog?.enabled) {
      return;
    }

    const instance = this.getPostHogInstance();
    if (!instance) {
      return;
    }

    try {
      instance.reset();
    } catch (error) {
      this.errorHandler.handleError(new Error(`PostHogService: Error resetting session - ${error}`));
    }
  }
}
