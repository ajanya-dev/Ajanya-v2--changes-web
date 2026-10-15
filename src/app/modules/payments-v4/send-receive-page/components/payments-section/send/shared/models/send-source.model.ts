import type { Signal } from '@angular/core';
import type { FormGroup } from '@angular/forms';

import type { Observable } from 'rxjs';

import type { IRemittanceDetails } from 'src/app/models/bank';
import type { IBillBulkPaymentData } from 'src/app/modules/bill/model/Bill';
import type { IPaymentDetails } from 'src/app/modules/payments/model/payments';
import type { IFeeRequest } from '../services/payment-fee.service';

/**
 * What the toolbar's attachments and comments are filed against. Most payments are
 * zil-payments; a bank check is a *check* record with its own endpoints
 * (`/checks/{id}/attachments`), so the source has to say which it is.
 *
 * `id` is `0` until the record exists, which tells both modals to keep the list in
 * memory and hand it back on close instead of hitting the server.
 */
export interface IActivityResource {
  id: string | number;
  /** `V4CheckAddCommentModalComponent.type` — the path segment. */
  type: 'zil-payments' | 'checks';
  /** `V4CheckAddAttachmentCommonModalComponent.mode`. Absent means check mode. */
  mode?: 'zil_payments';
}

/**
 * The contract `SendComponent` talks to for whichever pay-from source is active.
 * `SendComponent` owns the shared fields — amount, payee, method, the toolbar, Save
 * and Confirm — while the source-specific fields and submit logic live in the
 * source's own service, so the page can dispatch without knowing which source it has.
 *
 * Deliberately narrow: only what `SendComponent` actually calls. A source's own
 * component talks to its own service directly, with its own concrete types.
 */
export interface IMemoConfig {
  visible: boolean;
  maxLength: number;
}

export interface ISendSourceService {
  /**
   * The source's Additional Details form. `SendComponent` only asks whether it is
   * valid — the shape differs per source, so edits go through the source's component.
   */
  readonly detailsForm: FormGroup;

  /**
   * How the shared Memo field renders for this source. The control itself stays on
   * `detailsForm`, so each source keeps its own validators — card's is 26 characters
   * and letters-only, and a flat cap on the shared field would let a longer value be
   * typed into it. `visible` is false for a card until its purpose is "Other".
   */
  readonly memoConfig?: Signal<IMemoConfig>;

  /** Blank the details for the next payment. */
  resetDetails(): void;

  /**
   * Re-hydrate the details of a payment being edited or cloned — the fields only the
   * source understands (`SendStateService.patchCoreFromPayment` maps the shared ones).
   */
  patchDetailsFromPayment?(details: IPaymentDetails): void;

  /**
   * Fill the source's own fields from the bill(s) being paid — only the source knows
   * what a memo is worth to it (a card must re-point its Purpose dropdown at it).
   */
  patchDetailsFromBill?(bill: IBillBulkPaymentData): void;

  /** Save as a draft. */
  save(): void;

  /** Run the source's submit pipeline. */
  confirm(): void;

  /**
   * A gate in front of Save and Confirm; emits false to abort. Only the Export Check
   * panel uses it: its line items are serialised on "Save Details", so the submit has
   * to trigger that first and wait.
   */
  onBeforeSubmit?(): Observable<boolean>;

  /** The fee inputs this source contributes on top of source, method and amount. */
  feeInputs(): Pick<IFeeRequest, 'shippingType' | 'isSameDay' | 'cardMode'>;

  /** Encrypted ids from the comment modal, sent with the payment. */
  commentIds: string[];

  /** Encrypted ids from the attachment modal, sent with the payment. */
  attachmentIds: string[];

  /** Those of them ticked to ride inside the mailing envelope. */
  envelopeAttachmentIds: string[];

  remittanceItems: IRemittanceDetails[];
  remittanceType: number;
  insertFromRemittance: boolean;
  readonly hasRemittance: boolean;
}
