import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import {
  POSTHOG_ALLOWED_EVENTS,
  POSTHOG_EVENT_PROPERTY_ALLOWLIST,
  POSTHOG_INGEST_PROPERTY_KEYS,
  POSTHOG_PERSON_PROPERTY_KEYS
} from 'src/app/data/scripts/posthog-events';

const localStorageService = new LocalStorageService();
export const blockClickjackingScriptExceptionDomains: string[] = [];

/**  SITE 24*7  */
export const loadSite24_7 = [
  `
(function (w, d, s, r, k, h, m) {
    if (w.performance && w.performance.timing && w.performance.navigation) {
    w[r] = w[r] || function () { (w[r].q = w[r].q || []).push(arguments) };
    h = d.createElement('script'); h.async = true; h.setAttribute('src', s + k);
    d.getElementsByTagName('head')[0].appendChild(h);
    (m = window.onerror), (window.onerror = function (b, c, d, f, g) {
        m && m(b, c, d, f, g), g || (g = new Error(b)), (w[r].q = w[r].q || []).push(["captureException", g]);
    })
    }
    })(window, document, '//static.site24x7rum.com/beacon/site24x7rum-min.js?appKey=', 's247r', '14477e28e6611095f7a1ec9e5f610a81');
`
];


/**  GOOGLE ANALYTICS  */
export const googleAnalytics = [
  `https://www.googletagmanager.com/gtag/js?id=${environment?.ocw_trackers?.googleAnalytics?.data?.key}`,
  `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${environment?.ocw_trackers?.googleAnalytics?.data?.key}');
    `
];

/** ZOHO CHAT */
export const zoho = [
  `
      var $zoho = $zoho || {};
      $zoho.salesiq = $zoho.salesiq || {
        widgetcode: "${environment?.ocw_trackers?.zohoSupportChatWidget?.data
          ?.widgetId!}",
        values: {},
        ready: function () {}
      };
      var d = document;
      s = d.createElement("script");
      s.type = "text/javascript";
      s.id = "zsiqscript";
      s.defer = true;
      s.src = "https://salesiq.zoho.com/widget";
      t = d.getElementsByTagName("script")[0];
      t.parentNode.insertBefore(s, t);
    `,
  `
     var $zoho = $zoho || {};
     $zoho.salesiq = $zoho.salesiq || {
       widgetcode: "${environment?.ocw_trackers?.zohoSupportChatWidget?.data
         ?.adpWidgetId!}",
       values: {},
       ready: function () {}
     };
     var d = document;
     s = d.createElement("script");
     s.type = "text/javascript";
     s.id = "zsiqscript";
     s.defer = true;
     s.src = "https://salesiq.zoho.com/widget";
     t = d.getElementsByTagName("script")[0];
     t.parentNode.insertBefore(s, t);
     `
];

/** FACEBOOK PIXELS */
export const faceBookPixels = [
  `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '300240080556305');
      fbq('track', 'PageView');
    `,
  `
      <img height="1" width="1"   src="https://www.facebook.com/tr?id=300240080556305&ev=PageView&noscript=1"/>
    `
];

/** SIGN UP CONVERSION CODE TRACKING */
export const signupConversionTrackingCode = [
  `
  gtag('event', 'conversion', {'send_to': 'AW-871139145/LAy_COmaqesBEMmOsp8D'});
    `
];

export const outBrainScript = [
  ` !function(_window, _document) {
    var OB_ADV_ID = '00048f6fa6d50f5308ae286441ac42b42c';
    if (_window.obApi) {
      var toArray = function(object) {
        return Object.prototype.toString.call(object) === '[object Array]' ? object : [object];
      };
      _window.obApi.marketerId = toArray(_window.obApi.marketerId).concat(toArray(OB_ADV_ID));
      return;
    }
    var api = _window.obApi = function() {
      api.dispatch ? api.dispatch.apply(api, arguments) : api.queue.push(arguments);
    };
    api.version = '1.1';
    api.loaded = true;
    api.marketerId = OB_ADV_ID;
    api.queue = [];
    var tag = _document.createElement('script');
    tag.async = true;
    tag.src = '//amplify.outbrain.com/cp/obtp.js';
    tag.type = 'text/javascript';
    var script = _document.getElementsByTagName('script')[0];
    script.parentNode.insertBefore(tag, script);
  }(window, document);

  obApi('track', 'PAGE_VIEW');
  `
];

