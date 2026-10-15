import { IInquiryDetails } from '../../../../model/persona-v4';
import {
  ProcessedField,
  ProcessedSection,
  SECTION_REQUIRED_GROUPS,
  TimelineCategory,
  buildSections,
  extractBusinessDocFields,
  extractKycPhotoFields,
  flattenFields,
  isSectionComplete
} from './field-map.util';

export type PreviewSectionStatus = 'done' | 'current' | 'upcoming';

export interface PreviewPerson {
  /** First + last name. */
  name: string;
  /** Job title / role — blue pill (e.g. "CEO & Founder"). */
  role: string;
  /** Ownership, formatted as "Owns 60%" — amber pill. Empty when none. */
  ownership: string;
  /** Designation — green pill (e.g. "Account signer" / "Beneficial owner"). */
  badge: string;
}

/** A single uploaded photo, rendered as a preview card. */
export interface PreviewPhoto {
  key: string;
  /** Short caption shown bottom-left of the card (e.g. "Front", "Left"). */
  label: string;
  /** Image URL — opened in a new window via the card's full-screen icon. */
  url: string;
}

/** A labelled grid of photo cards (e.g. "Photo of your ID", "Selfie photos"). */
export interface PreviewPhotoGroup {
  label: string;
  photos: PreviewPhoto[];
}

export interface PreviewSection {
  id:
    | 'identity'
    | 'business'
    | 'business-info'
    | 'address'
    | 'owners'
    | 'documents'
    | 'review';
  label: string;
  /** Short label shown in the compact left-panel stepper. */
  stepperLabel: string;
  /** 1-based position, rendered only when status === 'upcoming'. */
  number: number;
  status: PreviewSectionStatus;
  summary: string;
  fields: ProcessedField[];
  /**
   * Address section only: true when the registered address is flagged the
   * same as the physical address. The template then hides the registered
   * address rows and shows a "same as above" callout instead.
   */
  addressSameAsPhysical: boolean;
  /**
   * Owners ("People involved") section only: one entry per person, rendered
   * as name + role/ownership/designation pills. Empty for other sections.
   */
  people: PreviewPerson[];
  /**
   * Identity section only: uploaded ID / selfie photos, rendered as preview
   * card grids instead of "View" link rows. Empty for other sections.
   */
  photoGroups: PreviewPhotoGroup[];
}

interface BucketDef {
  id: PreviewSection['id'];
  label: string;
  stepperLabel:string;
  /** Source field-map categories folded into this bucket (empty for Review). */
  categories: TimelineCategory[];
}

const BUCKETS: BucketDef[] = [
  {
    id: 'business',
    label: 'About your business',
    stepperLabel: 'About Business',
    categories: ['Business Details']
  },
  {
    id: 'business-info',
    label: 'What your business does',
    stepperLabel: 'What you do',
    categories: ['Business Details (continued)']
  },
  { id: 'address', label: 'Business address',stepperLabel: 'Address', categories: ['Business Addresses'] },
  {
    id: 'owners',
    label: 'People involved',
    stepperLabel:'People',
    categories: ['Associated People', 'Associated People (continued)']
  },
  { id: 'identity', label: 'Your identity verification',stepperLabel:'Identity', categories: ['KYC Details'] },
  {
    id: 'documents',
    label: 'Business formation document',
    stepperLabel: 'Documents',
    categories: ['Business Document Details']
  },
];

type RawFields = Record<string, string | number | boolean>;

function hasVal(fields: RawFields, key: string): boolean {
  const v = fields[key];
  if (v === undefined || v === null) return false;
  return String(v).trim() !== '';
}

const SOLE_PROPRIETOR_ENTITY_CODES = new Set([
  'sole proprietor',
  'sole_proprietorship',
  'sole_proprietor',
  'soleproprietorship',
  'soleproprietor',
  'sole-proprietor',
  'soleprop',
  'sp',
  'single member llc'
]);

