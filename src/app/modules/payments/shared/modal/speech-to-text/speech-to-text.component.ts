import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMicrophone,
  faXmark,
  faStop,
  faEdit
} from '@fortawesome/pro-solid-svg-icons';
import { SpeechToTextService} from '../../services/speech-to-text.service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OcrSaveModalData, PayeeCreationResult } from '../../services/speech-to-text.model';

@Component({
  selector: 'app-speech-to-text',
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './speech-to-text.component.html',
  styleUrl: './speech-to-text.component.scss'
})
export class SpeechToTextComponent implements OnInit, OnDestroy {
  listeningText = signal<string>('Start Speaking');
  isListening = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  resultText = signal<string>('');
  isResultTextDisabled = signal<boolean>(true);
  hasResult = signal<boolean>(false);
  private hasStartedListening = false; 

  faXmark = faXmark;
  faMicrophone = faMicrophone;
  faStop = faStop;
  faEdit = faEdit;
  
  loading = signal<boolean>(false);

  private speechToTextService = inject(SpeechToTextService);
  private dialogRef = inject(MatDialogRef<SpeechToTextComponent>);
  private destroy$ = new Subject<void>();
  private alertService = inject(AlertService);

  ngOnInit() {
    this.resetState();
    
    this.speechToTextService.isListening$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isListening) => {
        this.isListening.set(isListening);
        if (!isListening && this.hasStartedListening) {
          this.listeningText.set('Start Speaking');
          this.checkForResult();
        }
      });

    this.speechToTextService.transcript$
      .pipe(takeUntil(this.destroy$))
      .subscribe((transcript) => {
        if (transcript) {
          this.resultText.set(transcript);
        }
      });

    this.speechToTextService.interimTranscript$
      .pipe(takeUntil(this.destroy$))
      .subscribe((interimTranscript) => {
        if (interimTranscript && this.isListening()) {
          this.resultText.set(
            this.speechToTextService.currentTranscript + interimTranscript
          );
        }
      });
  }

  startListening() {
    this.resetState();
    this.hasStartedListening = true;
    this.listeningText.set('Listening...');
    this.isListening.set(true);
    this.speechToTextService.startListening();
  }

  /**
   * Stop the speech recognition service
   */
  stopListening() {
    this.isListening.set(false);
    this.isProcessing.set(true);
    this.listeningText.set('Processing...');

    this.speechToTextService.stopListening();

    setTimeout(() => {
      this.checkForResult();
      this.isProcessing.set(false);
    }, 100);
  }

  enableTextEditing() {
    this.isResultTextDisabled.set(false);
  }

  onResultTextChange(event: { target: { value: string } }) {
    this.resultText.set(event.target.value);
  }

  tryAgain() {
    this.resetState();
  }

  apply() {

    if(this.resultText().trim() === '') {
      this.alertService.warningAlert({
        content: 'Please enter a valid text',
        close: false
      });
      return;
    }

    this.loading.set(true);
    this.speechToTextService.speechToTextTranscription(this.resultText()).pipe(
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      if (res.success && res.data) {
        // Convert speech-to-text data to OcrSaveModalData format
        const ocrData: OcrSaveModalData = {
          success: res.data.success,
          payeeName: res.data.payee_name,
          payeeEmail: res.data.payee_email,
          payeePhone: res.data.payee_phone,
          payeeAddress: res.data.payee_address,
          payeeCity: res.data.payee_city,
          payeeState: res.data.payee_state,
          payeeCountry: res.data.payee_country,
          payeeZipCode: res.data.payee_zip,
          amount: res.data.amount,
          memo: res.data.memo,
          date: res.data.date
        };

        if(!ocrData.payeeName || ocrData.payeeName.trim() === '') {
          this.dialogRef.close({success: true, data: ocrData});
          return;
        }

        // Use the abstracted payee creation method
        this.speechToTextService.handlePayeeCreation(ocrData).pipe(
          finalize(() => {
            this.loading.set(false);
          }),
          takeUntil(this.destroy$)
        ).subscribe({
          next: (result: PayeeCreationResult) => {
            this.dialogRef.close({success: true, data: result});
          },
          error: (error) => {
            this.dialogRef.close({success: false, data: null});
          }
        });
      } else {
        this.loading.set(false);
        this.dialogRef.close({success: false, data: null});
      }
    });

    this.speechToTextService.reset();
  }

  close() {
    this.speechToTextService.reset();
    this.resetState();
    this.dialogRef.close({success: false, data: null});
  }

  private checkForResult() {
    const currentTranscript = this.resultText();
    if (currentTranscript && currentTranscript.trim()) {
      this.hasResult.set(true);
      this.isResultTextDisabled.set(true);
      this.listeningText.set('Start Speaking');
    } else {
      this.listeningText.set('No speech detected. Try again.');
    }
  }

  private resetState() {
    this.hasResult.set(false);
    this.resultText.set('');
    this.isResultTextDisabled.set(true);
    this.listeningText.set('Start Speaking');
    this.isListening.set(false);
    this.isProcessing.set(false);
    this.speechToTextService.clearTranscript();
  }

  ngOnDestroy() {
    this.speechToTextService.reset();
    this.resetState();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
