/**
 * Bank-data Rule payload mapping.
 *
 * The backend stores rules as numeric tuples inside `rule_data.ifs` /
 * `rule_data.thens`. Conditions are nested in OR groups (each inner group
 * is an AND of conditions). This file mirrors the React Banker-Data
 * `rulePayload.js` codec so create + edit go through one path.
 */

// IF condition type codes
export const IF_ORIGINAL_DESCRIPTION = 1;
export const IF_AMOUNT = 2;
export const IF_DATE = 3;
export const IF_ACCOUNT = 4;
export const IF_MERCHANT = 5;
export const IF_CATEGORY = 6;
export const IF_DESCRIPTION = 7;

// Merchant match-type codes
export const MERCHANT_MATCH_TYPE_EXACT = 1;
export const MERCHANT_MATCH_TYPE_CONTAINS = 2;
export const MERCHANT_MATCH_TYPE_ORIGINAL_STATEMENT = 3;
export const MERCHANT_MATCH_TYPE_MERCHANT_NAME = 4;

// Description match-type codes (V3-compatible)
export const DESCRIPTION_MATCH_TYPE_CONTAINS = 1;
export const DESCRIPTION_MATCH_TYPE_EXACT = 2;

// Amount match-type codes
export const AMOUNT_MATCH_TYPE_GREATER_THAN = 1;
export const AMOUNT_MATCH_TYPE_LESS_THAN = 2;
export const AMOUNT_MATCH_TYPE_EQUALS = 3;
export const AMOUNT_MATCH_TYPE_BETWEEN = 4;

// Date match-type codes
export const DATE_MATCH_TYPE_AFTER = 1;
export const DATE_MATCH_TYPE_BEFORE = 2;
export const DATE_MATCH_TYPE_ON = 3;
export const DATE_MATCH_TYPE_BETWEEN = 4;

// THEN action codes
export const THEN_ACTION_RENAME_MERCHANT = 1;
export const THEN_ACTION_UPDATE_CATEGORY = 2;
export const THEN_ACTION_ADD_TAG = 3;
export const THEN_ACTION_HIDE_TRANSACTION = 4;
export const THEN_ACTION_LINK_TO_GOAL = 5;

export type TMerchantMatchType =
  | 'contains'
  | 'exactly_matches'
  | 'starts_with'
  | 'ends_with';

export type TDateOperator = 'after' | 'before' | 'on' | 'between';

export type TDescriptionMatchType = 'contains' | 'exact';

export type TAmountOperator = 'more_than' | 'less_than' | 'equals' | 'between';

export interface IMerchantMatcher {
  match_type: TMerchantMatchType;
  value: string;
}

export interface IDescriptionCondition {
  operator: TDescriptionMatchType;
  value: string;
}

export interface IAmountCondition {
  operator: TAmountOperator;
  value: string;
  from: string;
  to: string;
}

export interface IDateCondition {
  operator: TDateOperator;
  value: string;
  from: string;
  to: string;
}

export interface IRuleFormState {
  descriptions: IDescriptionCondition[];
  merchantMatchers: IMerchantMatcher[]; // kept for backward compat
  amounts: IAmountCondition[];
  dates: IDateCondition[];
  categoryIds: string[];
  accountIds: string[];

  renameDescriptionEnabled: boolean;
  renameDescriptionValue: string;
  updateCategoryEnabled: boolean;
  updateCategoryValue: string;
  addTagsEnabled: boolean;
  tagsValue: string;
  hideTransactionEnabled: boolean;
  linkToGoalEnabled: boolean;
}

const merchantMatchFromCode = (code: number): TMerchantMatchType => {
  switch (code) {
    case MERCHANT_MATCH_TYPE_EXACT:
      return 'exactly_matches';
    case MERCHANT_MATCH_TYPE_CONTAINS:
      return 'contains';
    case MERCHANT_MATCH_TYPE_ORIGINAL_STATEMENT:
      return 'starts_with';
    case MERCHANT_MATCH_TYPE_MERCHANT_NAME:
      return 'ends_with';
    default:
      return 'contains';
  }
};

