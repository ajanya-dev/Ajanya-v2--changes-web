import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { ViewAuditTrailComponent } from '../../../components/actions/view-audit-trail/view-audit-trail.component';

interface IAuditTrailData {
  id: string;
  slug: string;
  heading: string;
  hideColumns?: string[];
  suffix?: string;
  columns?: { name: string; field: string };
}

/**
 * @description Modal component for viewing audit trail. Audit trail is a documentary evidence of the sequence of activities used in checks and bills etc.
 */
@Component({
  selector: 'app-view-audit-trail-modal',
  templateUrl: './view-audit-trail-modal.component.html',
  styleUrls: ['./view-audit-trail-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, ViewAuditTrailComponent, MatDialogActions]
})
export class ViewAuditTrailModalComponent {
  // PASS 'slug', 'id' and 'heading' //
  //=================================//

  constructor(@Inject(MAT_DIALOG_DATA) public data: IAuditTrailData) {}
}

/* EXAMPLE

  onAuditTrial(selectedItem: any) {
    this._dialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        heading: 'Bill',
        slug: 'bills',
        id: selectedItem.action
      }
    });
  }

*/
