import { Component, inject, OnInit } from '@angular/core';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { LevelOneVerificationComponent } from './level-one-verification/level-one-verification.component';
import { LevelTwoVerificationComponent } from './level-two-verification/level-two-verification.component';
import { LevelThreeVerificationComponent } from './level-three-verification/level-three-verification.component';
import { CardTypes } from '../../constants/verification-center.constants';

/**
 * Component representing the steps for verification card.
 */
@Component({
  selector: 'app-verification-card-steps',
  standalone: true,
  imports: [
    LevelOneVerificationComponent,
    LevelTwoVerificationComponent,
    LevelThreeVerificationComponent
  ],
  templateUrl: './verification-card-steps.component.html',
  styleUrl: './verification-card-steps.component.scss'
})
export class VerificationCardStepsComponent implements OnInit {
  /** Service for accessing local storage. */
  private localStorageService = inject(LocalStorageService);

  /** Verification status fetched from local storage. */
  verificationStatus: IGettingStartedAPI;

  /** The selected verification level, retrieved from local storage. */
  selectedLevel: CardTypes;

  ngOnInit(): void {
    this.selectedLevel = this.localStorageService.getItem('verificationStep')
      ? this.localStorageService.getItem('verificationStep')
      : 'check';
    this.verificationStatus =
      this.localStorageService.getItem('gettingStartedData');
  }
}
