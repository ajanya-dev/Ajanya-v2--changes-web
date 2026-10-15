import { IAppConfig } from 'src/app/models/app_settings';

export const configObject: IAppConfig = {
  emailFromAddress: '',
  emailFromName: '',
  hideLoginWithButton: '0',
  hideSignup: '0',
  hideSubscriptionPlan: '0',
  loginPageBackground: 'background: #5b53c2;',
  loginPageFooterText: '© 2024 OnlineCheckWriter.com LLC',
  test: 'localhost',
  userId: '',
  websiteHeaderBody: '',
  websiteIconUrl: 'https://live.onlinecheckwriter.com/favicon.ico',
  websiteLogo:
    'https://live.onlinecheckwriter.com/assets/images/logos/logo_svg_green.svg',
  websiteTitle: 'OnlineCheckWriter',
  websiteUrl: 'live.onlinecheckwriter.com',
  welcomeText: '',
  whiteLogo:
    'https://live.onlinecheckwriter.com/assets/images/logos/logo_svg_white.svg',
  zilMoneyLogo:
    'https://live.onlinecheckwriter.com/assets/images/logos/Zil_Money_logo.svg',
  zilMoneyESignatureAgreement: ''
};

export const dynamicHeaderOverallData = {
  bankAcc: 215,
  cloudBalance: '17,969.63',
  cloudBankExist: 1,
  creditCards: 4,
  walletBalance: '670.91'
};

export const headerNotificationData = [
  {
    id: 'id',
    readAt: false,
    createdAt: '03/02/2024 06:49 am',
    viewedAt: '03/02/2024 06:49 am',
    notification: {
      action_link: '/intro-tour/manage/home',
      discription: 'First notification',
      icon: 'fa fa-bank',
      title: 'Bank Account Added',
      type: 'no type'
    },
    dateDuaration: '5 days ago'
  },
  {
    id: 'id',
    readAt: false,
    createdAt: '03/02/2024 06:49 am',
    viewedAt: '03/02/2024 06:49 am',
    notification: {
      action_link: '/intro-tour/manage/home',
      discription: 'First notification',
      icon: 'fa fa-bank',
      title: 'Second notification',
      type: 'no type'
    },
    dateDuaration: '5 days ago'
  }
];

export const allCompanies = {
  activeCompanyName: 'Intro company',
  invitedCompanies: [],
  user_id: 'userid',
  ownCompanies: [
    {
      companyId: 'company id',
      companyLogo: 'business/65c8f574-a579-4da7-91c0-a303b84a4d5c.jpg',
      companyLogoUrl:
        'https://ocw-local-s3.s3.amazonaws.com/business/65c8f574-a579-4da7-91c0-a303b84a4d5c.jpg',
      companyName: 'company one',
      id: 0,
      isClosed: 0,
      type: 'type',
      businessInfo: undefined,
      isItDefault: 1
    },
    {
      companyId: 'company id',
      companyLogo: 'business/65c8f574-a579-4da7-91c0-a303b84a4d5c.jpg',
      companyLogoUrl:
        'https://ocw-local-s3.s3.amazonaws.com/business/65c8f574-a579-4da7-91c0-a303b84a4d5c.jpg',
      companyName: 'company two',
      id: 0,
      isClosed: 0,
      type: 'type',
      businessInfo: undefined,
      isItDefault: 1
    }
  ]
};
