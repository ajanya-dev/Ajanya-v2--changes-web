import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: false,
  socialLoginVisible: false,
  env_id: 'sandbox',
  productName: 'Online Check Writer',

  rootUrl: 'https://test.onlinecheckwriter.com/api/v4',
  mailMasterUrl: 'https://mm-app.sebipay.com/api/v1',

  ocwapiurl: 'https://master.api.ocw-api.sebipay.com',
  help_website: 'https://onlinecheckwriter.com/contact',

  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: 'd4f16ba5806aa696a822', cluster: 'mt1' },
  ocw_trackers: {
    zohoSupportChatWidget: {
      enabled: true,
      data: {
        widgetId:
          'siq12c4904ead50ad8c2748ef135d9ddccf3be4e70e21c63a1d7d972f730a64bb89'
      }
    }
  },
  isV4Persona: true,
  version: '3.5.0',
  providerType:'regular',
};
