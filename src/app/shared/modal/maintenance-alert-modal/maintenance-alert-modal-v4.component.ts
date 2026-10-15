import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, Clock, Mail, Phone, X } from 'lucide-angular';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-maintenance-alert-modal-v4',
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './maintenance-alert-modal-v4.component.html'
})
export class MaintenanceAlertModalV4Component {
  readonly injectedData: { content: string } = inject(MAT_DIALOG_DATA);
  readonly staticWhiteLabelConditions = StaticWhiteLabelConditions;

  readonly ClockIcon = Clock;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly XIcon = X;
}
