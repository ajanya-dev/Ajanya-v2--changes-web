/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  ViewChild
} from '@angular/core';
import { IUserPermissionList } from 'src/app/models/user';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective } from 'ngx-mask';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { UserWhitelistIpComponent } from 'src/app/modules/user-management/components/user-whitelist-ip/user-whitelist-ip.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { UserPermissionsNewComponent } from 'src/app/modules/user-management/pages/user-permissions-new/user-permissions-new.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClonePermissionModalV4Component } from '../../v4-modals/clone-permission-modal-v4/clone-permission-modal-v4.component';
import { UserPermissionWalletV4Component } from '../../v4-components/user-permission-wallet-v4/user-permission-wallet-v4.component';
import { UserPermissionPayeeV4Component } from '../../v4-components/user-permission-payee-v4/user-permission-payee-v4.component';
import { UserPermissionBankAccountV4Component } from '../../v4-components/user-permission-bank-account-v4/user-permission-bank-account-v4.component';
import {
  ModuleMeta,
  ModuleMetaPipe,
  PermEnabledCountPipe
} from './user-permissions-v4.pipes';

@Component({
  standalone: true,
  selector: 'app-user-permissions-v4',
  templateUrl: './user-permissions-v4.component.html',
  styleUrls: ['./user-permissions-v4.component.scss'],
  providers: [
    { provide: AlertService, useExisting: V4AlertService }
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgOptimizedImage,
    TitleCasePipe,
    MatTooltip,
    NgSelectModule,
    NgxMaskDirective,
    FontAwesomeModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    UserPermissionBankAccountV4Component,
    UserPermissionPayeeV4Component,
    UserWhitelistIpComponent,
    UserPermissionWalletV4Component,
    V4ControlMessageComponent,
    SearchFilterPipe,
    ModuleMetaPipe,
    PermEnabledCountPipe
  ]
})
export class UserPermissionsV4Component extends UserPermissionsNewComponent {
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  @ViewChild('permissionBody') permissionBody: ElementRef<HTMLElement>;

  /**
   * Bumped whenever `userPermissions` is mutated so the pure
   * `permEnabledCount` pipe re-computes. Mutations share the same
   * object reference, so without this counter the pipe would cache stale counts.
   */
  permsVersion = 0;

  /** Lucide icon + theme-token tile color for each module (keyed by displayName) */
  readonly moduleMeta: Record<string, ModuleMeta> = {
    'Bank account': {
      icon: 'building-2',
      tileBg: 'bg-v4-badge-info-bg-color',
      iconColor: 'text-v4-badge-info-text-color'
    },
    Card: {
      icon: 'credit-card',
      tileBg: 'bg-v4-badge-accent-bg-color',
      iconColor: 'text-v4-badge-accent-text-color'
    },
    Wallet: {
      icon: 'wallet',
      tileBg: 'bg-v4-badge-success-bg-color',
      iconColor: 'text-v4-badge-success-text-color'
    },
    CloudBank: {
      icon: 'cloud',
      tileBg: 'bg-v4-badge-neutral-bg-color',
      iconColor: 'text-v4-badge-neutral-text-color'
    },
    Payee: {
      icon: 'users',
      tileBg: 'bg-v4-badge-warning-bg-color',
      iconColor: 'text-v4-badge-warning-text-color'
    },
    Payments: {
      icon: 'dollar-sign',
      tileBg: 'bg-v4-badge-success-bg-color',
      iconColor: 'text-v4-badge-success-text-color'
    },
    'Receive Payment': {
      icon: 'hand-coins',
      tileBg: 'bg-v4-badge-warning-bg-color',
      iconColor: 'text-v4-badge-warning-text-color'
    },
    'Check Draft': {
      icon: 'banknote',
      tileBg: 'bg-v4-badge-info-bg-color',
      iconColor: 'text-v4-badge-info-text-color'
    },
    'Deposit Slip': {
      icon: 'coins',
      tileBg: 'bg-v4-badge-warning-bg-color',
      iconColor: 'text-v4-badge-warning-text-color'
    },
    'Cash Expense': {
      icon: 'wallet',
      tileBg: 'bg-v4-badge-error-bg-color',
      iconColor: 'text-v4-badge-error-text-color'
    },
    User: {
      icon: 'user',
      tileBg: 'bg-v4-badge-sky-bg-color',
      iconColor: 'text-v4-badge-sky-text-color'
    },
    'Other permissions': {
      icon: 'settings',
      tileBg: 'bg-v4-badge-neutral-bg-color',
      iconColor: 'text-v4-badge-neutral-text-color'
    },
    'Virtual Card': {
      icon: 'credit-card',
      tileBg: 'bg-v4-badge-accent-bg-color',
      iconColor: 'text-v4-badge-accent-text-color'
    },
    'International Payment': {
      icon: 'globe',
      tileBg: 'bg-v4-badge-info-bg-color',
      iconColor: 'text-v4-badge-info-text-color'
    },
    Bill: {
      icon: 'file-text',
      tileBg: 'bg-v4-badge-error-bg-color',
      iconColor: 'text-v4-badge-error-text-color'
    },
    Invoice: {
      icon: 'receipt',
      tileBg: 'bg-v4-badge-sky-bg-color',
      iconColor: 'text-v4-badge-sky-text-color'
    },
    Integration: {
      icon: 'layers',
      tileBg: 'bg-v4-badge-info-bg-color',
      iconColor: 'text-v4-badge-info-text-color'
    },
    'User Management': {
      icon: 'user-cog',
      tileBg: 'bg-v4-badge-accent-bg-color',
      iconColor: 'text-v4-badge-accent-text-color'
    },
    'Whitelist IP': {
      icon: 'shield-check',
      tileBg: 'bg-v4-badge-success-bg-color',
      iconColor: 'text-v4-badge-success-text-color'
    }
  };

  override onClickCheckBox(type?: string, isAllSelected?: boolean): void {
    super.onClickCheckBox(type, isAllSelected);
    this.permsVersion += 1;
  }

  override getPermissions(): void {
    super.getPermissions();
    this.permsVersion += 1;
  }

  protected override onPermissionsLoaded(): void {
    this.permsVersion += 1;
  }

  override tabChange(
    item: IUserPermissionList,
    i: number,
    source: 'core' | 'other' | 'combined' = 'combined'
  ): void {
    super.tabChange(item, i, source);
    this.permsVersion += 1;
    this.permissionBody?.nativeElement?.scrollTo({ top: 0 });
  }

  override openClonePermissionsModal() {
    const dialogRef = this.matDialog.open(ClonePermissionModalV4Component, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: { id: this.client_id, permission: this.permissionLength },
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.getPermissions();
        }
      });
  }

}
