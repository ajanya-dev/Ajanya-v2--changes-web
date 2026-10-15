/**
 * Field metadata, category mapping, and value formatting helpers for the
 * Live Verification Summary right panel. Ported from /persona/index.html,
 * with keys converted to kebab-case (our API default).
 */

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faBriefcase,
  faLocationDot,
  faUserGroup,
  faShieldHalved,
  faFileLines,
  faFolderOpen
} from '@fortawesome/pro-solid-svg-icons';

export interface FieldMeta {
  title: string;
  category: TimelineCategory;
  order: number;
  subgroup?: string;
  boolean?: boolean;
}

export type TimelineCategory =
  | 'Business Details'
  | 'Business Details (continued)'
  | 'Business Addresses'
  | 'Associated People'
  | 'Associated People (continued)'
  | 'KYC Details'
  | 'Business Document Details'
  | 'Other Fields';

export const CATEGORY_ORDER: TimelineCategory[] = [
  'Business Details',
  'Business Details (continued)',
  'Business Addresses',
  'Associated People',
  'Associated People (continued)',
  'KYC Details',
  'Business Document Details',
  'Other Fields'
];

export interface SectionMeta {
  color: string;
  icon: IconProp; // FontAwesome icon, rendered via <fa-icon>
}

export const SECTION_META: Record<TimelineCategory, SectionMeta> = {
  'Business Details': {
    color: 'var(--common-green-color)',
    icon: faBuilding
  },
  'Business Details (continued)': {
    color: 'var(--common-tertiary-green-color)',
    icon: faBriefcase
  },
  'Business Addresses': {
    color: 'var(--common-blue-color)',
    icon: faLocationDot
  },
  'Associated People': {
    color: 'var(--common-violet-color)',
    icon: faUserGroup
  },
  'Associated People (continued)': {
    color: 'var(--common-tertiary-violet-color)',
    icon: faUserGroup
  },
  'KYC Details': {
    color: 'var(--common-dark-blue-color)',
    icon: faShieldHalved
  },
  'Business Document Details': {
    color: 'var(--common-yellow-color)',
    icon: faFileLines
  },
  'Other Fields': {
    color: 'var(--secondary-text-color)',
    icon: faFolderOpen
  }
};

/** Hidden from the preview — Persona metadata or prefilled labels, not user input. */
export const HIDDEN_FIELDS: Record<string, boolean> = {
  'tin-passed': true,
  'business-physical-address-full': true,
  'business-registered-address-full': true,
  // Association labels are Persona prefills (always "UBO" / "Control Person" / null)
  'ubo-1-association': true,
  'ubo-2-association': true,
  'ubo-3-association': true,
  'ubo-4-association': true,
  'form-filler-association': true,
  'control-person-association': true,
  // Session-level metadata, not user input
  'selected-country-code': true,
  'name-first': true,
  'name-last': true,
  'name-middle': true,
  'identification-class': true,
  'address-street-1': true,
  'address-street-2': true,
  'address-city': true,
  'address-subdivision': true,
  'address-postal-code': true,
  'business-documention-collection-completed': true,
  'business-documention-collection-started': true,
  'address-collection-completed': true,
  'address-collection-started': true
};

/**
 * Persona's common prefill defaults that show up BEFORE the user has
 * entered anything. Filtered at flatten time so sections don't appear
 * just because of the prefill.
 */
function isPersonaPrefillDefault(
  key: string,
  val: string | number | boolean
): boolean {
  const k = key.toLowerCase();
  const v = String(val);
  // Country-code fields default to "US".
  if (/-country-code$/.test(k) && v === 'US') return true;
  return false;
}

/** Coded value → human-readable label */
export const VALUE_LABELS: Record<string, string> = {
  dl: "Driver's License",
  si: 'State ID',
  pp: 'Passport',
  pc: 'Passport Card',
  prc: 'Permanent Resident Card',
  nctd: 'Non-Citizen Travel Document',
  vi: 'Visa',
  wp: 'Work Permit',
  id: 'Government ID',
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  llc: 'Single Member LLC',
  gp: 'Limited Liability Company',
  ul: 'General Partnership',
  ptc: 'Unlisted Corporation',
  assoc: 'Publicly Traded Corporation',
  np: 'Non Profit',
  gov: 'Government',
  revtrust: 'Revocable Trust',
  irrevtrust: 'Irrevocable Trust'
};

export const LABELED_FIELDS =
  /selected-id-class|identification-class|id-country-code|country-code|entity-type/;