/** True when the inquiry's entity-type marks the business as a sole proprietor. */
function isSoleProprietorEntity(fields: RawFields): boolean {
  const raw = fields['entity-type'];
  if (raw === undefined || raw === null) return false;
  const v = String(raw).trim().toLowerCase();
  if (!v) return false;
  if (SOLE_PROPRIETOR_ENTITY_CODES.has(v)) return true;
  return /sole|proprietor/.test(v);
}

/** Persona key for the Employer Identification Number (EIN) row. */
const EIN_FIELD_KEY = 'business-tax-identification-number';

/**
 * Business Details completeness. Sole proprietors verify with an SSN and have
 * no EIN, so the EIN requirement is dropped for them — otherwise the Business
 * step (and therefore the final Review) could never complete.
 */
function isBusinessSectionComplete(
  fields: RawFields,
  soleProprietor: boolean
): boolean {
  if (!soleProprietor) return isSectionComplete('Business Details', fields);
  const rules = SECTION_REQUIRED_GROUPS['Business Details'] ?? [];
  return rules
    .filter((group) => !(group.length === 1 && group[0] === EIN_FIELD_KEY))
    .every((group) => group.some((k) => hasVal(fields, k)));
}

/** Map the active Persona page category (from mapPersonaPageToCategory) to a bucket id. */
export function mapActiveCategoryToBucket(
  cat: string | null
): PreviewSection['id'] | null {
  switch (cat) {
    case 'KYC Details':
      return 'identity';
    case 'Business Details':
      return 'business';
    case 'Business Details (continued)':
      return 'business-info';
    case 'Business Addresses':
      return 'address';
    case 'Associated People':
    case 'Associated People (continued)':
      return 'owners';
    case 'Documents':
      return 'documents';
    default:
      return null;
  }
}

function countOwners(fields: RawFields): number {
  const keys = [
    'form-filler-name-first',
    'control-person-name-first',
    'ubo-1-name-first',
    'ubo-2-name-first',
    'ubo-3-name-first',
    'ubo-4-name-first'
  ];
  return keys.filter((k) => hasVal(fields, k)).length;
}

/** Persona person key-prefixes and the designation badge shown for each. */
const OWNER_PEOPLE: { prefix: string; badge: string }[] = [
  { prefix: 'form-filler', badge: 'Account signer' },
  { prefix: 'control-person', badge: 'Control person' },
  { prefix: 'ubo-1', badge: 'Beneficial owner' },
  { prefix: 'ubo-2', badge: 'Beneficial owner' },
  { prefix: 'ubo-3', badge: 'Beneficial owner' },
  { prefix: 'ubo-4', badge: 'Beneficial owner' }
];

/**
 * Build the "People involved" cards: one per person who has a name, each with
 * their role (job title), ownership ("Owns X%"), and a designation badge.
 */
function buildOwnerPeople(fields: RawFields): PreviewPerson[] {
  const people: PreviewPerson[] = [];
  for (const { prefix, badge } of OWNER_PEOPLE) {
    const first = String(fields[`${prefix}-name-first`] ?? '').trim();
    const last = String(fields[`${prefix}-name-last`] ?? '').trim();
    const name = [first, last].filter(Boolean).join(' ');
    if (!name) continue;
    const role = String(fields[`${prefix}-job-title`] ?? '').trim();
    const pct = String(fields[`${prefix}-percentage-ownership`] ?? '').trim();
    const ownership = pct && pct !== '0' ? `Owns ${pct}%` : '';
    people.push({ name, role, ownership, badge });
  }
  return people;
}

/** Identity subgroups rendered as photo card grids rather than link rows. */
const PHOTO_SUBGROUPS = ['Photo of your ID', 'Selfie photos'];

/**
 * Split a section's fields into non-photo rows and grouped photo cards.
 * Photo link rows in PHOTO_SUBGROUPS are pulled out so the template can render
 * them as preview cards; everything else stays as normal field rows.
 */
