import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: false,
  env_id: 'zilMoney',
  productName: 'Zil Money',

  rootUrl: 'https://app.onlinecheckwriter.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntpsikpeyn',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  recaptcha: { siteKey: '6Ldm9iAjAAAAAHnLxD1x7fcD3k183ywUbma9vemK' },

  website: 'https://zilmoney.com/',

  showOcwInitialLoader: false,
  ocw_trackers: {
    site24_7: { enabled: true },
    faceBookPixel: { enabled: true },
    awinConverstionCode: { enabled: true },
    siftTracking: { enabled: true },
    outBrain: { enabled: true },
    cjSite: { enabled: true },
    gtagEvent: { enabled: true },
    dataLayerPush: { enabled: true },
    googleAnalytics: { enabled: false, data: { key: 'G-3BM9978RTC' } }, // Disabled for ZilMoney as per the business analysis request.
    googleTagManager: { enabled: true, data: { key: 'GTM-572KZ8WH' } },
    zohoSupportChatWidget: {
      enabled: true,
      data: {
        widgetId:
          '9bba3e1c423f1c1a4681f108a05c197caeffefa022d38e39f278a36b8384567858652774674ca0e217bb31185d25f1bc'
      }
    },
    moEngage: { enabled: true, data: { appId: 'P064I4UX0PE6VONTP3Y42EXT' } },
    postHog: { enabled: true, data: { id: 'phc_r6YhMqjaodjrRHQk3EXmyq3HRXztHp3YBR68HnChudpo' } },
    
  },
  isV4Persona: true,
  version: '3.5.0',
  support_email: 'support@zilmoney.com',
  providerType:'zilmoney'
};