export const FIELD_MAP: Record<string, FieldMeta> = {
  // Business Details
  'business-name': {
    title: 'Legal Business Name',
    category: 'Business Details',
    order: 1
  },
  'business-dba': {
    title: 'Doing Business As (DBA) (optional)',
    category: 'Business Details',
    order: 2
  },
  'entity-type': {
    title: 'How is your business structured?',
    category: 'Business Details',
    order: 3
  },
  'complex-business-structure': {
    title: 'Does your business have a parent company or multiple owners/entities involved?',
    category: 'Business Details',
    boolean: true,
    order: 4
  },
  'professional-license': {
    title: 'Does your business require a professional or state license to operate?',
    category: 'Business Details',
    boolean: true,
    order: 5
  },
  'business-phone-number': {
    title: 'Business phone number',
    category: 'Business Details',
    order: 6
  },
  'business-tax-identification-number': {
    title: 'Employer Identification Number (EIN)',
    category: 'Business Details',
    order: 7
  },

  // Business Details (continued)
  'business-industry': {
    title: 'What industry is your business in?',
    category: 'Business Details (continued)',
    order: 1
  },
  'business-subindustry-11': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-21': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-22': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-23': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-31-33': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-42': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-44-45': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-48-49': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-51': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-52': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-53': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-54': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-55': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-56': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-61': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-62': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-71': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-72': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-81': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-subindustry-92': {
    title: 'What specifically does your business do?',
    category: 'Business Details (continued)',
    order: 2
  },
  'business-website': {
    title: 'Business website (optional)',
    category: 'Business Details (continued)',
    order: 3
  },
  'business-description': {
    title: 'Briefly describe what your business does',
    category: 'Business Details (continued)',
    order: 4
  },
  'business-formation-date': {
    title: 'When was your business formed?',
    category: 'Business Details (continued)',
    order: 5
  },

  // Business Addresses
  'registered-address-same-as-physical': {
    title: 'Same as Physical Address',
    category: 'Business Addresses',
    boolean: true,
    order: 0
  },
  'business-physical-address-street-1': {
    title: 'Street address',
    category: 'Business Addresses',
    order: 1,
    subgroup: 'Where the business operates'
  },
  'business-physical-address-street-2': {
    title: 'Apt, suite, unit',
    category: 'Business Addresses',
    order: 2,
    subgroup: 'Where the business operates'
  },
  'business-physical-address-city': {
    title: 'City',
    category: 'Business Addresses',
    order: 3,
    subgroup: 'Where the business operates'
  },
  'business-physical-address-subdivision': {
    title: 'State',
    category: 'Business Addresses',
    order: 4,
    subgroup: 'Where the business operates'
  },
  'business-physical-address-postal-code': {
    title: 'ZIP code',
    category: 'Business Addresses',
    order: 5,
    subgroup: 'Where the business operates'
  },
  'business-physical-address-country-code': {
    title: 'Country',
    category: 'Business Addresses',
    order: 6,
    subgroup: 'Where the business operates'
  },
  'business-registered-address-street-1': {
    title: 'Street address',
    category: 'Business Addresses',
    order: 10,
    subgroup: 'Legal Registered Address'
  },
  'business-registered-address-street-2': {
    title: 'Apt, suite, unit',
    category: 'Business Addresses',
    order: 11,
    subgroup: 'Legal Registered Address'
  },
  'business-registered-address-city': {
    title: 'City',
    category: 'Business Addresses',
    order: 12,
    subgroup: 'Legal Registered Address'
  },
  'business-registered-address-subdivision': {
    title: 'State',
    category: 'Business Addresses',
    order: 13,
    subgroup: 'Legal Registered Address'
  },
  'business-registered-address-postal-code': {
    title: 'Zip Code',
    category: 'Business Addresses',
    order: 14,
    subgroup: 'Legal Registered Address'
  },
  'business-registered-address-country-code': {
    title: 'Country',
    category: 'Business Addresses',
    order: 15,
    subgroup: 'Legal Registered Address'
  },

  // Associated People — Form Filler
  'form-filler-name-first': {
    title: 'First Name',
    category: 'Associated People',
    order: 1,
    subgroup: 'Form Filler'
  },
  'form-filler-name-last': {
    title: 'Last Name',
    category: 'Associated People',
    order: 2,
    subgroup: 'Form Filler'
  },
  'form-filler-job-title': {
    title: 'Title/Role',
    category: 'Associated People',
    order: 3,
    subgroup: 'Form Filler'
  },
  'form-filler-is-also-control-person': {
    title: 'Also a Control Person',
    category: 'Associated People',
    boolean: true,
    order: 4,
    subgroup: 'Form Filler'
  },
  'form-filler-is-also-owner': {
    title: 'Also a Beneficial Owner',
    category: 'Associated People',
    boolean: true,
    order: 5,
    subgroup: 'Form Filler'
  },
  'form-filler-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People',
    order: 6,
    subgroup: 'Form Filler'
  },

  // Associated People (continued) — Control Person
  'control-person-name-first': {
    title: 'First Name',
    category: 'Associated People (continued)',
    order: 1,
    subgroup: 'Control Person'
  },
  'control-person-name-last': {
    title: 'Last Name',
    category: 'Associated People (continued)',
    order: 2,
    subgroup: 'Control Person'
  },
  'control-person-job-title': {
    title: 'Title/Role',
    category: 'Associated People (continued)',
    order: 3,
    subgroup: 'Control Person'
  },
  'control-person-email-address': {
    title: 'Email Address',
    category: 'Associated People (continued)',
    order: 4,
    subgroup: 'Control Person'
  },
  'control-person-is-also-owner': {
    title: 'Also a Beneficial Owner',
    category: 'Associated People (continued)',
    boolean: true,
    order: 5,
    subgroup: 'Control Person'
  },
  'control-person-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People (continued)',
    order: 6,
    subgroup: 'Control Person'
  },

  // UBO 1-4
  'ubo-1-name-first': {
    title: 'First Name',
    category: 'Associated People (continued)',
    order: 10,
    subgroup: 'UBO Person 1'
  },
  'ubo-1-name-last': {
    title: 'Last Name',
    category: 'Associated People (continued)',
    order: 11,
    subgroup: 'UBO Person 1'
  },
  'ubo-1-job-title': {
    title: 'Title/Role',
    category: 'Associated People (continued)',
    order: 12,
    subgroup: 'UBO Person 1'
  },
  'ubo-1-email-address': {
    title: 'Email Address',
    category: 'Associated People (continued)',
    order: 13,
    subgroup: 'UBO Person 1'
  },
  'ubo-1-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People (continued)',
    order: 14,
    subgroup: 'UBO Person 1'
  },
  'ubo-2-name-first': {
    title: 'First Name',
    category: 'Associated People (continued)',
    order: 20,
    subgroup: 'UBO Person 2'
  },
  'ubo-2-name-last': {
    title: 'Last Name',
    category: 'Associated People (continued)',
    order: 21,
    subgroup: 'UBO Person 2'
  },
  'ubo-2-job-title': {
    title: 'Title/Role',
    category: 'Associated People (continued)',
    order: 22,
    subgroup: 'UBO Person 2'
  },
  'ubo-2-email-address': {
    title: 'Email Address',
    category: 'Associated People (continued)',
    order: 23,
    subgroup: 'UBO Person 2'
  },
  'ubo-2-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People (continued)',
    order: 24,
    subgroup: 'UBO Person 2'
  },
  'ubo-3-name-first': {
    title: 'First Name',
    category: 'Associated People (continued)',
    order: 30,
    subgroup: 'UBO Person 3'
  },
  'ubo-3-name-last': {
    title: 'Last Name',
    category: 'Associated People (continued)',
    order: 31,
    subgroup: 'UBO Person 3'
  },
  'ubo-3-job-title': {
    title: 'Title/Role',
    category: 'Associated People (continued)',
    order: 32,
    subgroup: 'UBO Person 3'
  },
  'ubo-3-email-address': {
    title: 'Email Address',
    category: 'Associated People (continued)',
    order: 33,
    subgroup: 'UBO Person 3'
  },
  'ubo-3-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People (continued)',
    order: 34,
    subgroup: 'UBO Person 3'
  },
  'ubo-4-name-first': {
    title: 'First Name',
    category: 'Associated People (continued)',
    order: 40,
    subgroup: 'UBO Person 4'
  },
  'ubo-4-name-last': {
    title: 'Last Name',
    category: 'Associated People (continued)',
    order: 41,
    subgroup: 'UBO Person 4'
  },
  'ubo-4-job-title': {
    title: 'Title/Role',
    category: 'Associated People (continued)',
    order: 42,
    subgroup: 'UBO Person 4'
  },
  'ubo-4-email-address': {
    title: 'Email Address',
    category: 'Associated People (continued)',
    order: 43,
    subgroup: 'UBO Person 4'
  },
  'ubo-4-percentage-ownership': {
    title: 'Ownership %',
    category: 'Associated People (continued)',
    order: 44,
    subgroup: 'UBO Person 4'
  },

  'form-filler-attestation': {
    title: 'PII Attestation',
    category: 'Associated People (continued)',
    boolean: true,
    order: 50
  },

  // KYC Details
  'form-filler-id-country-code': {
    title: 'KYC Country',
    category: 'KYC Details',
    order: 1
  },
  'selected-id-class-2': {
    title: 'ID Type',
    category: 'KYC Details',
    order: 2,
    subgroup:'ID you uploaded'
  },
  'identification-number': {
    title: 'ID Number',
    category: 'KYC Details',
    order: 4,
    subgroup:'ID you uploaded'
  },
  'issue-date': { title: 'Issue Date', category: 'KYC Details', order: 5,subgroup:'ID you uploaded' },
  'expiration-date': {
    title: 'Expiration Date',
    category: 'KYC Details',
    order: 6,
    subgroup:'ID you uploaded'
  },
  'issuing-authority': {
    title: 'Issuing Authority',
    category: 'KYC Details',
    order: 7,
    subgroup:'ID you uploaded'
  },
  'card-access-number': {
    title: 'Card Access Number',
    category: 'KYC Details',
    order: 8,
    subgroup:'ID you uploaded'
  },
  'form-filler-birthdate': {
    title: 'Date of Birth',
    category: 'KYC Details',
    order: 10,
    subgroup: 'About you'
  },
  'form-filler-address-street-1': {
    title: 'Residential Street 1',
    category: 'KYC Details',
    order: 20,
    subgroup: 'Your home address'
  },
  'form-filler-address-street-2': {
    title: 'Residential Street 2',
    category: 'KYC Details',
    order: 21,
    subgroup: 'Your home address'
  },
  'form-filler-address-city': {
    title: 'Residential City',
    category: 'KYC Details',
    order: 22,
    subgroup: 'Your home address'
  },
  'form-filler-address-subdivision': {
    title: 'Residential State',
    category: 'KYC Details',
    order: 23,
    subgroup: 'Your home address'
  },
  'form-filler-address-country-code': {
    title: 'Residential Country',
    category: 'KYC Details',
    order: 24,
    subgroup: 'Your home address'
  },
  'phone-number': { title: 'Phone Number', category: 'KYC Details', order: 30 },
  'email-address': {
    title: 'Email Address',
    category: 'KYC Details',
    order: 31
  },

  // Business Document Details
  'selected-id-class': {
    title: 'ID Type Selected',
    category: 'Business Document Details',
    order: 1
  }
};