const dateMatchCode = (op: TDateOperator): number => {
  switch (op) {
    case 'after':
      return DATE_MATCH_TYPE_AFTER;
    case 'before':
      return DATE_MATCH_TYPE_BEFORE;
    case 'on':
      return DATE_MATCH_TYPE_ON;
    case 'between':
      return DATE_MATCH_TYPE_BETWEEN;
    default:
      return DATE_MATCH_TYPE_AFTER;
  }
};

const dateMatchFromCode = (code: number): TDateOperator => {
  switch (code) {
    case DATE_MATCH_TYPE_AFTER:
      return 'after';
    case DATE_MATCH_TYPE_BEFORE:
      return 'before';
    case DATE_MATCH_TYPE_ON:
      return 'on';
    case DATE_MATCH_TYPE_BETWEEN:
      return 'between';
    default:
      return 'after';
  }
};

const descriptionMatchCode = (op: TDescriptionMatchType): number => {
  switch (op) {
    case 'contains':
      return DESCRIPTION_MATCH_TYPE_CONTAINS;
    case 'exact':
      return DESCRIPTION_MATCH_TYPE_EXACT;
    default:
      return DESCRIPTION_MATCH_TYPE_CONTAINS;
  }
};

const descriptionMatchFromCode = (code: number): TDescriptionMatchType => {
  switch (code) {
    case DESCRIPTION_MATCH_TYPE_CONTAINS:
      return 'contains';
    case DESCRIPTION_MATCH_TYPE_EXACT:
      return 'exact';
    default:
      return 'contains';
  }
};

const amountMatchCode = (op: TAmountOperator): number => {
  switch (op) {
    case 'more_than':
      return AMOUNT_MATCH_TYPE_GREATER_THAN;
    case 'less_than':
      return AMOUNT_MATCH_TYPE_LESS_THAN;
    case 'equals':
      return AMOUNT_MATCH_TYPE_EQUALS;
    case 'between':
      return AMOUNT_MATCH_TYPE_BETWEEN;
    default:
      return AMOUNT_MATCH_TYPE_GREATER_THAN;
  }
};

const amountMatchFromCode = (code: number): TAmountOperator => {
  switch (code) {
    case AMOUNT_MATCH_TYPE_GREATER_THAN:
      return 'more_than';
    case AMOUNT_MATCH_TYPE_LESS_THAN:
      return 'less_than';
    case AMOUNT_MATCH_TYPE_EQUALS:
      return 'equals';
    case AMOUNT_MATCH_TYPE_BETWEEN:
      return 'between';
    default:
      return 'more_than';
  }
};

/**
 * Build the rule_data object in V3-compatible format.
 *
 * V3 format:
 *   ifs:   { "0": ["type","op","value","from","to"], ... }  (5-element string tuples)
 *   thens: { "0": ["actionType","actionValue"], "1": ["actionType","actionValue"] }
 */
