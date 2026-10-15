import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-maintenance-alert-modal',
  standalone: true,
  imports: [MatDialogClose],
  templateUrl: './maintenance-alert-modal.component.html',
  styleUrl: './maintenance-alert-modal.component.scss'
})
export class MaintenanceAlertModalComponent {
 public  injectedData : {content: HTMLElement} = inject(MAT_DIALOG_DATA);
 public staticWhiteLabelConditions = StaticWhiteLabelConditions;
}