/** Categorize a kebab-case field key. Falls through FIELD_MAP, then regex patterns. */
export function categorizeField(key: string): TimelineCategory {
  const k = key.toLowerCase();
  const direct = FIELD_MAP[k];
  if (direct) return direct.category;

  if (/(business-physical-address|business-registered-address)/.test(k))
    return 'Business Addresses';
  if (/^ubo-\d+-/.test(k) || /^control-person-/.test(k))
    return 'Associated People (continued)';
  if (/^form-filler-address-/.test(k)) return 'KYC Details';
  if (/^form-filler-(birthdate|social-security)/.test(k)) return 'KYC Details';
  if (/^form-filler-/.test(k)) return 'Associated People';
  if (/social-security|^ssn/.test(k)) return 'KYC Details';
  if (
    /selected-id-class|identification-class|expiration-date|issue-date|issuing-authority|identification-number|card-access-number/.test(
      k
    )
  )
    return 'KYC Details';
  if (
    /^(name-first|name-last|name-middle|birthdate|phone-number|email-address)$/.test(
      k
    )
  )
    return 'KYC Details';
  if (/(^address-|-address-)/.test(k) && !/business/.test(k))
    return 'KYC Details';
  if (/^business-subindustry/.test(k)) return 'Business Details (continued)';
  if (/^business-|^entity-/.test(k)) return 'Business Details';

  return 'Other Fields';
}