export function buildRuleData(form: IRuleFormState): {
  ifs: Record<string, string[]>;
  thens: Record<string, string[]>;
} {
  const ifTuples: string[][] = [];

  // Description conditions → type "1"
  form.descriptions
    .filter((desc) => desc.value?.trim())
    .forEach((desc) => {
      ifTuples.push([
        String(IF_ORIGINAL_DESCRIPTION),
        String(descriptionMatchCode(desc.operator)),
        desc.value.trim(),
        '',
        ''
      ]);
    });

  // Amount conditions → type "2"
  form.amounts.forEach((amt) => {
    if (amt.operator === 'between') {
      if (amt.from && amt.to) {
        ifTuples.push([
          String(IF_AMOUNT),
          String(AMOUNT_MATCH_TYPE_BETWEEN),
          '',
          String(amt.from),
          String(amt.to)
        ]);
      }
    } else if (amt.value) {
      ifTuples.push([
        String(IF_AMOUNT),
        String(amountMatchCode(amt.operator)),
        String(amt.value),
        '',
        ''
      ]);
    }
  });

  // Date conditions → type "3"
  form.dates.forEach((dt) => {
    if (dt.operator === 'between') {
      if (dt.from && dt.to) {
        ifTuples.push([
          String(IF_DATE),
          String(DATE_MATCH_TYPE_BETWEEN),
          '',
          dt.from,
          dt.to
        ]);
      }
    } else if (dt.value) {
      ifTuples.push([
        String(IF_DATE),
        String(dateMatchCode(dt.operator)),
        dt.value,
        '',
        ''
      ]);
    }
  });

  // Account conditions → type "4"
  form.accountIds
    .filter((id) => id?.trim())
    .forEach((id) => {
      ifTuples.push([String(IF_ACCOUNT), '1', id.trim(), '', '']);
    });

  // Build ifs object with string keys
  const ifs: Record<string, string[]> = {};
  ifTuples.forEach((tuple, i) => {
    ifs[String(i)] = tuple;
  });

  // THEN actions — only include enabled actions
  const thenTuples: string[][] = [];
  if (form.renameDescriptionEnabled && form.renameDescriptionValue?.trim()) {
    thenTuples.push([
      String(THEN_ACTION_RENAME_MERCHANT),
      form.renameDescriptionValue.trim()
    ]);
  }
  if (form.updateCategoryEnabled && form.updateCategoryValue?.trim()) {
    thenTuples.push([
      String(THEN_ACTION_UPDATE_CATEGORY),
      form.updateCategoryValue
    ]);
  }
  const thens: Record<string, string[]> = {};
  thenTuples.forEach((tuple, i) => {
    thens[String(i)] = tuple;
  });

  return { ifs, thens };
}

/**
 * Reverse-map stored rule_data back into form state for editing.
 * Handles both V3 format (ifs/thens as objects) and legacy V4 format (nested arrays).
 */
