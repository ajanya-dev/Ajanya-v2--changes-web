import { Component, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  X,
  MessageCircle,
  Lightbulb,
  Headphones
} from 'lucide-angular';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4PermanentlyDeleteComponent } from 'src/app/modules/user-v4/modals/v4-permanently-delete/v4-permanently-delete.component';

@Component({
  selector: 'app-v4-account-close',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  templateUrl: './v4-account-close.component.html'
})
export class V4AccountCloseComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4AccountCloseComponent>);

  readonly XIcon = X;
  readonly MessageCircleIcon = MessageCircle;
  readonly LightbulbIcon = Lightbulb;
  readonly HeadphonesIcon = Headphones;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isOlliePay = environment.env_id === 'olliepay';

  chat(): void {
    if (this.staticWhiteLabelConditions.zohoSupportChat) {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
    } else {
      window.open(StaticWhiteLabelConditions.helpWebsite, '_blank');
    }
  }

  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  onClickSupport(): void {
    const { customerSupportNo, helpWebsite } = this.staticWhiteLabelConditions;
    if (customerSupportNo) {
      window.location.href = `tel:${customerSupportNo}`;
    } else if (helpWebsite) {
      window.open(helpWebsite, '_blank');
    }
  }

  closeMyAccount(): void {
    this.dialogRef.close();
    this.dialog.open(V4PermanentlyDeleteComponent, {
      maxWidth: '600px',
      width: '93%',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  keepMyAccount(): void {
    this.dialogRef.close();
    this.router.navigateByUrl('/v4/manage/home');
  }
}