export function formatFieldName(key: string): string {
  const mapped = FIELD_MAP[key.toLowerCase()];
  if (mapped) return mapped.title;
  const stripped = key.replace(/^(form-filler|control-person|ubo-\d+)-/, '');
  return stripped.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatFieldValue(
  key: string,
  val: string | number | boolean
): string {
  const k = key.toLowerCase();
  const v = String(val);
  if (LABELED_FIELDS.test(k) && VALUE_LABELS[v]) return VALUE_LABELS[v];
  if (isDateField(k)) return formatDateValue(v);
  return v;
}

function isDateField(key: string): boolean {
  return /-date$|birthdate/.test(key);
}

/** Convert ISO date (YYYY-MM-DD or full ISO string) to MM/DD/YYYY. */
export function formatDateValue(v: string): string {
  if (!v) return v;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  }
  return v;
}

/** Format a 9-digit SSN as XXX-XX-XXXX. Returns the input unchanged otherwise. */
function formatSsnRaw(v: string): string {
  const digits = v.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return v;
}

export function maskSensitive(
  key: string,
  val: string | number | boolean
): { masked: boolean; unmaskable: boolean; value: string; rawValue: string } {
  const k = key.toLowerCase();
  const v = String(val);
  if (/social-security|^ssn/.test(k) && v.length >= 4) {
    return {
      masked: true,
      unmaskable: true,
      value: `***-**-${v.slice(-4)}`,
      rawValue: formatSsnRaw(v)
    };
  }
  if (k === 'business-tax-identification-number' && v.length >= 4) {
    const last4 = v.slice(-4);
    const head = v.slice(0, -4).replace(/\d/g, '*');
    return {
      masked: true,
      unmaskable: true,
      value: head + last4,
      rawValue: v
    };
  }
  if (k === 'identification-number' && v.length >= 4) {
    const last4 = v.slice(-4);
    const head = v.slice(0, -4).replace(/./g, '*');
    return {
      masked: true,
      unmaskable: true,
      value: head + last4,
      rawValue: v
    };
  }
  if (/birthdate/.test(k) && v) {
    return {
      masked: true,
      unmaskable: true,
      value: '**/**/****',
      rawValue: formatDateValue(v)
    };
  }
  return { masked: false, unmaskable: false, value: v, rawValue: v };
}

