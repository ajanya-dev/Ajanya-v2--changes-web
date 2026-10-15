export interface IResetPasswordConfig {
  title: string;
  subtitle: string;
  mainButtonText: string;
  secondaryButtonText: string;
}

export interface IResetPasswordInitialData {
  email?: string;
  externalToken?: string;
}

export interface IResetPasswordFormData {
  email: string;
  password: string;
  passwordConfirmation: string;
  externalToken?: string;
  termsAndCondition: boolean;
}

export interface IResetPasswordResult {
  action: 'cancel' | 'reset' | 'logout';
  data?: {
    password: string;
    confirmPassword: string;
  };
}

export interface IResetPasswordDialogData {
  config?: IResetPasswordConfig;
  initialData?: IResetPasswordInitialData;
}