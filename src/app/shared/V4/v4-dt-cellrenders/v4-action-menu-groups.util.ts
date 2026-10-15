export type TMenuGroup = 'ACTIONS' | 'DOCUMENTS' | 'PROOF';

export interface IV4ActionGroup<T> {
  title: TMenuGroup;
  items: T[];
}

const GROUP_ORDER: TMenuGroup[] = ['ACTIONS', 'DOCUMENTS', 'PROOF'];

const ACTION_GROUP: Record<string, TMenuGroup> = {
  'Add Comment': 'DOCUMENTS',
  'Add Attachment': 'DOCUMENTS',
  'Audit Trail': 'DOCUMENTS',
  'Invoice Audit Trail': 'DOCUMENTS',
  'Payee Summary': 'DOCUMENTS',
  'Vendor Summary': 'DOCUMENTS',
  'Check Activity': 'DOCUMENTS',
  'Send Payment Proof': 'PROOF',
  'Send Mail Payment Proof': 'PROOF',
  'Get Signed Receipt': 'PROOF',
  'Proof of Mail': 'PROOF',
  'Add Proof of Delivery': 'PROOF'
};

const DESIGN_ORDER: Record<string, number> = [
  'Approve',
  'Reject',
  'Print',
  'Edit',
  'Void',
  'Unvoid',
  'Mark As Completed',
  'Mark As Reconciled',
  'Mark Paid / Partially',
  'Resend Email',
  'Resend SMS',
  'Clone Invoice',
  'Delete',
  'Add Comment',
  'Add Attachment',
  'Audit Trail',
  'Invoice Audit Trail',
  'Payee Summary',
  'Vendor Summary',
  'Check Activity',
  'Send Payment Proof',
  'Send Mail Payment Proof',
  'Get Signed Receipt',
  'Proof of Mail',
  'Add Proof of Delivery'
].reduce<Record<string, number>>((acc, name, index) => {
  acc[name] = index;
  return acc;
}, {});

export function groupV4ActionMenu<T>(
  actions: T[],
  getLabel: (item: T) => string
): IV4ActionGroup<T>[] {
  const sorted = [...(actions ?? [])].sort(
    (a, b) =>
      (DESIGN_ORDER[getLabel(a)] ?? 99) - (DESIGN_ORDER[getLabel(b)] ?? 99)
  );

  return GROUP_ORDER.map((title) => ({
    title,
    items: sorted.filter(
      (item) => (ACTION_GROUP[getLabel(item)] ?? 'ACTIONS') === title
    )
  })).filter((group) => group.items.length > 0);
}
