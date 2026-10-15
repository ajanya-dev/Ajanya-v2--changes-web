import { Injectable, Renderer2, RendererFactory2, inject, ErrorHandler } from '@angular/core';
import {
  googleAnalytics,
  loadSite24_7,
  zoho,
  faceBookPixels,
  outBrainScript,
  siftTrackingScript,
  microsoftUETScript,
  ipQualityScore,
  blockClickjackingScriptExceptionDomains,
  matomo,
  g2Script,
  googleTagManager,
  postHog,
} from 'src/app/data/scripts/scripts';
import { Meta } from '@angular/platform-browser';
import { Utils } from 'src/app/data/utils';
import { environment } from 'src/environments/environment';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { SeonSDK } from 'src/app/modules/auth/model/security';

declare let _paq: unknown[]; // Declare the Matomo tracking object

// Declare MoEngage types with proper TypeScript interfaces
interface MoEngageInstance {
  add_unique_user_id(userId: string): Promise<void>;
  update_unique_user_id(userId: string): Promise<void>;
  track_event(eventName: string, eventData?: Record<string, any>): void;
  add_user_attribute(attributeName: string, attributeValue: any): void;
  add_first_name(name: string): void;
  add_last_name(name: string): void;
  add_email(email: string): void;
  add_mobile(mobile: string): void;
  add_user_name(username: string): void;
  add_gender(gender: string): void;
  add_birthday(birthday: string): void;
  destroy_session(): Promise<void>;
  call_web_push(data: any): void;
  track(eventName: string, eventData?: Record<string, any>): void;
  location_type_attribute(data: any): void;
  identifyUser(userId: string): void;
  getUserIdentities(): any;
  initialised?: number;
}

declare global {
  interface Window {
    Moengage: MoEngageInstance;
    moengage: MoEngageInstance;
    moe: (config: { app_id: string; debug_logs?: number }) => MoEngageInstance;
    moengage_q?: Array<{ f: string; a: any[] }>;
    moengage_object?: string;
    seon: SeonSDK;
  }
}

/**
 * Service for managing scripts and tracking codes.
 */
