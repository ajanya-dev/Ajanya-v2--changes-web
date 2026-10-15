export interface IIpSecurity {
  success: boolean;
  errorCode: number;
  errorMsg: string;
  event_token: string;
  user_email: string;
}


export interface SeonGeolocationConfig {
  enabled: boolean;
  canPrompt: boolean;
}

export interface SeonConfig {
  geolocation: SeonGeolocationConfig;
  networkTimeoutMs: number;
  fieldTimeoutMs: number;
  region: 'us';
  silentMode: boolean;
}

export interface SeonDeviceDetails {
  deviceId: string;
  ipAddress: string;
  [key: string]: unknown;
}

export interface SeonSession {
  deviceDetails?: SeonDeviceDetails;
  sessionId?: string;
  fingerprint?: string;
  [key: string]: unknown;
}

export interface SeonSDK {
  init(): void;
  getSession(config: SeonConfig): Promise<SeonSession>;
}
