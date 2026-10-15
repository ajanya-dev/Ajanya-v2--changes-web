import { Component, computed, input, output } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { IMetaData } from 'src/app/modules/receive-payments/model/ReceivePayment';

@Component({
  standalone: true,
  selector: 'app-metadata-activity-list-v4',
  templateUrl: './metadata-activity-list-v4.component.html',
  styleUrls: ['./metadata-activity-list-v4.component.scss'],
  imports: [KeyValuePipe]
})
export class MetadataActivityListV4Component {
  customField1 = input<string | null>(null);
  customField2 = input<string | null>(null);
  customField3 = input<string | null>(null);
  metaData = input<IMetaData[] | null>(null);
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);

  closed = output<void>();

  // Truthiness, not `!== null`: an empty-string custom field renders no row, so
  // counting it as data left the card claiming content it never showed.
  hasData = computed(
    () =>
      !!this.customField1() ||
      !!this.customField2() ||
      !!this.customField3() ||
      (this.metaData()?.length ?? 0) > 0
  );
}