@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private _renderer: Renderer2;
  private ENTERPRISE_ID = 1563511 as const;
  utils = Utils;
  private whiteLabelService = inject(DynamicWhiteLabelService);
  
  // MoEngage configuration constants
  private readonly MOENGAGE_CONFIG = {
    DATA_CENTER: 'dc_4',
    SDK_VERSION: '2',
    DEBUG_LOGS: 0,
    SCRIPT_ID: 'moengage_script',
    CDN_URL: 'https://cdn.moengage.com/release',
    LIFECYCLE_EVENT: 'MOE_LIFECYCLE',
    INIT_COMPLETED_EVENT: 'SDK_INITIALIZATION_COMPLETED',
    READY_TIMEOUT_MS: 10000
  } as const;

  // Resolves to true once the MoEngage SDK emits SDK_INITIALIZATION_COMPLETED,
  // false if MoEngage is disabled or the SDK never finishes initializing.
  // Defaults to a resolved(false) promise so consumers safely no-op when the
  // SDK was never bootstrapped (addMoEngageScript not called).
  private moEngageReady: Promise<boolean> = Promise.resolve(false);

  private postHogService = inject(PostHogService);

  constructor(
    rendererFactory: RendererFactory2,
    private meta: Meta,
    private googleTMService: GoogleTagManagerService,
    private _localStorageService: LocalStorageService,
    private errorHandler: ErrorHandler
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Adds a script element to the document's body.
   * @param {string} script - The script code to be added.
   * @param {string} [scriptId] - The ID of the script element.
   * @param {string} [src] - The source URL of an external script.
   * @param {Object} [properties] - Additional properties for the script element (e.g., async, defer).
   */
  addScript(
    script: string,
    scriptId?: string,
    src?: string,
    properties?: { async?: boolean; defer?: boolean }
  ): void {
    
    try {
      const s: HTMLScriptElement = this._renderer.createElement('script');
      s.type = 'text/javascript';
      
      // Only set script text if it's not empty and we're not loading an external script
      if (script && script.trim() && !src) {
        s.text = script;
      }
      
      s.async = properties?.async!;
      s.defer = properties?.defer!;

      if (scriptId) {
        s.id = scriptId;
      }
      if (src) {
        s.src = src;
      }
      
      this._renderer.appendChild(document.body, s);
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error adding script - ${error}`));
    }
  }

  /**
   * Adds a noscript element to the document's body.
   * @param {string} script - The noscript code to be added.
   * @param {string} [scriptId] - The ID of the noscript element.
   * @param {string} [src] - The source URL of an external script.
   * @param {Object} [properties] - Additional properties for the noscript element (e.g., async, defer).
   */
  addNoScript(
    script: string,
    scriptId?: string,
    src?: string,
    properties?: { async?: boolean; defer?: boolean }
  ): void {
    const s: HTMLScriptElement = this._renderer.createElement('noscript');
    s.type = 'text/javascript';
    s.text = script;
    s.async = properties?.async!;
    s.defer = properties?.defer!;

    if (scriptId) {
      s.id = scriptId;
    }
    if (src) {
      s.src = src;
    }
    this._renderer.appendChild(document.body, s);
  }

  /**
   * Adds a meta tag to the document's head.
   * @param {Object} data - The meta tag data, including the 'name' and 'content' properties.
   */
  addMetaTag(data: { name: string; content: string }): void {
    this.meta.addTag({ name: data?.name, content: data?.content });
  }

  /**
   * Removes script elements with the given IDs from the document.
   * @param {...string} scriptIds - The IDs of the script elements to be removed.
   */
  removeScript(ids: string[]): void {
    for (const id of ids) {
      const scriptElem: NodeListOf<HTMLScriptElement> =
        document.querySelectorAll(`#${id}`);
      scriptElem.forEach((e) => {
        e.remove();
      });
    }
  }

  /**
   * Sets user ID and session ID globally by adding scripts to the document's body.
   * @param {string} userId - The user ID.
   * @param {string} sessionId - The session ID.
   */
  SetUserIdAndSessionId(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.site24_7?.enabled
    ) {
      return;
    }
    const userId = this._localStorageService.getItem('userId') || '';
    const id = 'user_id_session_id';
    this.addScript(`var user_id='${userId}'`, id);
    this.addScript(`var session_id ='${userId}'`, id);
  }

  /**
   * Adds a script to block clickjacking attacks by setting the CSS display property.
   */
  blockClickjacking(): void {
    const whitelistedDomains = blockClickjackingScriptExceptionDomains;
    const parentOrigin = document.referrer;
    if (parentOrigin && whitelistedDomains.includes(parentOrigin)) {
      return;
    }
    const script = ` if (self == top) { document.documentElement.style.display = 'block'; } else { top.location = self.location; }`;
    this.addScript(script);
  }

  /**
   * Adds the Site24*7 script to the document's body.
   */
  loadSite24_7(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.site24_7?.enabled
    ) {
      return;
    }
    this.addScript(loadSite24_7[0]);
  }



  /**
   * Adds Google Analytics scripts to the document's body.
   */
  addGoogleAnalytics(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.googleAnalytics?.enabled
    ) {
      return;
    }
    this.addScript('', '', googleAnalytics[0], { async: true });
    this.addScript(googleAnalytics[1]);
  }

  /**
   * Adds Google Tag Manager scripts to the document's body.
   */
  addGoogleTagManger(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.googleTagManager?.enabled
    ) {
      return;
    }
    this.googleTMService.addGtmToDom();
    this.googleTagManger();
  }

  /**
   * Pushes a page tag to Google Tag Manager for tracking the current page.
   */
  emitCurrentPage(url: string): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.googleTagManager?.enabled
    ) {
      return;
    }
    this.googleTMService.pushTag({ event: 'page', pageName: url });
  }

  /**
   * Adds a meta tag to prevent indexing and following for non-production environments.
   */
  addGoogleNoIndexMetaTag(): void {
    if (!environment.production) {
      this.addMetaTag({ name: 'robots', content: 'noindex, nofollow' });
    }
  }

  /**
   * Adds Facebook Pixel scripts and noscripts to the document's body.
   */
  addFaceBookPixels(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.faceBookPixel?.enabled
    ) {
      return;
    }
    this.addScript(faceBookPixels[0]);
    this.addNoScript(faceBookPixels[1]);
  }

  /**
   * Adds Zoho Support Chat Widget script to the document's body.
   */
  addZohoSrcipt(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.zohoSupportChatWidget?.enabled
    ) {
      return;
    }
    this.addScript(zoho[0], 'zsiqchat');
  }

  /**
   * Adds ADP Zoho Support Chat Widget script to the document's body.
   */
  addADPZohoSrcipt(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.zohoSupportChatWidget?.enabled
    ) {
      return;
    }
    const chatBox = document.getElementById('zsiq_float')!;
    if (chatBox) {
      chatBox.style.cssText = 'display: block !important';
      return;
    }
    this.addScript(zoho[1], 'zsiqchatADP');
  }

  /**
   * Hides zoho chat box with display property none.
   */
  hideZohoChat(): void {
    const chatBox = document.getElementById('zsiq_float')!;
    if (chatBox) {
      chatBox.style.cssText = 'display: none !important';
    }
  }
  /** ZOHO CHAT  END */

  /**
   * Adds CJ (Commission Junction) site scripts for tracking.
   * @returns {Promise<void>} A promise that resolves when the scripts are added.
   */
  async cjSiteCode(): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.cjSite?.enabled
    ) {
      return;
    }

    const hashedEmail = await Utils.getHash(
      this._localStorageService.getItem('email')!
    );
    const cj = [
      `
      if (!window.cj) window.cj = {};
      cj.sitePage = {
        enterpriseId: 1563511,
        pageType: 'accountCenter',
        userId: '${this._localStorageService.getItem('userId')}',
        emailHash:'${hashedEmail}'
      };`,
      `
      (function(a,b,c,d){
        a='https://onlinecheckwriter.com/proxydirectory/tags/12313/tag.js';
        b=document;c='script';d=b.createElement(c);d.src=a;
        d.type='text/java'+c;d.async=true;
        d.id='cjapitag';
        a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a)
      })();
      `
    ];

    if (this._localStorageService.getItem('appToken')) {
      cj?.forEach((script) => this.addScript(script, 'cjScript'));
    }
  }

  /**
   * Adds CJ (Commission Junction) site scripts for signup conversion tracking.
   * @returns {Promise<void>} A promise that resolves when the scripts are added.
   */
  async cjSiteScript2(): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.cjSite?.enabled
    ) {
      return;
    }

    const userId = this._localStorageService.getItem('userId') || '';
    const hashedEmail = await Utils.getHash(
      this._localStorageService.getItem('email')!
    );
    const actionTrackerId = 429193;
    const cjeCookie = Utils.getCookie('cje') || '';
    const cj = [
      `
      if (!window.cj) window.cj = {};
      cj.order = {
        enterpriseId: '${this.ENTERPRISE_ID}',
        pageType: 'conversionConfirmation',
        userId: '${userId}',
        emailHash: '${hashedEmail}',
        orderId: 'reg-${userId}',
        actionTrackerId: '${actionTrackerId}',
        currency: 'USD',
        amount: '0',
        cjeventOrder: '${cjeCookie}'
      };`,
      `
      (function(a,b,c,d){
        a='https://www.onlinecheckwriter.com/proxydirectory/tags/12313/tag.js';
        b=document;c='script';d=b.createElement(c);d.src=a;
        d.type='text/java'+c;d.async=true;
        d.id='cjapitag';
        a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a)
        })();`
    ];

    if (this._localStorageService.getItem('appToken')) {
      cj?.forEach((script) => this.addScript(script));
    }
  }

  /**
   * Adds Awin conversion code for tracking.
   * @returns {void}
   */
  addAwinConversionCode(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.awinConverstionCode?.enabled
    ) {
      return;
    }

    const avinConverstionCode = 'https://www.dwin1.com/24005.js';
    this.addScript('', '', avinConverstionCode, { defer: true });
  }

  /**
   * Runs Out Brain script for tracking.
   * @returns {void}
   */
  runOutBrain(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.outBrain?.enabled
    ) {
      return;
    }
    this.addScript(outBrainScript[0]);
  }

  /**
   * Emits an Out Brain event for tracking.
   * @param {string} prop - The event property to emit.
   * @returns {void}
   */
  emitOutBrainEvent(prop: string): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.outBrain?.enabled
    ) {
      return;
    }
    const outBrainScript = `obApi(${prop})`;
    const id = 'out_brain';
    this.addScript(outBrainScript, id);
  }

  /**
   * Runs Awin tracking code for tracking conversions.
   * @param {number|string} grandTotal - The total amount of the order.
   * @param {string} order_id - The ID of the order.
   * @param {string|null} planCode - The plan code, if applicable.
   * @returns {void}
   */
  onRunAwinCode(
    grandTotal: number | string,
    order_id: string,
    planCode: string | null = null
  ): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.awinConverstionCode?.enabled
    ) {
      return;
    }

    let totalAmount: string | number = grandTotal;
    let parts: string;
    const orderId = order_id;

    const isExist = Utils.getCookie('ocw_utms');
    const sales_channel = isExist == 'awin' ? 'aw' : isExist;

    if (totalAmount == 0) {
      totalAmount = '1';
      parts = 'Reg:1';
    } else if (planCode === 'enterprise-custom-yearly-v2') {
      parts = `Enterprise:${totalAmount} `;
    } else {
      parts = `Default:${totalAmount} `;
    }
    const img = document.createElement('img');
    img.src = `https://www.awin1.com/sread.img?tt=ns&tv=2&merchant=24005&amount=${totalAmount}&cr=USD&ref=${orderId}&parts=${parts}&vc=&ch=${sales_channel}&testmode=0"`;

    // begin awin conversion tag
    //<![CDATA[ /*** Do not change ***/
    const awinscript = `
    var AWIN = {};
    AWIN.Tracking = {};
    AWIN.Tracking.Sale = {};
    /*** Set your transaction parameters ***/
    AWIN.Tracking.Sale.orderRef = "${orderId}";
    AWIN.Tracking.Sale.parts = "${parts}";
    AWIN.Tracking.Sale.amount = "${totalAmount}";
    AWIN.Tracking.Sale.voucher = "";
    AWIN.Tracking.Sale.currency = "USD";
    AWIN.Tracking.Sale.test = "0";
    AWIN.Tracking.Sale.channel = "${sales_channel}";
    `;
    // End awin conversion tag

    // Begin awin tracking code
    const avinConverstionCode = 'https://www.dwin1.com/24005.js';
    // End awin tracking code
    const id = 'awin';
    this.addScript(awinscript, id);
    this.addScript('', '', avinConverstionCode, { defer: true });
  }

  /**
   * Runs Sift tracking code for tracking user behavior.
   * @returns {void}
   */
  runSiftTrackingCode(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.siftTracking?.enabled ||
      this._localStorageService.ocwAdminToken ||
      this.utils.getCookie('isAdmin') == '1'
    ) {
      return;
    }
    this.addScript(siftTrackingScript[0], 'sift');
  }

  /**
   * Sends a custom event to the gtag (Google Analytics) tracking system.
   * @param {string} eventName - The name of the event.
   * @param {object} data - Additional data associated with the event.
   * @returns {void}
   */
  gtagEventScript(eventName: string, data: any = {}): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.gtagEvent?.enabled
    ) {
      return;
    }

    data.customer_id = this._localStorageService.getItem('userId');
    const id = 'gtag_event';
    const script = `gtag('event', 'live-${eventName}', ${JSON.stringify(
      data
    )})`;
    this.addScript(script, id);
  }

  /**
   * Sends a custom event to the data layer for tracking.
   * @param {string} eventName - The name of the event.
   * @returns {void}
   */
  dataLayerPush(eventName: string): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.dataLayerPush?.enabled
    ) {
      return;
    }

    const userId = this._localStorageService.getItem('userId') || '';
    const id = 'data_layer_event';
    const script = `window.dataLayer.push({'event': 'live-${eventName}', 'customer_id': '${userId}' })`;
    this.addScript(script, id);
  }

  /**
   * Pushes the user ID to the data layer for tracking.
   * @returns {void}
   */
  pushUserId(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.dataLayerPush?.enabled
    ) {
      return;
    }
    const userId = this._localStorageService.getItem('userId') || '';
    const id = 'data_layer_event';
    this.addScript(`window.dataLayer.push({'user_id': '${userId}'})`, id);
  }

  /**
   * Sends a custom subscription event to the gtag (Google Analytics) tracking system.
   * @param {string} eventName - The name of the event.
   * @param {string} amount - The amount of the subscription.
   * @param {object} data - Additional data associated with the event.
   * @returns {void}
   */
  gtagSubscriptionEvent(
    eventName: string,
    amount: string,
    data: any = {}
  ): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.dataLayerPush?.enabled
    ) {
      return;
    }
    data.customer_id = this._localStorageService.getItem('userId');
    data.subscribed_amount = amount;
    const id = 'data_layer_event';
    const script = `gtag('event', 'live-${eventName}', ${JSON.stringify(
      data
    )})`;
    this.addScript(script, id);
  }

  /**
   * Adds Microsoft UET (Universal Event Tracking) script for tracking.
   * @returns {void}
   */
  addMicrosoftUETScript() {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.microsoftUET?.enabled
    ) {
      return;
    }
    this.addScript(microsoftUETScript[0]);
  }

  /**
   * Runs the IPQualityScore tracking code for user behavior tracking.
   * @returns {void}
   */
  ipQualityScore(): void {
    if (this.utils.getCookie('isAdmin') == '1') {
      return;
    }
    if (environment?.env_id === 'production') {
      this.addScript(
        '',
        '',
        'https://www.ipqualityscore.com/api/app.onlinecheckwriter.com/LgJQVhsKKiCLOXS6uGhH8KSH3mSte38lKRQa31RTDeWVhCNJjfe97eyodH6x3EcejYBRApgM3UALdBtmYuaqIykWgRCucTFusrDV9yLAcEIeKmlELKdtnNguDNbgsQR9mOQt6X7hrFZG7uq0l2WIpCcmsLOjL66dD64cIbnzzbubmi2ZHLnUU3aKAMDopz4NFfwJhG3HrQwoNSLSAnUAo3fYMKw5S0lg3JOesNyYuVqFyiyCrCANUQlLpExz71xA/learn.js'
      );
      setTimeout(() => {
        this.addScript(ipQualityScore[0]);
      }, 500);
    }
  }

  /**
   * Adds affiliate tracking script for tracking conversions.
   * @param {number|string} amount - The amount of the order.
   * @param {string} order_id - The ID of the order.
   * @param {string|null} planCode - The plan code, if applicable.
   * @returns {void}
   */
  affiliateScript(
    amount: number | string,
    order_id: string,
    planCode: string | null = null
  ): void {
    if (environment?.env_id === 'production') {
      this.addScript(
        '',
        'pap_x2s6df8d',
        'https://onlinecheckwriter.postaffiliatepro.com/scripts/614gh00vkj.js'
      );
      setTimeout(() => {
        const papscript = `
        PostAffTracker.setAccountId('default1');
        var sale = PostAffTracker.createSale();
        sale.setTotalCost('${amount}');
        sale.setOrderID('${order_id}');
        sale.setProductID('${planCode}');
        PostAffTracker.register();
      `;
        this.addScript(papscript);
      }, 1500);
    }
  }

  /**
   * Adds Google maps script to the dom. mainly used for address auto completion (in OCW).
   */
  googleMapScript() {
    this.addScript(
      '',
      '',
      `https://maps.googleapis.com/maps/api/js?key=${environment.GOOGLE_API}&libraries=places&loading=async`,
      { async: true }
    );
  }

  /**
   * Temporarily removed this script. It may be added again in the future
   */
  matomoScript() {
    if (environment.env_id === 'zilMoney') {
      this.addScript(
        '',
        undefined,
        'https://cdn.matomo.cloud/zilmoney.matomo.cloud/matomo.js'
      );
      this.addNoScript(
        '',
        '',
        'https://zilmoney.matomo.cloud/matomo.php?idsite=1&amp;rec=1'
      );
      this.addScript(matomo.zilMoney[0]);
    }
    if (environment.env_id === 'production') {
      this.addScript(matomo.production[0]);
      this.addNoScript(
        '',
        '',
        'https://zilmoney.matomo.cloud/matomo.php?idsite=2&amp;rec=1'
      );
      this.addScript(matomo.production[1]);
    }
  }

  /**
   * G2 Tracker (ad. partner)
   */
  g2Track(): void {
    if (
      this.whiteLabelService.dynamicWhiteLabelFlagChecker(
        'isApplicationInZilMoneyMode'
      )
    ) {
      this.addScript(g2Script[0]);
    }
  }

  /**
   * Resolves once the MoEngage SDK has finished initializing.
   *
   * Gates on MoEngage's own lifecycle event (`MOE_LIFECYCLE` ->
   * `SDK_INITIALIZATION_COMPLETED`) rather than mere presence of the
   * `window.Moengage` object. The object is assigned synchronously by the
   * loader snippet as a queue stub; its methods (including getUserIdentities)
   * only return real data after the SDK script loads and drains its queue.
   *
   * @returns {Promise<boolean>} True when the SDK is fully initialized.
   * @private
   */
  private isMoEngageReady(): Promise<boolean> {
    return this.moEngageReady;
  }

  /**
   * Public accessor for the MoEngage readiness promise so other services
   * (e.g. MoEngageService) can gate on the same lifecycle signal instead of
   * re-checking window object presence.
   * @returns {Promise<boolean>} True when the SDK is fully initialized.
   */
  whenMoEngageReady(): Promise<boolean> {
    return this.moEngageReady;
  }

  /**
   * Arms the MoEngage readiness promise by listening for the SDK lifecycle
   * event. Must be called before the SDK loader is injected so the listener is
   * registered ahead of the SDK_INITIALIZATION_COMPLETED dispatch.
   * @private
   */
  private setupMoEngageReadyListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.moEngageReady = new Promise<boolean>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const onLifecycle = (event: Event): void => {
        const detail = (event as CustomEvent)?.detail;
        if (detail?.name === this.MOENGAGE_CONFIG.INIT_COMPLETED_EVENT) {
          clearTimeout(timeoutId);
          window.removeEventListener(this.MOENGAGE_CONFIG.LIFECYCLE_EVENT, onLifecycle);
          resolve(true);
        }
      };

      window.addEventListener(this.MOENGAGE_CONFIG.LIFECYCLE_EVENT, onLifecycle);

      // Safety net: never leave consumers awaiting forever if the SDK fails to
      // load (network/blocked). Fall back to whether the instance reports itself
      // initialised, otherwise resolve false so consumers no-op.
      timeoutId = setTimeout(() => {
        window.removeEventListener(this.MOENGAGE_CONFIG.LIFECYCLE_EVENT, onLifecycle);
        resolve(!!this.getMoEngageInstance()?.initialised);
      }, this.MOENGAGE_CONFIG.READY_TIMEOUT_MS);
    });
  }

  /**
   * Gets the MoEngage instance, preferring the capitalized version.
   * @returns {MoEngageInstance | null} The MoEngage instance or null if not available.
   * @private
   */
  private getMoEngageInstance(): MoEngageInstance | null {
    if (typeof window.Moengage !== 'undefined') {
      return window.Moengage;
    } else if (typeof window.moengage !== 'undefined') {
      return window.moengage;
    }
    return null;
  }

  /**
   * Adds MoEngage tracking script to the document's body.
   * Initializes the MoEngage Web SDK with proper error handling and environment checks.
   * @returns {void}
   */
  addMoEngageScript(): void {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.moEngage?.enabled
    ) {
      return;
    }

    const debugLogs = environment.env_id === 'staging' ? 1 : 0;

    const appId = environment?.ocw_trackers?.moEngage?.data?.appId;
       
    if (!appId) {
      return;
    }

    this.setupMoEngageReadyListener();

    try {
      const moEngageScript = `
        var moeDataCenter = "${this.MOENGAGE_CONFIG.DATA_CENTER}";
        var moeAppID = "${appId}";
        var sdkVersion = "${this.MOENGAGE_CONFIG.SDK_VERSION}";
        
        !function(e,n,i,t,a,r,o,d){if(!moeDataCenter||!moeDataCenter.match(/^dc_[0-9]+$/gm))return console.error("Data center has not been passed correctly. Please follow the SDK installation instruction carefully.");var s=e[a]=e[a]||[];if(s.invoked=0,s.initialised>0||s.invoked>0)return console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!"),!1;e.moengage_object=a;var l={},g=function n(i){return function(){for(var n=arguments.length,t=Array(n),a=0;a<n;a++)t[a]=arguments[a];(e.moengage_q=e.moengage_q||[]).push({f:i,a:t})}},u=["track_event","add_user_attribute","add_first_name","add_last_name","add_email","add_mobile","add_user_name","add_gender","add_birthday","destroy_session","add_unique_user_id","update_unique_user_id","moe_events","call_web_push","track","location_type_attribute","identifyUser","getUserIdentities"],m={onsite:["getData","registerCallback","getSelfHandledOSM"]};for(var c in u)l[u[c]]=g(u[c]);for(var v in m)for(var f in m[v])null==l[v]&&(l[v]={}),l[v][m[v][f]]=g(v+"."+m[v][f]);r=n.createElement(i),o=n.getElementsByTagName("head")[0],r.async=1,r.src=t,o.appendChild(r),e.moe=e.moe||function(){return(s.invoked=s.invoked+1,s.invoked>1)?(console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!"),!1):(d=arguments.length<=0?void 0:arguments[0],l)},r.addEventListener("load",function(){if(d)return e[a]=e.moe(d),e[a].initialised=e[a].initialised+1||1,!0}),r.addEventListener("error",function(){return console.error("Moengage Web SDK loading failed."),!1})}(window,document,"script","${this.MOENGAGE_CONFIG.CDN_URL}/"+moeDataCenter+"/versions/"+sdkVersion+"/moe_webSdk.min.latest.js","Moengage");
        
        window.Moengage = moe({
          app_id: moeAppID,
          debug_logs: ${debugLogs},
          swPath: '/serviceworker.js',
          swScope: '/',
          disable_web_push: false,
          nativeMethodsUsed: true,
          enableSPA: true
        });
        
        window.moengage = window.Moengage;
      `;
      
      this.addScript(moEngageScript, this.MOENGAGE_CONFIG.SCRIPT_ID);
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error initializing MoEngage script - ${error}`));
    }
  }

  /**
   * Sets user ID in MoEngage for tracking.
   *
   * Reads the currently identified user from the SDK (`getUserIdentities().uid`)
   * and branches:
   *   - different user already identified  -> destroy_session() then add_unique_user_id(userId)
   *   - no user identified                 -> add_unique_user_id(userId)
   *   - same user already identified       -> no-op (promise resolves immediately)
   *
   * Returns a promise so callers can sequence attribute setters / event trackers
   * after identification is complete.
   *
   * @param {string} userId - The user ID to set.
   * @returns {Promise<void>}
   */
  async moEngageSetUserId(userId: string): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.moEngage?.enabled ||
      !userId
    ) {
      return;
    }

    if (!(await this.isMoEngageReady())) {
      return;
    }

    let existingUid: unknown;
    try {
      const moengageInstance = this.getMoEngageInstance();
      existingUid = moengageInstance?.getUserIdentities()?.uid;

      if (existingUid && String(existingUid) !== String(userId)) {
        await moengageInstance?.destroy_session();
        await moengageInstance?.add_unique_user_id(userId);
      } else if (!existingUid) {
        await moengageInstance?.add_unique_user_id(userId);
      }
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`ScriptService: Error setting MoEngage user ID - ${error} ${JSON.stringify({ userId, existingUid: existingUid ?? null })}`)
      );
    }
  }



  /**
   * Sets user attributes in MoEngage.
   * @param {Record<string, any>} attributes - The user attributes to set.
   * @returns {void}
   */
  async moEngageSetUserAttributes(attributes: Record<string, any>): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.moEngage?.enabled ||
      !attributes ||
      Object.keys(attributes).length === 0
    ) {
      return;
    }

    if (!(await this.isMoEngageReady())) {
      return;
    }

    try {
      const moengageInstance = this.getMoEngageInstance();
      Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
        if (attributeName && attributeValue !== undefined && attributeValue !== null) {
          moengageInstance?.add_user_attribute(attributeName, attributeValue);
        }
      });
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error setting MoEngage user attributes - ${error}`));
    }
  }

  /**
   * Sets multiple predefined user attributes in MoEngage at once.
   * @param {Record<string, string>} attributes - Object with key-value pairs of attributes to set.
   * @returns {void}
   */
  async moEngageSetMultiplePredefinedUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.moEngage?.enabled ||
      !attributes ||
      Object.keys(attributes).length === 0
    ) {
      return;
    }

    if (!(await this.isMoEngageReady())) {
      return;
    }

    try {
      const moengageInstance = this.getMoEngageInstance();
      Object.entries(attributes).forEach(([key, value]) => {
        if (key && value) {
          switch(key){
            case 'email':
              moengageInstance?.add_email(value);
              break;
            case 'phone': 
              moengageInstance?.add_mobile(value);
              break;
            case 'user_name':
              moengageInstance?.add_user_name(value);
              break;
            case 'first_name': 
              moengageInstance?.add_first_name(value);
              break;
            case 'last_name':
              moengageInstance?.add_last_name(value);
              break;
            default:
              break ; 
          }
        }
      });
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error setting MoEngage multiple predefined user attributes - ${error}`));
    }
  }

 
  /**
   * Initializes app-related scripts on app initialization.
   * @returns {void}
   */
  appInitScripts(): void {
    this.SetUserIdAndSessionId();
    this.addGoogleNoIndexMetaTag();
    this.addAwinConversionCode();
    this.runOutBrain();
    this.addGoogleAnalytics();
    this.addGoogleTagManger();
    this.addFaceBookPixels();
    this.addMicrosoftUETScript();
    this.googleMapScript();
    // this.matomoScript();
    this.addZohoSrcipt();
    this.g2Track();
    this.seonScript();
    this.addMoEngageScript();
    this.addPostHogScript();
  }

  /**
   * Tracks a signup event in Matomo analytics.
   *
   * @param {number} userId - A numerical value associated with the event (optional).
   * @returns {void}
   */
  matomoSetUserId(userId?: string): void {
    if (
      !(
        environment.env_id === 'production' || environment.env_id === 'zilMoney'
      )
    ) {
      return;
    }
    _paq.push(['setUserId', userId]);
  }

  /**
   * Tracks a signup event in Matomo analytics.
   *
   * @param {string} category - The category of the event (e.g., 'Signup').
   * @param {string} action - The action that occurred (e.g., 'Click').
   * @param {string} label - A label to provide additional information (optional).
   * @param {number} value - A numerical value associated with the event (optional).
   * @returns {void}
   */
  trackMatomoEvent(
    category: string,
    action?: string,
    label?: string,
    value?: string,
    additionalInfo?: Record<string, string>
  ): void {
    if (
      !(
        environment.env_id === 'production' || environment.env_id === 'zilMoney'
      )
    ) {
      return;
    }
    _paq.push(['trackEvent', category, action, label, value, additionalInfo]);
  }

  /** Smart Container Script */
  smartContainerScript(): void {
    if (
      environment.env_id === 'production' ||
      environment.env_id === 'zilMoney'
    ) {
      this.addScript(
        '',
        '',
        `https://nexus.ensighten.com/choozle/18987/Bootstrap.js`,
        { async: true }
      );
    }
  }

  googleTagManger(): void {
    if (environment.env_id === 'production') {
      this.addScript(googleTagManager.production[0]);
      this.addNoScript(
        '',
        '',
        'https://www.googletagmanager.com/ns.html?id=GTM-WJG66WM'
      );
    } else if (environment.env_id === 'staging') {
      this.addScript(googleTagManager.staging[0]);
      this.addNoScript(
        '',
        '',
        'https://www.googletagmanager.com/ns.html?id=GTM-M5ZCFHK7'
      );
    } else if (environment.env_id === 'zilMoney') {
      this.addScript(googleTagManager.zilMoney[0]);
      this.addNoScript(
        '',
        '',
        'https://www.googletagmanager.com/ns.html?id=GTM-572KZ8WH'
      );
      
      // added for Langoor team
      this.addScript(googleTagManager.zilMoney[1]);
      this.addNoScript(
        '',
        '',
        'https://www.googletagmanager.com/ns.html?id=GTM-57CW6XB5'
      );
    }
  }

  /**
   * Loads the SEON SDK script dynamically and initializes fingerprinting on load
   */
  seonScript(): void {
    const sdkUrl = 'https://cdn.seonintelligence.com/js/v6/agent.umd.js';
    try {
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = sdkUrl;
      s.async = true;
      s.onload = () => this.initSeonSession();
      document.body.appendChild(s);
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error loading SEON script - ${error}`));
    }
  }

  private async initSeonSession(): Promise<void> {
    try {
      if (!window.seon) {
        return;
      }
      window.seon.init();
      const config = {
        geolocation: { enabled: true, canPrompt: false },
        networkTimeoutMs: 2000,
        fieldTimeoutMs: 2000,
        region: 'us' as const,
        silentMode: true
      };
      const session = await window.seon.getSession(config);
      if (session) {
        this._localStorageService.setItem('seonSessionId', session);
      }
    } catch (error) {
      this.errorHandler.handleError(new Error(`ScriptService: Error initializing SEON session - ${error}`));
    }
  }

  // post hog tracking - script based
  addPostHogScript(){
    if (
      !environment.production ||
      !environment?.ocw_trackers?.postHog?.enabled
    ) {
      return;
    }

    // A Super Admin "Log into Live" session is the agent's activity, not the
    // customer's, so the SDK is never started for it.
    if (this.postHogService.isAdminImpersonationSession()) {
      return;
    }

    this.addScript(postHog,'posthog-script','',{async:true});
    this.postHogService.clearStaleSuperProperties();

  }

}
