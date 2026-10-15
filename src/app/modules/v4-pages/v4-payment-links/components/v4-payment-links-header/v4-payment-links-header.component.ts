import { Component, HostBinding, output } from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  selector: 'app-v4-payment-links-header',
  standalone: true,
  imports: [V4PageHeaderComponent],
  templateUrl: './v4-payment-links-header.component.html'
})
export class V4PaymentLinksHeaderComponent {
  @HostBinding('class') class = 'block';

  goToSettings = output<void>();
  createNew = output<void>();

  readonly headerActions: IV4HeaderAction[] = [
    { id: 'settings', text: 'e-Payment Settings', style: 'navy' },
    { id: 'new', text: 'New Link', style: 'primary', isAddIcon: true }
  ];

  onAction(id: string | number): void {
    if (id === 'settings') this.goToSettings.emit();
    if (id === 'new') this.createNew.emit();
  }
}
