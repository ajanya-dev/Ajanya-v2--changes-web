import { VERIFICATION_CARDS } from '../constants/verification-center.constants';

export type VerificationCenterCard = keyof typeof VERIFICATION_CARDS;

export type VerificationCenterCardsValue =
  (typeof VERIFICATION_CARDS)[VerificationCenterCard];
