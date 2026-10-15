import { inject, Injectable } from '@angular/core';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import {
  IResetPasswordConfig,
  IResetPasswordInitialData
} from 'src/app/shared/modal/reset-password-modal/reset-password-modal.interfaces';
import { ResetPasswordModalComponent } from 'src/app/shared/modal/reset-password-modal/reset-password-modal.component';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { AppSettingsService } from './app-settings.service';

/**
 * @description Service for New User Password Setup.
 * @class Service Class
 */
@Injectable({
  providedIn: 'root'
})
export class NewUserPasswordSetupService {
  private appSettingService = inject(AppSettingsService);
  private companyManagementService = inject(CompanyManagementService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  environment = environment;

  /**
   * @description Subscribes to invitation tracker and shows ResetPasswordModal when invitation is detected
   */
  subscribeToInvitationState(): void {
    const invitationObject: {
      invitation: boolean;
      externalToken: string;
      email: string;
      initiated_from: string | undefined;
    } = JSON.parse(sessionStorage.getItem('invitationObject') ?? '{}');
    let modalOpened = false;
    this.appSettingService.invitationState$.subscribe(
      (hasInvitation: {
        invitation: boolean;
        externalToken: string;
        email: string;
        initiated_from: string | undefined;
      }) => {
        if (modalOpened || environment.env_id === 'compass') return;
        if (hasInvitation?.invitation || invitationObject?.invitation) {
          modalOpened = true;
          if (
            hasInvitation?.initiated_from === 'cardProgramWalletGiftCard' ||
            invitationObject?.initiated_from === 'cardProgramWalletGiftCard' ||
            hasInvitation?.initiated_from === 'cardProgramReceiverRequest' ||
            invitationObject?.initiated_from === 'cardProgramReceiverRequest'
          ) {
            this.openResetPasswordModal();
          } else {
            this.companyManagementService.loading.autoAccepting = true;
            this.companyManagementService.isComapanyLoaded$.subscribe(
              (isLoaded: boolean) => {
                if (isLoaded) {
                  this.companyManagementService.loading.autoAccepting = false;
                  this.openResetPasswordModal();
                }
              }
            );
          }
        }
      }
    );
  }

  /**
   * @description Opens the ResetPasswordModal for invitation flow
   */
  openResetPasswordModal(): void {
    // Prepare configuration for the modal
    const config: IResetPasswordConfig = {
      title: 'Account Setup',
      subtitle: 'Enter a new password for your account.',
      mainButtonText:
        this.companyManagementService.invitedCompanies.length === 1
          ? 'Create Account & Accept Invitation'
          : 'Create Account',
      secondaryButtonText: 'Logout'
    };

    // Prepare initial data
    const initialData: IResetPasswordInitialData = {
      email: this.appSettingService.getInvitationState().email,
      externalToken: this.appSettingService.getInvitationState().externalToken
    };

    const dialogRef = this.dialog.open(ResetPasswordModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      data: { config, initialData }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'reset') {
        // Get invited companies directly from CompanyManagementService
        const { invitedCompanies } = this.companyManagementService;

        if (!invitedCompanies || invitedCompanies.length === 0) {
          return;
        }

        if (invitedCompanies.length === 1) {
          this.companyManagementService.loading.autoAccepting = true;
          this.companyManagementService.acceptCompany(
            0,
            invitedCompanies[0],
            true
          );
        }

        // Reset invitation state after modal closes
        this.appSettingService.setInvitationState(false, '', '');
      } else if (result?.action === 'logout') {
        // Handle logout logic
        this.authService.Logout();
      } else {
        // Handle cancel/close - reset invitation state
        this.appSettingService.setInvitationState(false, '', '');
      }
      sessionStorage.removeItem('invitationObject');
    });
  }
}
