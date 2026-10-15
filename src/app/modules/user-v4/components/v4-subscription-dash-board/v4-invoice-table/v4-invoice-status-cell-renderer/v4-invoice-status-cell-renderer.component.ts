import { CellClickedEvent, ICellRendererParams } from '@ag-grid-community/core';

type InsightTone = 'red' | 'orange' | 'blue' | 'green';

export function invoiceStatusCellRenderer(params: ICellRendererParams): string {
  if (!params?.value) return '';
  const value = String(params.value).toLowerCase();
  const label =
    params.value.charAt(0).toUpperCase() + params.value.slice(1).toLowerCase();
  let tone: InsightTone = 'blue';

  if (value === 'paid') {
    tone = 'green';
  } else if (value === 'pending' || value === 'due') {
    tone = 'orange';
  } else if (value === 'failed' || value === 'voided' || value === 'overdue') {
    tone = 'red';
  }

  const bgColor = `var(--v4-insight-card-background-${tone})`;
  const borderColor = `var(--v4-insight-card-border-${tone})`;
  const textColor = `var(--v4-insight-card-label-text-${tone})`;
  const dotColor = `var(--v4-insight-card-icon-${tone})`;

  const badge = `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:9999px;border:1px solid ${borderColor};font-size:11px;font-weight:600;font-family:var(--font-peridot);line-height:1;white-space:nowrap;background-color:${bgColor};color:${textColor};"><span style="width:6px;height:6px;border-radius:50%;background-color:${dotColor};"></span>${label}</span>`;

  if (value === 'overdue') {
    return `<div style="display:flex;align-items:center;gap:8px;">${badge}<button class="pay-now-btn" style="padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;color:var(--v4-secondary-brand-color);background:var(--v4-primary-brand-color);border:none;cursor:pointer;line-height:15px;">Pay Now</button></div>`;
  }
  return badge;
}

export function isPayNowClick(event: CellClickedEvent): boolean {
  return (
    (event?.event?.target as HTMLElement)?.classList?.contains('pay-now-btn') ??
    false
  );
}
