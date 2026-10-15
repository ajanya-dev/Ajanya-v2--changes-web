export interface IAppState {
  appUser: IAppUser;
  layoutVariables: ILayoutVariables;
  main?: unknown;
}

export interface IAppUser {
  isUserLoggedIn: boolean;
}

export interface ILayoutVariables {
  emailVerified: number;
  phoneVerified: number;
  activeCompanyName: string;
  achEnabled: number;
  internationalPaymentEnabled: number;
  pingPongEnabled: number;
  email: string;
  userId: number;
  phone: string;
  encryptedUserId: string;
  isSubscribed: number;
  companyName: string;
  profilePicLink: string;
}
