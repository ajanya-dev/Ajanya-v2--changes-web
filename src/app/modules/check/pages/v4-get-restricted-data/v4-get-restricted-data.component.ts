import { Component, inject } from '@angular/core';
import { LucideAngularModule, Mail, Printer, Landmark, Headphones, UserPen, ListChecks, Zap, Sparkles } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  selector: 'app-v4-get-restricted-data',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './v4-get-restricted-data.component.html',
  styleUrls: ['./v4-get-restricted-data.component.scss']
})
export class V4GetRestrictedDataComponent {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  readonly icons = {
    zap: Zap,
    sparkles: Sparkles,
    mail: Mail,
    printer: Printer,
    landmark: Landmark,
    headphones: Headphones,
    userPen: UserPen,
    listChecks: ListChecks
  };

  readonly defaultMethods = [
    { icon: Mail, label: 'Mail or Email check to payee' },
    { icon: Printer, label: 'Print check' },
    { icon: Landmark, label: 'Direct deposit to payee' }
  ];

  readonly setupSteps = [
    { icon: Headphones, label: 'Contact customer support to enable feature' },
    { icon: UserPen, label: 'From Payee page, add or edit an existing payee' },
    { icon: ListChecks, label: 'Select from "Default pay method" and save the payee' }
  ];

  enableNow(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
