import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

/** Single audit log entry (input-driven; no API dependency). */
export interface IAuditLogEntry {
  userFormatedActivityDate: string;
  status: string;
  userName: string;
  ipAddress: string;
  note: string;
}

@Component({
  standalone: true,
  selector: 'app-audit-log-list-v4',
  templateUrl: './audit-log-list-v4.component.html',
  styleUrls: ['./audit-log-list-v4.component.scss'],
  imports: [NgClass, LucideAngularModule, MatTooltip]
})
export class AuditLogListV4Component {
  logs = input<IAuditLogEntry[] | null>(null);
  /**
   * Maximum height of the component (e.g. '400px', '50vh', '20rem').
   * When set, the list body scrolls when content overflows. Omit or set to null for no max height.
   */
  maxHeight = input<string | null>('400px');
  /** Emitted when the user clicks the close button in the header. */
  closed = output<void>();

  getDatePart(formattedDate: string): string {
    return formattedDate?.split('- ')[0] ?? '';
  }

  getTimePart(formattedDate: string): string | null {
    return formattedDate?.includes('- ') ? formattedDate.split('- ')[1] : null;
  }
}
