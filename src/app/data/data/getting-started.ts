export class GettingStarted {
  static gettingStartedLogic(): any {
    return [
      {
        gettingStartedStatusCode: 0,
        gettingStartedState: 'Getting Started',
        gettingStartedProgress: 0,
        isGettingStartedEnabled: false
      },
      {
        gettingStartedStatusCode: 1,
        gettingStartedState: 'Verify Your Email and Phone',
        gettingStartedProgress: 0,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 2,
        gettingStartedState: 'Verify Your Email',
        gettingStartedProgress: 10,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 3,
        gettingStartedState: 'Verify Your Phone Number',
        gettingStartedProgress: 10,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 4,
        gettingStartedState: 'Link Your Bank Account',
        gettingStartedProgress: 25,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 5,
        gettingStartedState: 'Verify Your Bank Account',
        gettingStartedProgress: 50,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 6,
        gettingStartedState: 'Add First Payee',
        gettingStartedProgress: 65,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 7,
        gettingStartedState: 'Create First Payment',
        gettingStartedProgress: 80,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 8,
        gettingStartedState: 'Verify Information',
        gettingStartedProgress: 80,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 9,
        gettingStartedState: 'Verify Business',
        gettingStartedProgress: 80,
        isGettingStartedEnabled: true
      },
      {
        gettingStartedStatusCode: 10,
        gettingStartedState: 'Done',
        gettingStartedProgress: 100,
        isGettingStartedEnabled: false
      }
    ];
  }
}