export function decodeRuleData(ruleData: {
  ifs?: unknown;
  thens?: unknown;
}): Partial<IRuleFormState> {
  const out: IRuleFormState = {
    descriptions: [],
    merchantMatchers: [],
    amounts: [],
    dates: [],
    categoryIds: [],
    accountIds: [],
    renameDescriptionEnabled: false,
    renameDescriptionValue: '',
    updateCategoryEnabled: false,
    updateCategoryValue: '',
    addTagsEnabled: false,
    tagsValue: '',
    hideTransactionEnabled: false,
    linkToGoalEnabled: false
  };

  // Normalize ifs into a flat list of tuples (works for both V3 object and V4 array formats)
  const rawIfs = ruleData.ifs;
  const ifTuples: unknown[][] = [];

  if (rawIfs && typeof rawIfs === 'object' && !Array.isArray(rawIfs)) {
    // V3 format: ifs is an object { "0": [...], "1": [...] }
    Object.keys(rawIfs).forEach((key) => {
      const tuple = (rawIfs as Record<string, unknown>)[key];
      if (Array.isArray(tuple)) ifTuples.push(tuple);
    });
  } else if (Array.isArray(rawIfs)) {
    // V4 legacy: nested OR groups or flat array
    if (
      rawIfs.length > 0 &&
      Array.isArray(rawIfs[0]) &&
      Array.isArray((rawIfs[0] as unknown[])[0])
    ) {
      // Nested OR groups
      (rawIfs as unknown[][]).forEach((group) => {
        (group as unknown[]).forEach((cond) => {
          if (Array.isArray(cond)) ifTuples.push(cond as unknown[]);
        });
      });
    } else {
      // Flat array of conditions
      rawIfs.forEach((cond) => {
        if (Array.isArray(cond)) ifTuples.push(cond as unknown[]);
      });
    }
  }

  ifTuples.forEach((tuple) => {
    const type = Number(tuple[0]);
    const op = Number(tuple[1]);
    const val = String(tuple[2] ?? '');
    const from = String(tuple[3] ?? '');
    const to = String(tuple[4] ?? '');

    switch (type) {
      case IF_ORIGINAL_DESCRIPTION:
        out.descriptions.push({
          operator: descriptionMatchFromCode(op),
          value: val
        });
        break;
      case IF_MERCHANT:
        out.merchantMatchers.push({
          match_type: merchantMatchFromCode(op),
          value: val
        });
        break;
      case IF_AMOUNT: {
        const amt: IAmountCondition = {
          operator: amountMatchFromCode(op),
          value: '',
          from: '',
          to: ''
        };
        if (op === AMOUNT_MATCH_TYPE_BETWEEN) {
          amt.from = from || val;
          amt.to = to || String(tuple[3] ?? '');
        } else {
          amt.value = val;
        }
        out.amounts.push(amt);
        break;
      }
      case IF_DATE: {
        const dt: IDateCondition = {
          operator: dateMatchFromCode(op),
          value: '',
          from: '',
          to: ''
        };
        if (op === DATE_MATCH_TYPE_BETWEEN) {
          dt.from = from || val;
          dt.to = to || String(tuple[3] ?? '');
        } else {
          dt.value = val;
        }
        out.dates.push(dt);
        break;
      }
      case IF_CATEGORY:
        if (val && !out.categoryIds.includes(val)) out.categoryIds.push(val);
        break;
      case IF_ACCOUNT:
        if (val && !out.accountIds.includes(val)) out.accountIds.push(val);
        break;
      default:
        break;
    }
  });

  // Decode thens — handle both V3 object and V4 array format
  const rawThens = ruleData.thens;
  const thenTuples: unknown[][] = [];

  if (rawThens && typeof rawThens === 'object' && !Array.isArray(rawThens)) {
    Object.keys(rawThens).forEach((key) => {
      const tuple = (rawThens as Record<string, unknown>)[key];
      if (Array.isArray(tuple)) thenTuples.push(tuple);
    });
  } else if (Array.isArray(rawThens)) {
    rawThens.forEach((item) => {
      if (Array.isArray(item)) thenTuples.push(item as unknown[]);
    });
  }

  thenTuples.forEach((action) => {
    const type = Number(action[0]);
    const value = action[1];
    switch (type) {
      case THEN_ACTION_RENAME_MERCHANT:
        if (value && String(value).trim()) {
          out.renameDescriptionEnabled = true;
          out.renameDescriptionValue = String(value);
        }
        break;
      case THEN_ACTION_UPDATE_CATEGORY:
        if (value && String(value).trim()) {
          out.updateCategoryEnabled = true;
          out.updateCategoryValue = String(value);
        }
        break;
      case THEN_ACTION_ADD_TAG: {
        out.addTagsEnabled = true;
        const tags = Array.isArray(value) ? value : [value];
        out.tagsValue = tags.filter(Boolean).join(', ');
        break;
      }
      case THEN_ACTION_HIDE_TRANSACTION:
        out.hideTransactionEnabled = true;
        break;
      case THEN_ACTION_LINK_TO_GOAL:
        out.linkToGoalEnabled = true;
        break;
      default:
        break;
    }
  });

  return out;
}

export function deriveRuleName(form: IRuleFormState): string {
  const desc = form.descriptions.find((d) => d.value?.trim());
  if (desc) return `Description ${desc.operator} "${desc.value.trim()}"`;
  const m = form.merchantMatchers.find((x) => x.value.trim());
  if (m)
    return `Merchant ${m.match_type.replace('_', ' ')} "${m.value.trim()}"`;
  if (form.categoryIds.length > 0) return 'Category rule';
  const amt = form.amounts.find((a) => a.value || a.from);
  if (amt)
    return `Amount ${amt.operator.replace('_', ' ')} ${amt.value || amt.from}`;
  const dt = form.dates.find((d) => d.value || d.from);
  if (dt) return `Date ${dt.operator} ${dt.value || dt.from}`;
  return 'New Rule';
}
