import { IDynamicWhiteLabel } from '../model/dynamic-white-label.model';

export class WhiteLabel {
  static dynamicWhiteLabelData(): IDynamicWhiteLabel[] {
    return [
      {
        environmentId: 'production',
        attributes: {
          name: 'Online Check Writer',
          cloudAppName: 'Zil'
        },
        flags: {
          isApplicationInOCWMode: true,
          isSliderDescriptionHidden: true,
          isDocumentationShown: true,
          isWebhookDocumentationShown: true,
          isZilBankAdShown: true,
          isThirdPartyImportEnabled: false,
          isShowMobileAppDownloadScreen: true,
          isShowVerificationLetter: true
        }
      },
      {
        environmentId: 'staging',
        attributes: {
          name: 'Online Check Writer',
          cloudAppName: 'Zil'
        },
        flags: {
          isApplicationInOCWMode: true,
          isSliderDescriptionHidden: true,
          isDocumentationShown: true,
          isWebhookDocumentationShown: true,
          isZilBankAdShown: true,
          isThirdPartyImportEnabled: false,
          isShowMobileAppDownloadScreen: true,
          isShowVerificationLetter: true
        }
      },
      {
        environmentId: 'staging_dev',
        attributes: {
          name: 'Online Check Writer',
          cloudAppName: 'Zil'
        },
        flags: {
          isApplicationInOCWMode: true,
          isSliderDescriptionHidden: true,
          isDocumentationShown: true,
          isWebhookDocumentationShown: true,
          isZilBankAdShown: true,
          isThirdPartyImportEnabled: false,
          isShowMobileAppDownloadScreen: false,
          isShowVerificationLetter: true
        }
      },
      {
        environmentId: 'sebipay',
        attributes: {
          name: 'Online Check Writer',
          cloudAppName: 'Zil'
        },
        flags: {
          isThirdPartyImportEnabled: false,
          isShowVerificationLetter: true
        }
      },
      {
        environmentId: 'muhnee',
        attributes: {
          name: 'Muhnee',
          cloudAppName: 'Muhnee',
          cloudAppLogo: '/assets/white_label/muhnee/assets/app_logo.svg'
        },
        flags: {
          isLoginRestricted: true,
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          isThirdPartyImportEnabled: true,
          isWhiteLabel: true,
          hidePayroll: true
        }
      },
      {
        environmentId: 'sandbox',
        attributes: {
          name: 'Online Check Writer',
          cloudAppName: 'Zil'
        },
        flags: {
          isDocumentationShown: true,
          isWebhookDocumentationShown: true,
          isThirdPartyImportEnabled: false,
          isZilBankAdShown: true,
          isShowVerificationLetter: true
        }
      },
      {
        environmentId: 'ameztech',
        attributes: {
          name: 'Ameztech',
          cloudAppLogo: '/assets/white_label/ameztech/assets/app_logo.svg',
          cloudAppName: 'Ameztech'
        },
        flags: {
          isSingleSideUIEnabled: true,
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          isThirdPartyImportEnabled: true,
          isWhiteLabel: true,
          hidePayroll: true
        }
      },
      {
        environmentId: 'zilMoney',
        attributes: {
          name: 'Zil Money',
          bankName: 'Zil Money',
          cloudAppName: 'Zil'
        },
        flags: {
          isApplicationInZilMoneyMode: true,
          isSliderDescriptionHidden: true,
          isThirdPartyImportEnabled: false,
          isShowVerificationLetter: true,
          isShowMobileAppDownloadScreen: true
        }
      },
      {
        environmentId: 'fostersear-sandbox',
        attributes: {
          name: 'Fostersear'
        },
        flags: {
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          isThirdPartyImportEnabled: true,
          isWhiteLabel: true,
          hidePayroll: true
        }
      },
      {
        environmentId: 'quickbanked-sandbox',
        attributes: {
          name: 'QuickBanked',
          bankName: 'QuickBanked',
          walletMigrationVideo:
            'https://cdn.onlinecheckwriter.com/video-tutorial/QB-wallet-video.mp4',
          cloudAppLogo: '/assets/white_label/quickbanked/assets/app_logo.svg',
          cloudAppName: 'QuickBanked'
        },
        flags: {
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          subscriptionHide: true,
          hidePaymentTable: true,
          hideRecievables: true,
          hideBill: true,
          hideThirdPartyApps: true,
          isThirdPartyImportEnabled: true,
          isWhiteLabel: true,
          hidePayroll: true,
          hideWorkingCaptal: true,
          quickbankTermsAndCondition: true,
          hideNotificationBanner: true,
          hideDemoButton: true,
          hideLiveChat: true,
          isWhitelableSidebar: true
        }
      },
      {
        environmentId: 'quickbanked',
        attributes: {
          name: 'QuickBanked',
          bankName: 'QuickBanked',
          walletMigrationVideo:
            'https://cdn.onlinecheckwriter.com/video-tutorial/QB-wallet-video.mp4',
          cloudAppLogo: '/assets/white_label/quickbanked/assets/app_logo.svg',
          cloudAppName: 'QuickBanked'
        },
        flags: {
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          subscriptionHide: true,
          hidePaymentTable: true,
          hideRecievables: true,
          hideBill: true,
          hideThirdPartyApps: true,
          isThirdPartyImportEnabled: true,
          isWhiteLabel: true,
          hidePayroll: true,
          hideWorkingCaptal: true,
          quickbankTermsAndCondition: true,
          hideNotificationBanner: true,
          hideDemoButton: true,
          hideLiveChat: true
        }
      },
      {
        environmentId: 'compass',
        attributes: {
          name: 'Compass',
          bankName: 'Compass',
          cloudAppName: 'Compass',
          payeeName: 'Vendor'
        },
        flags: {
          hideShop: true,
          hideReferAndEarn: true,
          hideCentralReport: true,
          hideViewMore: true,
          subscriptionHide: true,
          hideRecievables: true,
          hideBill: true,
          isWhiteLabel: true,
          hidePayroll: true,
          hideWorkingCaptal: true,
          isCompassRequirement: true,
          isAddCreditCardRestricted: true,
          hideDemoButton: true,
          hideLoginPageFooterText: true,
          hideVirtualCard: true,
          hidePaymentTableFilter: true,
        }
      },
      {
        environmentId: 'buckzy',
        attributes: {
          name: 'Buckzy',
          bankName: 'Buckzy',
          cloudAppName: 'Buckzy'
        },
        flags: {
          isWhiteLabel: true,
          hideDemoButton: true,
          hideReferAndEarn: true,
          hideBusinessTools: true
        }
      },
      {
        environmentId: 'buckzy-sandbox',
        attributes: {
          name: 'Buckzy',
          bankName: 'Buckzy',
          cloudAppName: 'Buckzy'
        },
        flags: {
          isWhiteLabel: true,
          hideDemoButton: true,
          hideReferAndEarn: true,
          hideBusinessTools: true
        }
      },
      {
        environmentId: 'olliepay',
        attributes: {
          name: 'OlliePay',
          bankName: 'OlliePay'
        },
        flags: {
          isWhiteLabel: true,
          hideReferAndEarn: true,
          hideBusinessTools: true,
          hideThirdPartyApps: true,
          hidePayroll: true,
          hideDemoButton: true,
          hideLiveChat: true
        }
      },
      {
        environmentId: 'archarina',
        attributes: {
          name: 'Archarina',
          bankName: 'Archarina'
        },
        flags: {
          isWhiteLabel: true,
          hideReferAndEarn: true,
          hideBusinessTools: true,
          hideThirdPartyApps: true,
          hidePayroll: true,
          hideDemoButton: true,
          hideLiveChat: true,
          isArcharina: true,
          hideLoginPageFooterText: true,
          hideVirtualCard: true
        }
      },
      {
        environmentId: 'archarina-sandbox',
        attributes: {
          name: 'Archarina',
          bankName: 'Archarina'
        },
        flags: {
          isWhiteLabel: true,
          hideReferAndEarn: true,
          hideBusinessTools: true,
          hideThirdPartyApps: true,
          hidePayroll: true,
          hideDemoButton: true,
          hideLiveChat: true,
          isArcharina: true,
          hideLoginPageFooterText: true,
          hideVirtualCard: true
        }
      },
      {
        environmentId: 'csnhc',
        attributes: {
          name: 'CSNHC',
          bankName: 'CSNHC'
        },
        flags: {
          isWhiteLabel: true,
          hideReferAndEarn: true,
          hideBusinessTools: true,
          hideThirdPartyApps: true,
          hidePayroll: true,
          hideDemoButton: true,
          hideLiveChat: true,
          hideLoginPageFooterText: true,
          hideVirtualCard: true,
          isCSNHCRequirement: true,
          hideRecievables: true,
          hideBill: true,
          hidePaymentTableFilter: true,
          isThirdPartyImportEnabled: true,
        }
      }
    ];
  }
}