export interface ProcessedField {
  key: string;
  title: string;
  subgroup?: string;
  order: number;
  isBoolean: boolean;
  boolValue?: boolean;
  displayValue: string;
  rawValue: string;
  masked: boolean;
  unmaskable: boolean;
  empty: boolean;
  /** When set, the row renders a "View" button that opens this URL in a new tab. */
  linkUrl?: string;
  /** When set, the value text itself is rendered as an inline anchor (blue, opens in a new tab). */
  urlHref?: string;
}

export interface ProcessedSection {
  label: TimelineCategory;
  icon: IconProp;
  color: string;
  fields: ProcessedField[];
}

/**
 * Flatten raw Persona fields (from submission-info inquiry.attributes.fields)
 * into a plain string-keyed map, skipping hidden fields and null/empty/object values.
 */
export function flattenFields(
  fields: Record<string, { type: string; value: unknown }>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  Object.keys(fields).forEach((k) => {
    if (HIDDEN_FIELDS[k.toLowerCase()]) return;
    const v = fields[k]?.value;
    if (v === null || v === undefined || v === '') return;
    if (typeof v === 'object') return; // arrays, objects (documents), etc.
    if (isPersonaPrefillDefault(k, v as string | number | boolean)) return;
    out[k] = v as string | number | boolean;
  });
  return out;
}

/**
 * Return the subset of current fields that differ from baseline (user-modified).
 * Used to hide Persona's default prefill values from the preview.
 */
export function diffFromBaseline(
  current: Record<string, string | number | boolean>,
  baseline: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  Object.keys(current).forEach((k) => {
    const cv = current[k];
    const bv = baseline[k];
    if (bv === undefined || String(bv) !== String(cv)) {
      out[k] = cv;
    }
  });
  return out;
}

/**
 * Subgroup visibility gate: a subgroup renders only when at least one of
 * its listed "key" fields has a non-empty value. This keeps Persona's
 * prefilled defaults (country codes, UBO association labels) from
 * making every subgroup appear before the user has entered real data.
 */
export const SUBGROUP_KEY_FIELDS: Record<string, string[]> = {
  'Form Filler': ['form-filler-name-first'],
  'Control Person': ['control-person-name-first'],
  'UBO Person 1': ['ubo-1-name-first'],
  'UBO Person 2': ['ubo-2-name-first'],
  'UBO Person 3': ['ubo-3-name-first'],
  'UBO Person 4': ['ubo-4-name-first'],
  'Where the business operates': ['business-physical-address-street-1'],
  'Legal Registered Address': ['business-registered-address-street-1'],
  'ID you uploaded': ['identification-number', 'selected-id-class-2'],
  'About you': [
    'form-filler-birthdate',
    'form-filler-social-security-number',
    'social-security-number-1'
  ],
  'Your home address': ['form-filler-address-street-1']
};

