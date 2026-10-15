import { Component, HostBinding, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { EditStubModalV4Component } from '../../v4-modals/edit-stub-modal-v4/edit-stub-modal-v4.component';

@Component({
  standalone: true,
  selector: 'app-deposit-slip-header-v4',
  imports: [V4PageHeaderComponent],
  templateUrl: './deposit-slip-header-v4.component.html'
})
export class DepositSlipHeaderV4Component {
  @HostBinding('class') class = 'block';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private matDialog = inject(MatDialog);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'editStub',
      text: 'Edit Stub',
      style: 'navy',
      isAddIcon: true,
      icon: ['fas', 'pen-to-square'],
      toolTip: 'Customize the deposit slip stub layout and fields'
    },
    {
      id: 'new',
      text: 'New Deposit Slip',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create a new deposit slip'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'editStub') this.goToSettings();
    if (id === 'new') this.createDepositSlip();
  }

  createDepositSlip(): void {
    this.router.navigate(['../create'], { relativeTo: this.activatedRoute });
  }

  goToSettings(): void {
    this.matDialog.open(EditStubModalV4Component, {
      width: '900px',
      maxWidth: '95vw',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
  }
}
