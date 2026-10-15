export type TCardsTabs = 'credit' | 'cloud' | 'sent' | 'recieved';

export type ThreeDSError = {
  refId: string;
  message: string;
  type: string;
  error: Error;
};

export type ThreeDSFailure = {
  code: string;
  message: string;
};

export type ThreeDSComplete = {
  xid: string;
  cavv: string;
  eci: string;
  cardHolderAuth: string;
  threeDsVersion: string;
  directoryServerId: string;
  cardHolderInfo: string;
};

export type ThreeDsInstance = { start: VoidFunction; unmount: VoidFunction };