/** Any one of the Persona subindustry keys (per NAICS parent code). */
const SUBINDUSTRY_KEYS: string[] = [
  'business-subindustry-11',
  'business-subindustry-21',
  'business-subindustry-22',
  'business-subindustry-23',
  'business-subindustry-31-33',
  'business-subindustry-42',
  'business-subindustry-44-45',
  'business-subindustry-48-49',
  'business-subindustry-51',
  'business-subindustry-52',
  'business-subindustry-53',
  'business-subindustry-54',
  'business-subindustry-55',
  'business-subindustry-56',
  'business-subindustry-61',
  'business-subindustry-62',
  'business-subindustry-71',
  'business-subindustry-72',
  'business-subindustry-81',
  'business-subindustry-92'
];

/**
 * Section-level completeness gate. A section is rendered only when EVERY
 * listed group has at least one filled field.
 *
 * - Categories NOT present in this map are never rendered (e.g. "Other Fields"
 *   is a fallback bucket and should stay hidden until explicitly required).
 * - Within a group, keys are OR'd — any one filled satisfies the group.
 * - Across groups, rules are AND'd — every group must be satisfied.
 *
 * Why: Persona's submission-info returns boolean defaults (false) and
 * profile prefills that pass `flattenFields`, so section-level gating is
 * needed to keep sections hidden until the user has actually completed
 * the matching pages.
 */
export const SECTION_REQUIRED_GROUPS: Partial<
  Record<TimelineCategory, string[][]>
> = {
  'Business Details': [
    ['business-name'],
    ['entity-type'],
    ['business-phone-number'],
    ['business-tax-identification-number']
  ],
  'Business Details (continued)': [
    ['business-industry'],
    SUBINDUSTRY_KEYS,
    ['business-description'],
    ['business-formation-date']
  ],
  'Business Addresses': [
    ['business-physical-address-street-1'],
    ['business-physical-address-city'],
    ['business-physical-address-subdivision'],
    ['business-physical-address-postal-code']
  ],
  'Associated People': [
    ['form-filler-name-first'],
    ['form-filler-name-last'],
    ['form-filler-job-title']
  ],
  'Associated People (continued)': [
    // At least one non-form-filler person identity (first + last) must be complete.
    [
      'control-person-name-first',
      'ubo-1-name-first',
      'ubo-2-name-first',
      'ubo-3-name-first',
      'ubo-4-name-first'
    ],
    [
      'control-person-name-last',
      'ubo-1-name-last',
      'ubo-2-name-last',
      'ubo-3-name-last',
      'ubo-4-name-last'
    ]
  ],
  'KYC Details': [
    ['identification-number'],
    ['form-filler-birthdate'],
    ['form-filler-social-security-number', 'social-security-number-1'],
    ['form-filler-address-street-1'],
    ['form-filler-address-city'],
    ['form-filler-address-subdivision']
  ],
  'Business Document Details': [['selected-id-class']]
};

function hasValue(
  fields: Record<string, string | number | boolean>,
  key: string
): boolean {
  const v = fields[key];
  if (v === undefined || v === null) return false;
  return String(v).trim() !== '';
}

/**
 * True when every required group for the category has at least one filled
 * field. Categories without a rule are considered incomplete — i.e. hidden.
 */
export function isSectionComplete(
  cat: TimelineCategory,
  userFields: Record<string, string | number | boolean>
): boolean {
  const rules = SECTION_REQUIRED_GROUPS[cat];
  if (!rules) return false;
  return rules.every((group) => group.some((k) => hasValue(userFields, k)));
}

/**
 * Extract "Photo of your ID" + "Selfie photos" rows from the JSON:API `included`
 * array. The included array carries verification and document resources that
 * sit alongside the inquiry, with photo URLs the user can preview.
 */
interface IncludedItemAttributes {
  'photo-urls'?: { page?: string; url?: string }[];
  'front-photo'?: { url?: string } | null;
  'back-photo'?: { url?: string } | null;
  files?: { filename?: string; url?: string; 'byte-size'?: number }[];
  kind?: string;
}
interface IncludedItem {
  type?: string;
  id?: string;
  attributes?: IncludedItemAttributes;
}

const PHOTO_PAGE_LABELS: Record<string, string> = {
  left_photo: 'Left Photo',
  center_photo: 'Center Photo',
  right_photo: 'Right Photo'
};

function makePhotoField(
  key: string,
  title: string,
  subgroup: string,
  order: number,
  url: string
): ProcessedField {
  return {
    key,
    title,
    subgroup,
    order,
    isBoolean: false,
    boolValue: undefined,
    displayValue: '',
    rawValue: '',
    masked: false,
    unmaskable: false,
    empty: false,
    linkUrl: url
  };
}

