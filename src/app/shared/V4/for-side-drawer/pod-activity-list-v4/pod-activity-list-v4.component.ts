import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Download } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';

/** Single proof-of-delivery row for display (input-driven; aligned to list columns). */
export interface IPodActivityEntry {
  date: string;
  user: string;
  file: string;
  publicUrl?: string;
  encryptedId?: string;
}

@Component({
  standalone: true,
  selector: 'app-pod-activity-list-v4',
  templateUrl: './pod-activity-list-v4.component.html',
  styleUrls: ['./pod-activity-list-v4.component.scss'],
  imports: [LucideAngularModule, MatTooltipModule]
})
export class PodActivityListV4Component {
  readonly downloadIcon = Download;

  podList = input<IPodActivityEntry[] | null>(null);
  /**
   * Maximum height of the component (e.g. '400px', '50vh').
   * When set, the list body scrolls when content overflows.
   */
  maxHeight = input<string | null>('400px');
  /** Emitted when the user clicks the close button in the header. */
  closed = output<void>();
  /** Emitted when the user clicks the download button with the encrypted ID. */
  download = output<string>();
}
