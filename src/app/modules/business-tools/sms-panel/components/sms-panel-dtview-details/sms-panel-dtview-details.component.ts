import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { GroupDetailsComponent } from '../group-details/group-details.component';
import { ICampaignRowData } from '../../model/sms-panel';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sms-panel-dtview-details',
  templateUrl: './sms-panel-dtview-details.component.html',
  styleUrls: ['./sms-panel-dtview-details.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class SMSPanelDtviewDetailsComponent
  implements ICellRendererAngularComp
{
  getCurrentColumn: ICampaignRowData;
  colDef: ColDef | undefined;

  constructor(private matDialogue: MatDialog) {}

  agInit(params: ICellRendererParams) {
    this.getCurrentColumn = params.data;
    this.colDef = params.colDef;
  }

  refresh(): boolean {
    return true;
  }

  /**
   * @description open group details component.
   */
  openGroupDetails() {
    this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '800px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'details', groupData: this.getCurrentColumn }
    });
  }
}