export function extractKycPhotoFields(
  included: unknown[] | undefined
): ProcessedField[] {
  if (!included || !Array.isArray(included)) return [];
  const fields: ProcessedField[] = [];
  // Government document photos render before the selfie photos.
  let docOrder = 100;
  let selfieOrder = 200;

  included.forEach((raw) => {
    const item = raw as IncludedItem;
    if (item?.type === 'verification/selfie') {
      const photos = item.attributes?.['photo-urls'] ?? [];
      photos.forEach((p) => {
        const url = p?.url;
        const page = p?.page ?? '';
        if (!url) return;
        const title =
          PHOTO_PAGE_LABELS[page] ??
          page.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ??
          'Photo';
        fields.push(
          makePhotoField(
            `selfie-${item.id}-${page}`,
            title,
            'Selfie photos',
            selfieOrder++,
            url
          )
        );
      });
      return;
    }
    if (item?.type === 'document/government-id') {
      const front = item.attributes?.['front-photo'];
      const back = item.attributes?.['back-photo'];
      if (front?.url) {
        fields.push(
          makePhotoField(
            `gov-id-${item.id}-front`,
            'Front Photo',
            'Photo of your ID',
            docOrder++,
            front.url
          )
        );
      }
      if (back?.url) {
        fields.push(
          makePhotoField(
            `gov-id-${item.id}-back`,
            'Back Photo',
            'Photo of your ID',
            docOrder++,
            back.url
          )
        );
      }
    }
  });

  return fields;
}

/**
 * Extract generic business documents (Article of Incorporation, Proof of
 * Address, EIN letter, etc.) from `included[]` items where
 * `type === 'document/generic'`. Files live at `attributes.files[]` (a flat
 * array — not `attributes.files.files`). The subgroup name is taken from
 * `attributes.kind` so different document types render under their own
 * heading. Each file becomes a row whose title is the filename and whose
 * value is a "View" button.
 */
export function extractBusinessDocFields(
  included: unknown[] | undefined
): ProcessedField[] {
  if (!included || !Array.isArray(included)) return [];
  const fields: ProcessedField[] = [];
  let order = 100;
  included.forEach((raw) => {
    const item = raw as IncludedItem;
    if (item?.type !== 'document/generic') return;
    const files = item.attributes?.files ?? [];
    const subgroup = item.attributes?.kind?.trim() || 'Documents';
    files.forEach((f, idx) => {
      const url = f?.url;
      if (!url) return;
      const filename = f?.filename ?? `Document ${idx + 1}`;
      fields.push(
        makePhotoField(
          `generic-doc-${item.id}-${idx}`,
          filename,
          subgroup,
          order++,
          url
        )
      );
    });
  });
  return fields;
}

/**
 * Inferred metadata for keys not in FIELD_MAP.
 */
function inferFieldMeta(key: string): FieldMeta | undefined {
  const k = key.toLowerCase();
  if (/social-security|^ssn/.test(k)) {
    return {
      title: 'Social Security Number',
      category: 'KYC Details',
      order: 11,
      subgroup: 'About you'
    };
  }
  if (/birthdate/.test(k)) {
    return {
      title: 'Date of Birth',
      category: 'KYC Details',
      order: 10,
      subgroup: 'About you'
    };
  }
  return undefined;
}

/**
 * Group flattened fields into ordered sections + sorted fields, applying
 * subgroup key-field gating. Sections with no fields (after gating) are
 * omitted entirely.
 */
export type ExtraSectionFields = Partial<
  Record<TimelineCategory, ProcessedField[]>
>;

