import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CheckFromPdfSettingsComponent } from '../v4-check-from-pdf-settings/v4-check-from-pdf-settings.component';

@Component({
  selector: 'app-v4-trustbooks-settings',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4ControlMessageComponent
  ],
  templateUrl:
    '../v4-check-from-pdf-settings/v4-check-from-pdf-settings.component.html',
  styleUrls: [
    '../v4-check-from-pdf-settings/v4-check-from-pdf-settings.component.scss'
  ]
})
export class V4TrustbooksSettingsComponent extends V4CheckFromPdfSettingsComponent {
  override isTrustBooks = true;
}
