import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Raise My limit modal component. to be opened when user clicking on Raise my limit button in home page when user switches to card payments.
 * @class
 */
@Component({
  selector: 'app-raise-my-limit-modal',
  templateUrl: './raise-my-limit-modal.component.html',
  styleUrls: ['./raise-my-limit-modal.component.scss'],
  standalone: true,
  imports: [FaIconComponent]
})
export class RaiseMyLimitModalComponent {
  private _matDialogRef = inject(MatDialogRef);
  private _router = inject(Router);

  /**
   * @description Simply closing the modal, and redirecting to verify user id page.
   */
  add() {
    this._matDialogRef.close();
    this._router.navigate(['/manage/users/verify-user-id']);
  }

  /**
   * @description Close modal.
   */
  close() {
    this._matDialogRef.close();
  }
}
