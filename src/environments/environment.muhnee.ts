import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  env_id: 'muhnee',
  productName: 'Muhnee',

  rootUrl: 'https://api.app.muhnee.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntpsikpeyn',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',

  zoho__support_chat:
    'https://salesiq.zoho.com/signaturesupport.ls?widgetcode=8cc7099c1c9772f4ab6016c626d7bc703bbecdb3af5643c7c693d607ac91dc77',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },

  support_phone_number: '2025737733',
  support_email: 'support@muhnee.com',
  support_website: 'https://help.muhnee.com',

  from_email: 'noreply@muhnee.com',
  terms_and_conditions: 'https://www.muhnee.com/legal',
  website: 'https://www.muhnee.com',
  help_website: 'https://help.muhnee.com',
  payment_short_link: 'https://pay.muhnee.com',
  api_documentation: 'https://developers.muhnee.com',
  cloud_bank: {
    id: 'cloudBank',
    label: 'cloud bank',
    terms_and_conditions: 'https://www.muhnee.com/legal'
  },

  socialLoginVisible: true,
  bankAccountDetailsUsingRoutingNo: false,
  ocw_trackers: {
    googleTagManager: { enabled: true, data: { key: 'GTM-W3999KV' } },
    zohoSupportChatWidget: {
      enabled: true,
      data: {
        widgetId:
          '8cc7099c1c9772f4ab6016c626d7bc703bbecdb3af5643c7c693d607ac91dc77'
      }
    }
  },
  version: '3.5.0',
};
