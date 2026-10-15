import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: false,
  env_id: 'production',
  productName: 'Online Check Writer',

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
  website: 'https://onlinecheckwriter.com',

  ocw_trackers: {
    site24_7: { enabled: true },
    faceBookPixel: { enabled: true },
    awinConverstionCode: { enabled: true },
    siftTracking: { enabled: true },
    outBrain: { enabled: true },
    cjSite: { enabled: true },
    gtagEvent: { enabled: true },
    dataLayerPush: { enabled: true },
    trueConversionTracking: { enabled: true, data: { key: 26030 } },
    googleAnalytics: { enabled: true, data: { key: 'G-2E33BTDF17' } },
    googleTagManager: { enabled: true, data: { key: 'GTM-WJG66WM' } },
    zohoSupportChatWidget: {
      enabled: true,
      data: {
        widgetId:
          '9bba3e1c423f1c1a4681f108a05c197caeffefa022d38e39f278a36b8384567858652774674ca0e217bb31185d25f1bc',
        adpWidgetId:
          'b6b0587c74afe3e14d1f3c9c5dfaa7db5d8aca8b016a45bfb2a7d61e5d77dc22ae8a156990edd154f0c71c6b7ae21778'
      }
    },
    microsoftUET: { enabled: true },
    postHog: { enabled: true, data: { id: 'phc_ooh5wHR7ZhtWm9qFPPrfZwZ5pFgwBmuRYDrp4tGEjkav' } },

  },
  version: '3.5.0',
  isV4Persona: true,
  loomPublicId: '6e9c7ea9-b139-42d3-9e14-a599e84668bb',
  providerType:'regular',
};