function extractPhotoGroups(fields: ProcessedField[]): {
  rest: ProcessedField[];
  photoGroups: PreviewPhotoGroup[];
} {
  const groupMap = new Map<string, PreviewPhoto[]>();
  const rest: ProcessedField[] = [];
  for (const f of fields) {
    if (f.linkUrl && f.subgroup && PHOTO_SUBGROUPS.includes(f.subgroup)) {
      const arr = groupMap.get(f.subgroup) ?? [];
      // "Front Photo" -> "Front", "Left Photo" -> "Left" for a tidy caption.
      const label = f.title.replace(/\s*photo$/i, '').trim() || f.title;
      arr.push({ key: f.key, label, url: f.linkUrl });
      groupMap.set(f.subgroup, arr);
    } else {
      rest.push(f);
    }
  }
  const photoGroups = PHOTO_SUBGROUPS.filter((s) => groupMap.has(s)).map(
    (s) => ({ label: s, photos: groupMap.get(s) ?? [] })
  );
  return { rest, photoGroups };
}

/**
 * The first three non-empty field values for a section, joined with ' · '.
 * Booleans render as Yes/No and link/photo rows fall back to their title
 * (e.g. filename), so the preview reflects whatever the user has entered.
 * Returns '' when the section has no displayable values yet.
 */
function previewFieldValues(bucketFields: ProcessedField[]): string {
  const values: string[] = [];
  for (const f of bucketFields) {
    let v: string;
    if (f.isBoolean) v = f.boolValue ? 'Yes' : 'No';
    else if (f.linkUrl) v = (f.title ?? '').trim();
    else v = (f.displayValue ?? '').trim();
    if (!v) continue;
    values.push(v);
    if (values.length === 3) break;
  }
  return values.join(' · ');
}