export const siftTrackingScript = [
  `
  var _sift = window._sift = window._sift || [];
  _sift.push(['_setAccount', 'f6917da219']);
  _sift.push(['_setUserId', '${localStorageService.getItem('userId')}']);
  // _sift.push(['_setSessionId', _session_id]);
  _sift.push(['_trackPageview']);

 (function() {
   function ls() {
     var e = document.createElement('script');
     e.src = 'https://cdn.sift.com/s.js';
     document.body.appendChild(e);
   }
   if (window.attachEvent) {
     window.attachEvent('onload', ls);
   } else {
     window.addEventListener('load', ls, false);
   }
 })();
 `
];

export const g2Script = [
  `(function (c, p, d, u, id, i) {
    id = ''; // Optional Custom ID for user in your system
    u = 'https://tracking.g2crowd.com/attribution_tracking/conversions/' + c + '.js?p=' + encodeURI(p) + '&e=' + id;
    i = document.createElement('script');
    i.type = 'application/javascript';
    i.async = true;
    i.src = u;
    d.getElementsByTagName('head')[0].appendChild(i);
  }("1010316", document.location.href, document));`
];

export const microsoftUETScript = [
  `
    (function(w, d, t, r, u) {
      var f, n, i;
      w[u] = w[u] || [], f = function() {
          var o = {
              ti: "187021903"
          };
          o.q = w[u], w[u] = new UET(o), w[u].push("pageLoad")
      }, n = d.createElement(t), n.src = r, n.async = 1, n.onload = n.onreadystatechange = function() {
          var s = this.readyState;
          s && s !== "loaded" && s !== "complete" || (f(), n.onload = n.onreadystatechange = null)
      }, i = d.getElementsByTagName(t)[0], i.parentNode.insertBefore(n, i)
  })(window, document, "script", "//bat.bing.com/bat.js", "uetq");
  `
];

export const ipQualityScore = [
  `
 if(typeof Startup !== "undefined") {
  Startup.Store('userID', '${localStorageService.getItem('userId')}');
  }

  if(typeof Startup !== "undefined") {
    Startup.AfterResult(function(result){
        $.ajax({                type: "POST",
            url: "${environment?.rootUrl}/save-device-id",
            data: JSON.stringify({ result}),
            contentType: "application/json; charset=utf-8",
            headers: {
              Authorization: "Bearer " + localStorage.getItem('appToken')
            },
            dataType: "json",
            success: function(data){},
            error: function(errMsg) {
            }
        });
    });

    Startup.AfterFailure(function(reason){
    });
  }

  `
];

export const matomo = {
  production: [
    `
  var _paq = window._paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(["setDocumentTitle", document.domain + "/" + document.title]);
  _paq.push(["setCookieDomain", "*.onlinecheckwriter.com"]);
  _paq.push(["setDomains", ["*.onlinecheckwriter.com","*.live.onlinecheckwriter.com"]]);
  _paq.push(["enableCrossDomainLinking"]);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://zilmoney.matomo.cloud/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '2']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src='//cdn.matomo.cloud/zilmoney.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
  })();
  `,
    `
  var _mtm = window._mtm = window._mtm || [];
  _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
  (function() {
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src='https://cdn.matomo.cloud/zilmoney.matomo.cloud/container_2Cw5vtmw.js'; s.parentNode.insertBefore(g,s);

  })();
  `
  ],
  zilMoney: [
    `
 var _paq = window._paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(["setCookieDomain", "*.zilmoney.com"]);
  _paq.push(["setDocumentTitle", document.domain + "/" + document.title]);
  _paq.push(["setDomains", ["*.zilmoney.com","*.app.zilmoney.com"]]);
  _paq.push(["enableCrossDomainLinking"]);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://zilmoney.matomo.cloud/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
  })();
  `
  ]
};

