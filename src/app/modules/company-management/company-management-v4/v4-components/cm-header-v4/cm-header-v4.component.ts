import { Component, HostBinding, output } from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  selector: 'app-cm-header-v4',
  standalone: true,
  imports: [V4PageHeaderComponent],
  templateUrl: './cm-header-v4.component.html'
})
export class CmHeaderV4Component {
  @HostBinding('class') class = 'block';

  requestAccess = output<void>();
  addCompany = output<void>();

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'requestAccess',
      text: 'Request Access',
      style: 'navy',
      lucideIcon: 'mail',
      toolTip: 'Request access to a company you don\'t currently have access to.'
    },
    {
      id: 'addCompany',
      text: 'Add Company',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Add and register a new company to your account.'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'requestAccess') this.requestAccess.emit();
    if (id === 'addCompany') this.addCompany.emit();
  }
}