function deriveSummary(
  id: PreviewSection['id'],
  fields: RawFields,
  bucketFields: ProcessedField[]
): string {
  // When the user has provided data, preview the first three values from the
  // section. Otherwise fall through to the static per-section descriptions.
  const preview = previewFieldValues(bucketFields);
  if (preview) return preview;

  switch (id) {
    case 'identity': {
      const name = [
        fields['form-filler-name-first'],
        fields['form-filler-name-last']
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      const hasDob = hasVal(fields, 'form-filler-birthdate');
      if (name && hasDob) return `${name} · DOB on file`;
      if (name) return name;
      return 'Government ID & Selfie';
    }
    case 'business':
      return hasVal(fields, 'business-tax-identification-number')
        ? 'Legal entity + EIN'
        : 'Legal entity';
    case 'business-info': {
      const hasWebsite = hasVal(fields, 'business-website');
      const hasDesc = hasVal(fields, 'business-description');
      if (hasWebsite && hasDesc) return 'Industry, website & description';
      if (hasDesc) return 'Industry & description';
      return 'Industry & activity';
    }
    case 'address': {
      const phys = hasVal(fields, 'business-physical-address-street-1');
      const reg = hasVal(fields, 'business-registered-address-street-1');
      if (phys && reg) return 'Physical + mailing';
      if (phys) return 'Physical address';
      return 'Physical + mailing';
    }
    case 'owners': {
      const n = countOwners(fields);
      return n > 0
        ? `${n} ${n === 1 ? 'owner' : 'owners'} on file`
        : 'Owners & control';
    }
    case 'documents': {
      const kind = bucketFields[0]?.subgroup?.trim();
      return kind || 'Articles of Incorporation';
    }
    case 'review':
      return 'Final review';
    default:
      return '';
  }
}

/**
 * Build the fixed preview sections with status + summaries.
 *
 * @param details        the inquiry-details signal value
 * @param activeCategory result of mapPersonaPageToCategory for the live page
 * @param isFinalized    true once verification is complete (poll completed / kyb_id present)
 */
export function buildPreviewSections(
  details: IInquiryDetails | undefined,
  activeCategory: string | null,
  isFinalized: boolean
): PreviewSection[] {
  const rawFields = details?.inquiry_details?.data?.attributes?.fields;
  const included = details?.inquiry_details?.included;
  const userFields: RawFields = rawFields ? flattenFields(rawFields) : {};

  // Synthetic "Full Name" row for the KYC "About you" subgroup, joined from the
  // form-filler first/last name. Injected (order 9) so it sits just above the
  // Date of Birth row. Skipped when no name has been entered yet.
  const kycExtras: ProcessedField[] = extractKycPhotoFields(included);
  const fullName = [
    userFields['form-filler-name-first'],
    userFields['form-filler-name-last']
  ]
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    kycExtras.unshift({
      key: 'kyc-full-name',
      title: 'Full Name',
      subgroup: 'About you',
      order: 9,
      isBoolean: false,
      boolValue: undefined,
      displayValue: fullName,
      rawValue: fullName,
      masked: false,
      unmaskable: false,
      empty: false
    });
  }

  const built: ProcessedSection[] = rawFields
    ? buildSections(userFields, {
        'KYC Details': kycExtras,
        'Business Document Details': extractBusinessDocFields(included)
      })
    : [];
  const byCategory = new Map<TimelineCategory, ProcessedSection>();
  built.forEach((s) => byCategory.set(s.label, s));

  const docFieldCount = extractBusinessDocFields(included).length;

  // Sole proprietors have no separate owners / control persons, so the
  // "People involved" bucket is dropped.
  const soleProprietor = isSoleProprietorEntity(userFields);
  const buckets = soleProprietor
    ? BUCKETS.filter((b) => b.id !== 'owners')
    : BUCKETS;

  const completeness: Record<PreviewSection['id'], boolean> = {
    identity: isSectionComplete('KYC Details', userFields),
    business: isBusinessSectionComplete(userFields, soleProprietor),
    'business-info': isSectionComplete('Business Details (continued)', userFields),
    address: isSectionComplete('Business Addresses', userFields),
    owners: isSectionComplete('Associated People', userFields),
    documents:
      docFieldCount > 0 ||
      isSectionComplete('Business Document Details', userFields),
    review: false
  };
  // Only require the buckets that are actually shown — for a sole proprietor
  // the hidden owners bucket must not block the Review step from finalizing.
  const dataDone = buckets.every((b) => completeness[b.id]);
  completeness.review = dataDone && isFinalized;

  const activeBucket = mapActiveCategoryToBucket(activeCategory);
  let currentId: PreviewSection['id'] | null = null;
  if (
    activeBucket &&
    buckets.some((b) => b.id === activeBucket) &&
    !completeness[activeBucket]
  ) {
    currentId = activeBucket;
  } else {
    currentId = buckets.find((b) => !completeness[b.id])?.id ?? null;
  }

  const sameAsPhysical = (() => {
    const v = userFields['registered-address-same-as-physical'];
    return v === true || v === 'true' || v === 1 || v === '1';
  })();

  return buckets.map((bucket, index) => {
    let fields = bucket.categories.flatMap(
      (c) => byCategory.get(c)?.fields ?? []
    );

    // Address section: when the registered address mirrors the physical one,
    // drop the registered rows (and the "same as physical" toggle row) so the
    // template can render a single physical block + a "same as above" callout.
    const addressSameAsPhysical = bucket.id === 'address' && sameAsPhysical;
    if (addressSameAsPhysical) {
      fields = fields.filter(
        (f) =>
          f.subgroup !== 'Legal Registered Address' &&
          f.key !== 'registered-address-same-as-physical'
      );
    }

    // Sole proprietors verify with an SSN and have no EIN — drop the Employer
    // Identification Number row from the business section.
    if (soleProprietor && bucket.id === 'business') {
      fields = fields.filter((f) => f.key !== EIN_FIELD_KEY);
    }

    const people = bucket.id === 'owners' ? buildOwnerPeople(userFields) : [];

    // Identity: pull the ID/selfie photo rows out into card grids.
    let photoGroups: PreviewPhotoGroup[] = [];
    if (bucket.id === 'identity') {
      const split = extractPhotoGroups(fields);
      fields = split.rest;
      photoGroups = split.photoGroups;
    }

    let status: PreviewSectionStatus = 'upcoming';
    if (completeness[bucket.id]) status = 'done';
    else if (bucket.id === currentId) status = 'current';
    return {
      id: bucket.id,
      label: bucket.label,
      stepperLabel: bucket.stepperLabel,
      number: index + 1,
      status,
      summary: deriveSummary(bucket.id, userFields, fields),
      fields,
      addressSameAsPhysical,
      people,
      photoGroups
    };
  });
}
