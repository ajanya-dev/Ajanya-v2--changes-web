import { Observable } from 'rxjs';
import { LucideIconData } from 'lucide-angular';
import { IAddCardResponse } from 'src/app/shared/modal/add-credit-card/add-credit-card.model';
import {
  ActionCaseKind,
  VerificationStepKey
} from '../constants/verification-v4.constants';

export interface StepDetails {
  longDescription: string;
  benefits: string[];
  requirements: string[];
  timeRequired: string;
}

export type VerifiableItemKey = 'email' | 'phone';

/** Which kind of payment source the user chose in the source modal. */
export type PaymentSourceKind = 'bank' | 'card';

export interface StepChecklistItem {
  text: string;
  /** When set, the item shows a "Verified" pill once that flag is true. */
  verifyKey?: VerifiableItemKey;
  /** Replaces `text` once the item is verified. */
  verifiedText?: string;
  preVerified?: boolean;
  /** Bullet icon shown instead of the default check mark. */
  icon?: LucideIconData;
}

/** Description variants for a step whose copy depends on email/phone state. */
export interface StepDescriptionVariants {
  neither: string;
  emailVerified: string;
  phoneVerified: string;
}

export interface StepConfig {
  id: number;
  key: VerificationStepKey;
  title: string;
  description: string;
  iconName: string;
  icon: LucideIconData;
  completedText: string;
  actionText: string;
  badge?: string;
  unlockBadge?: string;
  unlockBadgeColor?: string;
  details: StepDetails;
  buttonText?: string;
  itemsLabel: string;
  doneItemsLabel: string;
  items: StepChecklistItem[];
  doneItems: StepChecklistItem[];
  chipTitle: string;
  moreFeatures: string[];
  moreLabel?: string;
  timeRequired: string;
  lockNote?: string;
  showPersonaInfo?: boolean;
  hideTimeOnActive?: boolean;
  descriptionVariants?: StepDescriptionVariants;
}

export type OverallStatus = 'incomplete' | 'complete';

/**
 * Structural shape of the add-card dialog handed back by the source modal —
 * avoids dragging the card-provider component's types across module lines.
 */
export interface AddCardDialogLike {
  afterClosed(): Observable<
    { success?: boolean; data?: IAddCardResponse } | undefined
  >;
}

export interface PaymentSourceResult {
  kind: PaymentSourceKind;
  /** Card path only: the add-card dialog, already open by the time this returns. */
  cardModal?: AddCardDialogLike;
}

/**
 * One open compliance case shown in the action-required panel and on the
 * business step card. Built from the same header signals the top-bar badges
 * use, so the page and the header always agree.
 */
export interface VerificationActionCase {
  kind: ActionCaseKind;
  /**
   * info = a request the user can do when convenient (page stays "all set");
   * warning = deadline-bound (EDD) — reopens the business step.
   */
  severity: 'info' | 'warning';
  title: string;
  /** One sentence on why compliance is asking. */
  why: string;
  docsLabel: string;
  docs: string[];
  cta: string;
  icon: LucideIconData;
  /** EDD only: days until the compliance deadline. */
  daysRemaining?: number;
}
