import { Injectable, inject, ErrorHandler } from '@angular/core';

/**
 * The first-touch marketing attribution the register_success spec approves.
 * Every field is optional: a direct visit carries none of them, and the spec
 * requires an unavailable value to be omitted rather than sent as '' or
 * 'unknown'.
 */
export interface IFirstTouchAttribution {
  site_identifier?: string;
  gclid?: string;
  /** The Meta click id, read and treated exactly as `gclid` is. */
  fbclid?: string;
  utm_source?: string;
  utm_campaign?: string;
  referrer?: string;
  landing_page?: string;
}

/**
 * Reads the approved attribution fields off the landing URL.
 *
 * The URL is the only source. Nothing is written to cookies or localStorage and
 * nothing is read back from them, so a registration reports the campaign that
 * is actually in the address bar of the visit making it — never one left behind
 * by an earlier visit.
 *
 * The trade-off is deliberate and worth stating: attribution now lives only for
 * the current page load. A visitor who lands on onlinecheckwriter.com with a
 * gclid and registers on live.onlinecheckwriter.com — a different host, a
 * different page load — arrives with nothing, and that registration is reported
 * as direct. Persisting the touch is what used to cover that hop.
 *
 * Once the person exists in PostHog, `$set_once` keeps the first touch from
 * being rewritten by a later campaign, so PostHog itself is the only thing
 * holding first-touch state now.
 *
 * The in-memory snapshot below is not a cache of a stored value. Angular's
 * router can drop the query string on its first navigation, and registration
 * happens long after that, so the values are read from the URL at the earliest
 * moment they are still readable and held in memory for this page load only.
 * They are gone on reload, on a new tab and on a new host.
 */
@Injectable({
  providedIn: 'root'
})
export class AttributionService {
  private errorHandler = inject(ErrorHandler);

  /**
   * What the URL carried when this page loaded. Memory only — never persisted,
   * so it cannot outlive the page load that read it.
   */
  private landingAttribution: IFirstTouchAttribution = {};

  /**
   * Site identifiers the reporting side recognises. An arbitrary value from
   * the URL is untrusted input and is dropped rather than reported, so a
   * crafted link cannot invent a landing property in the analytics.
   */
  private readonly ALLOWED_SITE_IDENTIFIERS = [
    'onlinecheckwriter',
    'zilmoney',
    'payroll',
    'vendor-payments'
  ];

  /**
   * The reviewed hostname mapping the spec permits when `site_identifier` is
   * absent from the URL. Paid links do not all carry the parameter yet, and a
   * registration with no site at all is worse than one attributed to the host
   * that actually served it. Nothing is invented: a host that is not listed
   * leaves the field off entirely.
   */
  private readonly HOST_SITE_IDENTIFIERS: { suffix: string; site: string }[] = [
    { suffix: 'zilmoney.com', site: 'zilmoney' },
    { suffix: 'onlinecheckwriter.com', site: 'onlinecheckwriter' }
  ];

  /**
   * Query parameters stripped from `landing_page` before it is reported. The
   * spec forbids credentials and tokens reaching PostHog, and a landing URL
   * that came through an integration or an OAuth bounce can carry them.
   */
  private readonly SENSITIVE_PARAM_KEYS = [
    'password',
    'token',
    'access_token',
    'id_token',
    'refresh_token',
    'code',
    'secret',
    'api_key',
    'apikey',
    'auth',
    'authorization',
    'session',
    'public_token',
    'plaid_token'
  ];

  /**
   * PostHog caps property values well above this; the limit is here so a
   * pathological redirect chain cannot push a multi-kilobyte URL into the
   * payload.
   */
  private readonly MAX_LANDING_PAGE_LENGTH = 1000;

