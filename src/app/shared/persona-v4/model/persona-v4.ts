export interface INewPersonaInquiryRes {
  inquiryId: string;
  status: string;
  inquiryType: string;
  user_id: number;
  session_token: string | null;
  failed_inquiry_count: number;
  maximum_allowed_attempt: number;
  attempt_number: number;
}

export interface ISubmissionInfoField {
  type: string;
  value: string | number | boolean | null | unknown[] | Record<string, unknown>;
}

export interface ISubmissionInfoInquiryAttributes {
  status?: string;
  'updated-at'?: string;
  'created-at'?: string;
  'started-at'?: string;
  'completed-at'?: string | null;
  'next-step-name'?: string | null;
  'previous-step-name'?: string | null;
  fields: Record<string, ISubmissionInfoField>;
  [key: string]: unknown;
}

export interface ISubmissionInfoInquiry {
  type: string;
  id: string;
  attributes: ISubmissionInfoInquiryAttributes;
}

export interface ISubmissionInfo {
  attempt_number: number;
  documents_submitted: number;
  inquiry?: ISubmissionInfoInquiry;
}

/**
 * Response shape for the new `persona-verifications/inquiry/{id}/inquiry-details`
 * endpoint. Mirrors Persona's JSON:API structure — a top-level `data` object
 * holding the inquiry and an optional `included` array of related resources.
 */
export interface IInquiryDetailsField {
  type: string;
  value: string | number | boolean | null | unknown[] | Record<string, unknown>;
}

export interface IInquiryDetailsAttributes {
  status?: string;
  'updated-at'?: string;
  'created-at'?: string;
  'started-at'?: string | null;
  'completed-at'?: string | null;
  'expired-at'?: string | null;
  'expires-at'?: string | null;
  'failed-at'?: string | null;
  'decisioned-at'?: string | null;
  'next-step-name'?: string | null;
  'previous-step-name'?: string | null;
  'reference-id'?: string | null;
  fields: Record<string, IInquiryDetailsField>;
  [key: string]: unknown;
}

export interface IInquiryDetailsInquiry {
  type: string;
  id: string;
  attributes: IInquiryDetailsAttributes;
  relationships?: Record<string, unknown>;
}

/**
 * How obtainable the formation document is from the state's own website.
 * Backend returns exactly one of these five values.
 */
export type FormationDocumentAccess =
  | 'Free download'
  | 'View/download available'
  | 'Paid document order'
  | 'Entity details only'
  | 'Account/login required';

/** A single example page image (GIF/JPG, not a PDF) with its caption. */
export interface IFormationDocumentPage {
  label: string;
  url: string;
}

/**
 * State-specific formation document guidance. Sourced from backend config
 * covering all 50 states plus the District of Columbia.
 */
export interface IFormationDocumentExample {
  /** 2-letter jurisdiction code, `DC` included. */
  code: string;
  name: string;
  /** Official Secretary of State (or equivalent) business search. */
  website_url: string;
  document_access: FormationDocumentAccess;
  /** What the customer will actually run into: payment, CAPTCHA, login. */
  limitation: string;
  /** 1 to 5 images, rendered stacked in page order. */
  pages: IFormationDocumentPage[];
}

export interface IInquiryDetails {
  inquiry_details: {
    data: IInquiryDetailsInquiry;
    included?: unknown[];
  };
  sample_formation_doc: string;
  /**
   * Guidance for the state the business is registered in, resolved server-side
   * from the inquiry's registered (preferred) or physical address. `null` when
   * no address has been filled in yet or the state is not a US jurisdiction.
   */
  formation_document_example: IFormationDocumentExample | null;
}

/**
 * Response payload for GET /persona-verifications/inquiry/check-prior-kyc.
 * When `has_prior_kyc` is false, the other fields are absent. When true,
 * the backend returns the user's name and the KYC status (rejected KYC
 * is filtered out server-side so status 3 is never returned).
 */
export interface IPriorKycCheck {
  has_prior_kyc: boolean;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  kyc_status?: 0 | 1 | 2;
}

/**
 * Preview bucket ids used by the V5 right-panel stepper. Backend may tag each
 * missing field with the section it belongs to so the frontend can badge the
 * matching step directly (see IKybMissingField.section).
 */
export type KybPreviewSectionId =
  | 'business'
  | 'business-info'
  | 'address'
  | 'owners'
  | 'identity'
  | 'documents';

/**
 * A single field the migrating customer still has to complete, computed by the
 * backend against the latest KYB checklist and delivered with the pre-created
 * re-verification inquiry (header `kybPersonaVerificationData.missing_fields`).
 * Rendered on the modal's re-verify intro screen and badged on the live preview.
 */
export interface IKybMissingField {
  /** Persona field key (kebab-case), matches inquiry-details attributes.fields. */
  key: string;
  /** Display-ready label. */
  label: string;
  /** Preview bucket the field belongs to. Optional — derived when absent. */
  section?: KybPreviewSectionId;
  /** true = hard-fails a checklist rule; false = recommended enrichment. */
  required?: boolean;
  /**
   * Whether the field already has a value. Optional backend convenience — the
   * frontend recomputes this live from inquiry-details as the user progresses.
   */
  filled?: boolean;
}
