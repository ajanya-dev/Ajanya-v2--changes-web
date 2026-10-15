export class UserData {
  static getGettingStartedCards() {
    return [
      {
        level: 'Level 1',
        icon1: ['fat', 'envelope'],
        icon2: ['fat', 'mobile'],
        iconPartiallyCompleted: ['fat', 'mobile'],
        content: 'Verify Email & Phone',
        contentPartiallyCompleted: 'Verify Phone',
        features: ['Check Printing', 'Check Mail', 'Check Email'],
        stepCompleted: false,
        stepPartiallyCompleted: false,
        stepRejected: false,
        cardColor: 'bg-tertiary-background-color',
        onClickUrl: '/manage/users/verify-email-phone'
      },
      {
        level: 'Level 2',
        icon1: ['fat', 'user-tie-hair'],
        content: 'Personal Verification',
        features: [
          'Cloud Banking',
          'Instant Payment',
          'Multiple Business Bank Accounts',
          'Virtual & Physical Cards',
          'ACH Payment'
        ],
        stepCompleted: false,
        stepRejected: false,
        cardColor: 'bg-secondary-background-color',
        onClickUrl: '/manage/users/verify-user-id?type=8'
      },
      {
        level: 'Level 3',
        icon1: ['fat', 'user-tie-hair'],
        content: 'Business Verification',
        features: [
          'Cloud Banking',
          'Instant Payment',
          'Multiple Business Bank Accounts',
          'Virtual & Physical Cards',
          'ACH Payment',
          'Payroll By Credit Cards'
        ],
        stepCompleted: false,
        stepRejected: false,
        cardColor: 'bg-common-secondary-violet-color',
        onClickUrl: '/manage/users/verify-user-id?type=7'
      }
    ];
  }

  static monthlyRevenue(): { key: string; value: string }[] {
    return [
      { key: '50000', value: '<$50K' },
      { key: '100000', value: '~$100K' },
      { key: '500000', value: '~$500K' },
      { key: '1000000', value: '~$1M' },
      { key: '1000000', value: '>$1M' }
    ];
  }
}
