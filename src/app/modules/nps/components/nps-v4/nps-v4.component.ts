import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ArrowRight, LucideAngularModule, MessageSquare, X } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NpsService } from 'src/app/shared/service/nps/nps.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

interface INpsScoreItem {
  score: number;
  tone: 'detractor' | 'passive' | 'promoter';
}

@Component({
  selector: 'app-nps-v4',
  standalone: true,
  templateUrl: './nps-v4.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class NpsV4Component implements OnInit, OnDestroy {
  private fb = inject(UntypedFormBuilder);
  private npsService = inject(NpsService);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  private dialogRef = inject<MatDialogRef<NpsV4Component>>(MatDialogRef);

  readonly MessageSquareIcon = MessageSquare;
  readonly CloseIcon = X;
  readonly ArrowRightIcon = ArrowRight;

  loading = false;
  scoreCount = 0;
  hoveredScore = 0;

  npsForm!: UntypedFormGroup;
  npsScoresArr: INpsScoreItem[] = [];

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.npsFormInit();
    this.buildScores();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private npsFormInit(): void {
    this.npsForm = this.fb.group({
      feedback: new UntypedFormControl('')
    });
  }

  private buildScores(): void {
    this.npsScoresArr = Array.from({ length: 10 }, (_, i) => {
      const score = i + 1;
      let tone: INpsScoreItem['tone'] = 'promoter';
      if (score <= 4) tone = 'detractor';
      else if (score <= 6) tone = 'passive';
      return { score, tone };
    });
  }

  selectScore(score: number): void {
    this.scoreCount = score;

    const feedbackCtrl = this.npsForm.controls['feedback'];
    if (this.scoreCount <= 6) {
      feedbackCtrl.setValidators(Validators.required);
    } else {
      feedbackCtrl.clearValidators();
    }
    feedbackCtrl.updateValueAndValidity();
  }

  onHover(score: number): void {
    this.hoveredScore = score;
  }

  onHoverLeave(): void {
    this.hoveredScore = 0;
  }

  isFilled(score: number): boolean {
    const ref = this.hoveredScore || this.scoreCount;
    return ref > 0 && score <= ref;
  }

  isSelected(score: number): boolean {
    return this.scoreCount === score;
  }

  submit(): void {
    if (this.scoreCount === 0) return;

    if (this.npsForm.invalid) {
      this.npsForm.markAllAsTouched();
      return;
    }

    const body = {
      score: this.scoreCount,
      comment: this.npsForm.value.feedback
    };

    this.loading = true;
    this.subscriptions.push(
      this.npsService
        .saveNpsScore(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((resp) => {
          if (resp?.success) {
            this.localStorageService.setItem('NPSVal', 1);
            this.npsService.setNPSVal(false);
            this.alertService.successAlert({
              title: 'Thank You!',
              content: 'Your feedback helps us improve our service.',
              close: true,
              timeout: 5000
            });
            this.dialogRef.close(true);
          }
        })
    );
  }

  remindLater(): void {
    this.subscriptions.push(
      this.npsService.remindMeLater(undefined).subscribe(() => {
        this.npsService.setNPSVal(false);
        this.localStorageService.setItem('NpsRemind', 1);
        this.dialogRef.close(false);
      })
    );
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
