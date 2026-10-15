import { Component, input, output, signal } from '@angular/core';
import {
  LucideAngularModule,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-angular';
import { IMailedAttachment } from 'src/app/modules/check/model/check';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';

@Component({
  standalone: true,
  selector: 'app-po-mailed-attachments-list',
  templateUrl: './mailed-attachments-list.component.html',
  styleUrls: ['./mailed-attachments-list.component.scss'],
  imports: [LucideAngularModule, PdDateTimeComponent]
})
export class PoMailedAttachmentsListComponent {
  readonly externalLinkIcon = ExternalLink;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  attachments = input<IMailedAttachment[] | null>(null);
  maxHeight = input<string | null>('400px');

  closed = output<void>();
  viewAttachment = output<string>();

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }
}
