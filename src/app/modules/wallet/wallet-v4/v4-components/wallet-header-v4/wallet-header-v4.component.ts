import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { WalletSettingsV4ModalComponent } from '../../modals/wallet-settings-v4/wallet-settings-v4-modal.component';

@Component({
  standalone: true,
  selector: 'app-wallet-header-v4',
  templateUrl: './wallet-header-v4.component.html',
  styleUrls: ['./wallet-header-v4.component.scss'],
  imports: [V4PageHeaderComponent, MatTooltipModule]
})
export class WalletHeaderV4Component {
  private dialog = inject(MatDialog);
  private router = inject(Router);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'issue-card',
      text: 'Issue Visa Card',
      style: 'navy',
      lucideIcon: 'credit-card',
      toolTip: 'Issue Visa Card'
    },
    {
      id: 'settings',
      text: '',
      style: 'navy',
      lucideIcon: 'settings',
      toolTip: 'Settings'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'issue-card') this.navigateToVirtualCard();
    if (id === 'settings') this.openSettings();
  }

  navigateToVirtualCard(): void {
    this.router.navigateByUrl('/v4/manage/virtual-card');
  }

  openSettings(): void {
    this.dialog.open(WalletSettingsV4ModalComponent, {
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded'
    });
  }

  openPrenoteAch(): void {
    window.open('/v4/manage/wallets/prenote-ach', '_blank');
  }
}
