import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { UserPermissionWalletComponent } from 'src/app/modules/user-management/components/user-permission-wallet/user-permission-wallet.component';

@Component({
  selector: 'app-user-permission-wallet-v4',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    MatTooltip,
    LucideAngularModule,
    TruncatePipe,
    CommonButtonV4Component
  ],
  templateUrl: './user-permission-wallet-v4.component.html',
  styleUrls: ['./user-permission-wallet-v4.component.scss']
})
export class UserPermissionWalletV4Component extends UserPermissionWalletComponent {}