  /**
   * @description Reads the landing URL once, before the router's first
   * navigation can strip the query string — see the APP_INITIALIZER in main.ts,
   * which is the last moment the original URL is still readable. The result is
   * held in memory for this page load and never written anywhere.
   * @returns {void}
   */
  captureLandingAttribution(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      this.landingAttribution = this.readLandingAttribution();
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`AttributionService: Error capturing landing attribution - ${error}`)
      );
    }
  }

  /**
   * @description Returns the attribution for the register_success payload. The
   * live URL wins, so a campaign still in the address bar is reported even if
   * the app initializer never ran; the snapshot taken at page load is the
   * fallback for when the router has since stripped the query string. Both come
   * from the URL — there is no stored value behind either.
   * @returns {IFirstTouchAttribution} What the URL carried, or {} when it
   * carried nothing.
   */
  getFirstTouchAttribution(): IFirstTouchAttribution {
    try {
      const live = this.readLandingAttribution();
      if (this.hasAnySignal(live)) {
        return live;
      }

      return this.hasAnySignal(this.landingAttribution)
        ? this.landingAttribution
        : live;
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`AttributionService: Error reading first touch attribution - ${error}`)
      );
      return {};
    }
  }

  /**
   * @description Reads the approved fields off the current URL. Only the seven
   * the contract lists are read; gbraid, wbraid, msclkid, utm_medium,
   * utm_content and utm_term are deliberately not parsed, so they cannot leak
   * into the payload.
   * @returns {IFirstTouchAttribution} Whatever the URL and referrer carry.
   */
  private readLandingAttribution(): IFirstTouchAttribution {
    const landing = new URL(window.location.href);
    const { searchParams } = landing;

    return this.withoutBlanks({
      site_identifier: this.resolveSiteIdentifier(
        this.readParam(searchParams, 'site_identifier'),
        landing.hostname
      ),
      gclid: this.readParam(searchParams, 'gclid'),
      fbclid: this.readParam(searchParams, 'fbclid'),
      utm_source: this.readParam(searchParams, 'utm_source'),
      utm_campaign: this.readParam(searchParams, 'utm_campaign'),
      referrer: this.readReferrer(),
      landing_page: this.sanitizeLandingPage(landing)
    });
  }

  /**
   * @param {URLSearchParams} params - The landing URL's query string.
   * @param {string} name - The parameter to read.
   * @returns {string | undefined} The trimmed value, or undefined when blank.
   * @private
   */
  private readParam(params: URLSearchParams, name: string): string | undefined {
    const value = params.get(name)?.trim();
    return value || undefined;
  }

  /**
   * @description Same-origin referrers are dropped: an internal hop is not the
   * source that brought the visitor, and reporting one would name this app as
   * its own traffic source.
   * @returns {string | undefined} The external referrer, when there is one.
   * @private
   */
  private readReferrer(): string | undefined {
    const referrer = document.referrer?.trim();
    if (!referrer) {
      return undefined;
    }

    try {
      if (new URL(referrer).hostname === window.location.hostname) {
        return undefined;
      }
    } catch {
      return undefined;
    }

    return referrer;
  }

  /**
   * @description Validates the URL's site identifier against the allowlist,
   * falling back to the reviewed hostname mapping when the parameter is absent
   * or not recognised.
   * @param {string | undefined} requested - The value from the URL, if any.
   * @param {string} hostname - The landing hostname.
   * @returns {string | undefined} An allowlisted identifier, or undefined.
   * @private
   */
  private resolveSiteIdentifier(
    requested: string | undefined,
    hostname: string
  ): string | undefined {
    const normalized = requested?.toLowerCase();
    if (normalized && this.ALLOWED_SITE_IDENTIFIERS.includes(normalized)) {
      return normalized;
    }

    const host = hostname.toLowerCase();
    return this.HOST_SITE_IDENTIFIERS.find(
      ({ suffix }) => host === suffix || host.endsWith(`.${suffix}`)
    )?.site;
  }

  /**
   * @description Strips credentials from the landing URL and caps its length.
   * @param {URL} landing - The landing URL.
   * @returns {string} The URL as it is safe to report.
   * @private
   */
  private sanitizeLandingPage(landing: URL): string {
    const sanitized = new URL(landing.toString());

    this.SENSITIVE_PARAM_KEYS.forEach((key) => {
      sanitized.searchParams.delete(key);
    });

    // Credentials in the userinfo component never belong in analytics.
    sanitized.username = '';
    sanitized.password = '';

    return sanitized.toString().slice(0, this.MAX_LANDING_PAGE_LENGTH);
  }

  /**
   * @description A landing page on its own is not attribution — every visit has
   * one. Only a campaign or a referrer says where the visitor came from, so
   * only those decide whether the page-load snapshot is worth falling back to.
   * @param {IFirstTouchAttribution} attribution - The values read.
   * @returns {boolean} Whether there is a real signal.
   * @private
   */
  private hasAnySignal(attribution: IFirstTouchAttribution): boolean {
    return !!(
      attribution.gclid ||
      attribution.fbclid ||
      attribution.utm_source ||
      attribution.utm_campaign ||
      attribution.referrer
    );
  }

  /**
   * @param {IFirstTouchAttribution} attribution - Values to clean.
   * @returns {IFirstTouchAttribution} The same object without blank fields, so
   * an absent value is omitted from the payload rather than sent as ''.
   * @private
   */
  private withoutBlanks(
    attribution: IFirstTouchAttribution
  ): IFirstTouchAttribution {
    const kept: Record<string, string> = {};

    Object.entries(attribution).forEach(([key, value]) => {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      if (trimmed) {
        kept[key] = trimmed;
      }
    });

    return kept as IFirstTouchAttribution;
  }
}