export const googleTagManager = {
  production: [
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WJG66WM');
    `,
  ],
  staging: [
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-M5ZCFHK7');
    `,
  ],
  zilMoney: [
    `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-572KZ8WH');
    `,
    `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-57CW6XB5');
    `,
    
  ]
};

/** MOENGAGE TRACKING */
export const moEngage = {
  production: [
    `
    (function(t){function e(e){for(var n,o,i=t.l,a=0;a<i.length;a++)try{if(n=i[a].q,i[a].q=function(){},n.call(e),o=!0)break}catch(t){o=!1}if(!o)for(var r=t.l,s=[],c=0;c<r.length;c++)s.push(r[c]);t.l=s}var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js";var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),t.moengage_q=e,t.moengage_l=[],t.moengage=function(e){t.moengage_l.push(e)},t.moengage("init",{app_id:"${environment?.ocw_trackers?.moEngage?.data?.appId}"});
    `
  ],
  staging: [
    `
    (function(t){function e(e){for(var n,o,i=t.l,a=0;a<i.length;a++)try{if(n=i[a].q,i[a].q=function(){},n.call(e),o=!0)break}catch(t){o=!1}if(!o)for(var r=t.l,s=[],c=0;c<r.length;c++)s.push(r[c]);t.l=s}var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js";var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),t.moengage_q=e,t.moengage_l=[],t.moengage=function(e){t.moengage_l.push(e)},t.moengage("init",{app_id:"1QYQOIX23E8ZBGDI70W8U1P6_DEBUG"});
    `
  ],
  zilMoney: [
    `
    (function(t){function e(e){for(var n,o,i=t.l,a=0;a<i.length;a++)try{if(n=i[a].q,i[a].q=function(){},n.call(e),o=!0)break}catch(t){o=!1}if(!o)for(var r=t.l,s=[],c=0;c<r.length;c++)s.push(r[c]);t.l=s}var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js";var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),t.moengage_q=e,t.moengage_l=[],t.moengage=function(e){t.moengage_l.push(e)},t.moengage("init",{app_id:"${environment?.ocw_trackers?.moEngage?.data?.appId}"});
    `
  ]
  
};

export const postHog = `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
!function(){var a=${JSON.stringify(POSTHOG_ALLOWED_EVENTS)},p=${JSON.stringify(POSTHOG_EVENT_PROPERTY_ALLOWLIST)},i=${JSON.stringify(POSTHOG_INGEST_PROPERTY_KEYS)},s=${JSON.stringify(POSTHOG_PERSON_PROPERTY_KEYS)};posthog.init('${environment?.ocw_trackers?.postHog?.data?.id}',{api_host:'https://us.i.posthog.com',defaults:'2026-01-30',person_profiles:'identified_only',autocapture:false,capture_pageview:false,capture_pageleave:false,capture_performance:false,rageclick:false,enable_heatmaps:false,disable_surveys:true,capture_dead_clicks:false,advanced_disable_feature_flags:true,advanced_disable_feature_flags_on_first_load:true,before_send:function(e){if(!e)return null;if(e.event==='$snapshot')return e;if(a.indexOf(e.event)===-1)return null;var n=p[e.event];if(n){var o=e.properties||{},r={$geoip_disable:true},k;for(k in o){if(n.indexOf(k)!==-1||i.indexOf(k)!==-1||s.indexOf(k)!==-1)r[k]=o[k]}e.properties=r}return e}})}();`;