export function buildSections(
  userFields: Record<string, string | number | boolean>,
  extraSectionFields: ExtraSectionFields = {}
): ProcessedSection[] {
  // Determine which subgroups pass the key-field gate.
  const activeSubgroups = new Set<string>();
  Object.keys(SUBGROUP_KEY_FIELDS).forEach((subgroup) => {
    const keyFields = SUBGROUP_KEY_FIELDS[subgroup];
    if (keyFields.some((k) => hasValue(userFields, k))) {
      activeSubgroups.add(subgroup);
    }
  });
  // Also activate "Personal Information" for any SSN/birthdate variant that
  // isn't in SUBGROUP_KEY_FIELDS — keeps the gate consistent with inferFieldMeta.
  if (!activeSubgroups.has('About you')) {
    const hasSsnOrDob = Object.keys(userFields).some((k) => {
      const lk = k.toLowerCase();
      return (
        (/social-security|^ssn|birthdate/.test(lk)) && hasValue(userFields, k)
      );
    });
    if (hasSsnOrDob) activeSubgroups.add('About you');
  }

  const groups = new Map<TimelineCategory, ProcessedField[]>();

  Object.keys(userFields).forEach((key) => {
    const meta = FIELD_MAP[key.toLowerCase()] ?? inferFieldMeta(key);

    // Gate: if this field belongs to a subgroup that didn't pass, skip it.
    if (meta?.subgroup && !activeSubgroups.has(meta.subgroup)) return;

    const cat = meta?.category ?? categorizeField(key);
    const val = userFields[key];

    const isBoolField = typeof val === 'boolean' || meta?.boolean === true;
    const boolValue =
      val === true || val === 'true' || val === 1 || val === '1';

    const masked = maskSensitive(key, val);
    const empty = String(val) === '';

    const processed: ProcessedField = {
      key,
      title: meta?.title ?? formatFieldName(key),
      subgroup: meta?.subgroup,
      order: meta?.order ?? 999,
      isBoolean: isBoolField,
      boolValue: isBoolField ? boolValue : undefined,
      displayValue: masked.masked ? masked.value : formatFieldValue(key, val),
      rawValue: masked.rawValue,
      masked: masked.masked,
      unmaskable: masked.unmaskable,
      empty
    };

    if (key.toLowerCase() === 'business-website' && !empty && !isBoolField) {
      const v = String(val).trim();
      processed.urlHref = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    }

    const arr = groups.get(cat);
    if (arr) arr.push(processed);
    else groups.set(cat, [processed]);
  });

  // Inject extra synthetic rows (selfie/gov-id under KYC Details, generic
  // documents under Business Document Details, etc.) before sorting so they
  // slot into their assigned order positions.
  (Object.keys(extraSectionFields) as TimelineCategory[]).forEach((cat) => {
    const extras = extraSectionFields[cat];
    if (!extras || extras.length === 0) return;
    const existing = groups.get(cat) ?? [];
    groups.set(cat, [...existing, ...extras]);
  });

  // Sort within each group by order.
  groups.forEach((arr) => arr.sort((a, b) => a.order - b.order));

  // Dedupe aliases. Persona emits multiple keys for the same SSN / DOB
  // (e.g. `social-security-number-1`, `form-filler-social-security-number`,
  // `social-security-number-2`) — they share subgroup, title, and value.
  // Drop later occurrences while keeping legitimately distinct rows that
  // differ in subgroup (different UBOs) or value (multiple subindustries).
  groups.forEach((arr, cat) => {
    const seen = new Set<string>();
    const deduped = arr.filter((f) => {
      const dedupeKey = `${f.subgroup ?? ''}::${f.title}::${f.displayValue}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
    groups.set(cat, deduped);
  });

  // Two-pass emit so a "(continued)" section can pull its parent in.
  // Persona's KYB page order places EIN AFTER industry/description/
  // formation-date — so a user mid-flow can satisfy
  // `Business Details (continued)` while `Business Details` is still one
  // field short (EIN). Without this, the user sees the continued section
  // dangling on its own. Same applies to Associated People.
  const PARENT_OF_CONTINUED: Partial<
    Record<TimelineCategory, TimelineCategory>
  > = {
    'Business Details (continued)': 'Business Details',
    'Associated People (continued)': 'Associated People'
  };

  const passes = new Map<TimelineCategory, boolean>();
  CATEGORY_ORDER.forEach((cat) => {
    const fields = groups.get(cat);
    if (!fields || fields.length === 0) {
      passes.set(cat, false);
      return;
    }
    // Force-render any category that has injected synthetic rows (photo
    // previews, document files) so they always show even if the section's
    // normal completeness gate hasn't passed yet.
    const hasExtras = (extraSectionFields[cat] ?? []).length > 0;
    passes.set(cat, hasExtras || isSectionComplete(cat, userFields));
  });

  // If a continued section passed and its parent has real fields collected,
  // promote the parent regardless of its own gate.
  (Object.keys(PARENT_OF_CONTINUED) as TimelineCategory[]).forEach((child) => {
    if (!passes.get(child)) return;
    const parent = PARENT_OF_CONTINUED[child];
    if (!parent) return;
    const parentFields = groups.get(parent);
    if (parentFields && parentFields.length > 0) passes.set(parent, true);
  });

  // Emit in preferred category order.
  const sections: ProcessedSection[] = [];
  CATEGORY_ORDER.forEach((cat) => {
    if (!passes.get(cat)) return;
    const fields = groups.get(cat);
    if (!fields) return;
    sections.push({
      label: cat,
      icon: SECTION_META[cat].icon,
      color: SECTION_META[cat].color,
      fields
    });
  });
  return sections;
}
