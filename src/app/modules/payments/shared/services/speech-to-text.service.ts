import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable} from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { OcrDocument, OcrSaveModalData, PayeeCreationResult, SpeechRecognitionConfig, SpeechRecognitionError, SpeechToTextTranscription, CustomSpeechRecognitionResult } from './speech-to-text.model';
 


@Injectable({
  providedIn: 'root'
})
export class SpeechToTextService {
  private recognition: any;
  private isListening = new BehaviorSubject<boolean>(false);
  private isSupported = new BehaviorSubject<boolean>(false);
  private transcript = new BehaviorSubject<string>('');
  private interimTranscript = new BehaviorSubject<string>('');
  private error = new BehaviorSubject<SpeechRecognitionError | null>(null);
  private result = new BehaviorSubject<CustomSpeechRecognitionResult | null>(null);
  private http = inject(HttpClient);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);

  ROOT_URL = environment.rootUrl;

  private config: SpeechRecognitionConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  };

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.isSupported.next(false);
      this.error.next({
        error: 'not-supported',
        message: 'Speech recognition is not supported in this browser',
        code: 'BROWSER_NOT_SUPPORTED'
      });
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.isSupported.next(true);
      this.configureRecognition();
      this.setupEventHandlers();
    } catch (err) {
      this.isSupported.next(false);
      this.error.next({
        error: 'initialization-failed',
        message: 'Failed to initialize speech recognition',
        code: 'INIT_FAILED'
      });
    }
  }

  private configureRecognition(): void {
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  private setupEventHandlers(): void {
    this.recognition.onstart = () => {
      this.isListening.next(true);
      this.error.next(null);
    };

    this.recognition.onresult = (event: { resultIndex: number, results: { isFinal: boolean, [index: number]: { transcript: string, confidence: number } }[] }) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event: { error: string }) => {
      this.handleRecognitionError(event);
    };

    this.recognition.onend = () => {
      this.isListening.next(false);
      const currentInterim = this.interimTranscript.value;
      if (currentInterim && currentInterim.trim()) {
        const currentTranscript = this.transcript.value;
        const newTranscript = currentTranscript + currentInterim;
        this.transcript.next(newTranscript);
        this.interimTranscript.next('');
      }
    };

    this.recognition.onnomatch = () => {
      this.error.next({
        error: 'no-match',
        message: 'No speech was recognized',
        code: 'NO_MATCH'
      });
    };
  }

  private handleRecognitionResult(event: { resultIndex: number, results: { isFinal: boolean, [index: number]: { transcript: string, confidence: number } }[] }): void {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        
        // Emit final result
        this.result.next({
          transcript: finalTranscript,
          confidence: confidence,
          isFinal: true,
          timestamp: Date.now()
        });
      } else {
        interimTranscript += transcript;
      }
    }

    this.interimTranscript.next(interimTranscript);
    
    if (finalTranscript) {
      const currentTranscript = this.transcript.value;
      const newTranscript = currentTranscript + finalTranscript;
      this.transcript.next(newTranscript);
    }
  }

  private handleRecognitionError(event: { error: string }): void {
    this.isListening.next(false);
    
    const errorMessage = this.getErrorMessage(event.error);
    const errorCode = this.getErrorCode(event.error);
    
    this.error.next({
      error: event.error,
      message: errorMessage,
      code: errorCode
    });
  }

  private getErrorMessage(error: string): string {
    const errorMessages: { [key: string]: string } = {
      'no-speech': 'No speech was detected. Please try again.',
      'audio-capture': 'No microphone was found. Please ensure a microphone is connected.',
      'not-allowed': 'Permission to use microphone was denied. Please allow microphone access.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'network': 'Network error occurred during speech recognition.',
      'aborted': 'Speech recognition was aborted.',
      'language-not-supported': 'The selected language is not supported.'
    };
    
    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  private getErrorCode(error: string): string {
    const errorCodes: { [key: string]: string } = {
      'no-speech': 'NO_SPEECH',
      'audio-capture': 'AUDIO_CAPTURE',
      'not-allowed': 'NOT_ALLOWED',
      'service-not-allowed': 'SERVICE_NOT_ALLOWED',
      'bad-grammar': 'BAD_GRAMMAR',
      'network': 'NETWORK_ERROR',
      'aborted': 'ABORTED',
      'language-not-supported': 'LANGUAGE_NOT_SUPPORTED'
    };
    
    return errorCodes[error] || 'UNKNOWN_ERROR';
  }

  /**
   * Start speech recognition
   */
  startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.value) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      if (this.isListening.value) {
        resolve();
        return;
      }

      try {
        this.recognition.start();
        resolve();
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  /**
   * Stop speech recognition
   */
  stopListening(): void {
    if (this.isListening.value && this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {

        this.isListening.next(false);
      }
    }
  }

  /**
   * Abort speech recognition
   */
  abortListening(): void {
    if (this.isListening.value) {
      this.recognition.abort();
    }
  }

  /**
   * Clear the current transcript
   */
  clearTranscript(): void {
    this.transcript.next('');
    this.interimTranscript.next('');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      this.configureRecognition();
    }
  }

  /**
   * Set the language for speech recognition
   */
  setLanguage(language: string): void {
    this.updateConfig({ language });
  }

  /**
   * Set whether to return interim results
   */
  setInterimResults(interimResults: boolean): void {
    this.updateConfig({ interimResults });
  }

  /**
   * Set whether recognition should be continuous
   */
  setContinuous(continuous: boolean): void {
    this.updateConfig({ continuous });
  }

  /**
   * Check if microphone permission is granted
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Getters for observables
  get isListening$(): Observable<boolean> {
    return this.isListening.asObservable();
  }

  get isSupported$(): Observable<boolean> {
    return this.isSupported.asObservable();
  }

  get transcript$(): Observable<string> {
    return this.transcript.asObservable();
  }

  get interimTranscript$(): Observable<string> {
    return this.interimTranscript.asObservable();
  }

  get error$(): Observable<SpeechRecognitionError | null> {
    return this.error.asObservable();
  }

  get currentTranscript(): string {
    return this.transcript.value;
  }

  /**
   * Reset the speech recognition service to initial state
   */
  reset(): void {
    if (this.isListening.value) {
      this.stopListening();
    }
    this.clearTranscript();
    this.error.next(null);
    this.result.next(null);
  }

  /**
   * Upload ocr document
   * @param file - FormData containing the ocr document
   * @returns Observable of the API response for ocr document upload
   */
  uploadOcrDocument(file: FormData): Observable<IApiRes<OcrDocument>> {
    return this.http.post<IApiRes<OcrDocument>>(`${this.ROOT_URL}/zil-payments/ocr-extractions`, file);
  }


  /**
   * Speech To Text Transcription
   * @param file - FormData containing the ocr document
   * @returns Observable of the API response for ocr document upload
   */
  speechToTextTranscription(voice_input: string): Observable<IApiRes<SpeechToTextTranscription>> {
    return this.http.post<IApiRes<SpeechToTextTranscription>>(`${this.ROOT_URL}/zil-payments/ocr-extractions/voice`,{voice_input:voice_input});
  }

  /**
   * Handle payee creation from extracted vendor information
   * @param item - The OCR or Speech-to-Text data containing payee information
   * @returns Observable of the payee creation result
   */
  handlePayeeCreation(item: OcrSaveModalData): Observable<PayeeCreationResult> {
    return new Observable(observer => {
      const vendorInfo = {
        name: item.payeeName,
        email: item.payeeEmail,
        phone: item.payeePhone,
        address_line_1: item.payeeAddress || '',
        address_line_2: '',
        city: item.payeeCity || '',
        state: item.payeeState || '',
        country: item.payeeCountry || '',
        zip: item.payeeZipCode || ''
      };
      
      if (vendorInfo?.name) {
        this.payeeService.getPayees(1, vendorInfo.name).subscribe({
          next: (response: IApiRes<IPayeeDropdown[]>) => {
            if (response.success && response.data && response.data.length > 0) {
              const existingPayee = response.data[0];
              const result = this.createPayeeResult(item, existingPayee, false);
              observer.next(result);
              observer.complete();
            } else {
              this.createNewPayeeFromVendor(item, vendorInfo).subscribe({
                next: (result) => {
                  observer.next(result);
                  observer.complete();
                },
                error: (error) => {
                  observer.error(error);
                }
              });
            }
          },
          error: (error) => {
            this.createNewPayeeFromVendor(item, vendorInfo).subscribe({
              next: (result) => {
                observer.next(result);
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              }
            });
          }
        });
      } else {
        observer.error(new Error('Payee name is required'));
      }
    });
  }

  /**
   * Create new payee from vendor information
   * @param item - The OCR or Speech-to-Text data containing payee information
   * @param vendorInfo - The vendor information object
   * @returns Observable of the payee creation result
   */
  private createNewPayeeFromVendor(item: OcrSaveModalData, vendorInfo: { name: string, phone: string, address_line_1: string, address_line_2: string, city: string, state: string, country: string, zip: string }): Observable<PayeeCreationResult> {
    return new Observable(observer => {
      const payeeData = {
        payeeTypeId: '2', // Vendor type
        name: vendorInfo.name || '',
        payeeNickName: '',
        payeeEmail: item.payeeEmail || '',
        payeePhone: vendorInfo.phone || '',
        payeeCompanyName: vendorInfo.name || '',
        payeeAddressLine1: vendorInfo.address_line_1 || '',
        payeeAddressLine2: vendorInfo.address_line_2 || '', 
        payeeCity: vendorInfo.city || '',
        payeeState: vendorInfo.state || '',
        payeeCountry: vendorInfo.country || '',
        payeeZip: vendorInfo.zip || '',
        merchantCategory: '',
        entityType: 'individual',
        
        // Required fields with empty defaults
        customerAccountNumber: '',
        vendorAccountNumber: '',
        employeeAccountNumber: '',
        isRequestedBankInfo: '0',
        bankData: [],
        internationalWirePayeeAccounts: [],
        
        // Customer fields
        customerBankAccountId: '',
        customerCategory: '',
        customerDefaultPayMethod: '',
        customerFirstName: '',
        customerLastName: '',
        customerType: '',
        customerCompanyName: '',
        
        // Vendor fields
        vendorBankAccountId: '',
        vendorCategory: '',
        vendorDefaultPayMethod: '',
        vendorFirstName: '',
        vendorLastName: '',
        vendorType: '',
        vendorPaymentTerms: '',
        vendorTaxId: '',
        vendor_1099: '',
        vendorCompanyName: vendorInfo.name || '',
        
        // Employee fields
        employeeFirstName: '',
        employeeLastName: '',
        employeeDob: '',
        employeeSsn: '',
        employeeType: '',
        employeeHourlyRate: '',
        employeePaymentSchedule: '',
        employeeFillingStatus: '',
        employeeOvertimeRate: '',
        employeeYtdEarning: '',
        employeeYtdTax: '',
        employeeBankAccountId: '',
        employeeCategory: '',
        employeeDefaultPayMethod: '',
        is_requested_bank_info: 0,
        permission_email: 0,
        permission_sms: 0,
        merchant_category: ''
      };

      // Create payee using existing PayeeService
      this.payeeService.createPayee(payeeData).subscribe({
        next: (response: IApiRes<IPayeeDropdown>) => {
          if (response.success && response.data) {
            const result = this.createPayeeResult(item, response.data, true);
            observer.next(result);
            observer.complete();
          } else {
            observer.error(new Error('Failed to create payee'));
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Create the final payee result object
   * @param item - The OCR or Speech-to-Text data
   * @param payee - The payee object
   * @param isNewPayee - Whether this is a newly created payee
   * @returns PayeeCreationResult object
   */
  private createPayeeResult(item: OcrSaveModalData, payee: IPayeeDropdown, isNewPayee: boolean): PayeeCreationResult {
    if (isNewPayee) {
      this.sharedService.setNewPayeeCreatedData({
        payeeId: payee.id,
        payeeName: payee.name
      });
    }

    return {
      payeeId: payee.id,
      payeeName: payee.name,
      payeeEmail: item.payeeEmail,
      payeePhone: item.payeePhone,
      payeeAddress: item.payeeAddress,
      payeeCity: item.payeeCity,
      payeeState: item.payeeState,
      payeeZipCode: item.payeeZipCode,
      payeeCountry: item.payeeCountry,
      memo: item.memo,
      amount: item.amount,
      isNewPayee: isNewPayee,
      date: item.date
    };
  }
  
}