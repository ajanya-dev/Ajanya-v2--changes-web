import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';
import { HeaderService } from '../../service/header/header.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { UserProfileService } from '../../service/user/user-profile.service';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-try-new-version-v3-alert',
  templateUrl: './try-new-version-v3-alert.component.html',
  styleUrls: ['./try-new-version-v3-alert.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, NgOptimizedImage]
})
export class TryNewVersionV3AlertComponent {
  private router = inject(Router);
  public headerService = inject(HeaderService);
  private dialogRef = inject(MatDialogRef<TryNewVersionV3AlertComponent>);
  private localStorageService = inject(LocalStorageService);
  private userProfileService = inject(UserProfileService);
  private destroyRef = inject(DestroyRef);
  readonly CircleCheckIcon = CircleCheck;
  
  private userEncryptedId = this.localStorageService.getItem('encryptedUserId'); 
  readonly neverShowThisMessageAgain = Number(this.localStorageService.getItem('showNeverShowAgainCheckbox'));


  loading = signal(false);

  updatesInfo: { text: string; bold?: boolean }[][] = [
    [{ text: 'Track your ' }, { text: 'wallet balance', bold: true }, { text: ' in real time and ' }, { text: 'move money instantly', bold: true }, { text: '.' }],
    [{ text: 'Manage ' }, { text: 'vendors', bold: true }, { text: ' and pay ' }, { text: 'multiple recipients', bold: true }, { text: ' at once.' }],
    [{ text: 'Filter ' }, { text: 'transaction history', bold: true }, { text: ' and ' }, { text: 'reports', bold: true }, { text: ' the way you need.' }],
    [{ text: 'Send ' }, { text: 'ACH, checks, and wires', bold: true }, { text: ' from one place.' }],
    [{ text: 'Send ' }, { text: 'invoices', bold: true }, { text: ' and manage ' }, { text: 'bills', bold: true }, { text: ' in fewer steps.' }],
    [{ text: 'A ' }, { text: 'cleaner layout', bold: true }, { text: ' designed around how your team works.' }],
  ];

  switchToNewVersion(): void {
    this.dialogRef.close();
    const encryptedUserId = this.localStorageService.getItem('encryptedUserId') as string | null;
    this.localStorageService.setItem('isV4LayoutEnabled', 1);
    this.router.navigateByUrl('/v4/manage/payments-out/detailed/all');
    if (encryptedUserId) {
      this.userProfileService.changeLayoutV4(encryptedUserId, 1).subscribe({
        error: () => {
          this.localStorageService.setItem('isV4LayoutEnabled', 0);
        }
      });
    }
  }



  closeDialog(neverShowAgain:number): void {
    this.loading.set(true);
    this.userProfileService.preferOldUiFeedback({
      userId:this.userEncryptedId,
      neverShowAgain
    })
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(()=>{
        this.loading.set(false);
      })
    )
    .subscribe(() => {
        this.dialogRef.close();
    });
    
  }
}
