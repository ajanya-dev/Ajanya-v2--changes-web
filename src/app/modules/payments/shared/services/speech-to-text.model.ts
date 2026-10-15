
export interface CustomSpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    timestamp: number;
  }
  
  export interface SpeechRecognitionError {
    error: string;
    message: string;
    code: string;
  }
  
  export interface SpeechRecognitionConfig {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
  }
  
  
  export interface OcrDocument {
    success: boolean,
    payee_name: string,
    payee_email: string,
    payee_phone: string,
    payee_address: string,
    payee_city: string,
    payee_state: string,
    payee_country: string,
    payee_zip: string,
    amount: string,
    memo: string,
    date: string
  }
  export interface SpeechToTextTranscription {
    success: boolean,
    payee_name: string,
    payee_email: string,
    payee_phone: string,
    payee_address: string,
    payee_city: string,
    payee_state: string,
    payee_country: string,
    payee_zip: string,
    amount: string,
    memo: string,
    date: string
  }
  
  export interface OcrSaveModalData {
    success: boolean,
    payeeName: string,
    payeeEmail: string,
    payeePhone: string,
    payeeAddress: string,
    payeeCity: string,
    payeeState: string,
    payeeCountry: string,
    payeeZipCode: string,
    amount: string,
    memo: string,
    date: string
  }
  
  export interface PayeeCreationResult {
    payeeId: string;
    payeeName: string;
    payeeEmail: string;
    payeePhone: string;
    payeeAddress: string;
    payeeCity: string;
    payeeState: string;
    payeeZipCode: string;
    payeeCountry: string;
    memo: string;
    amount: string;
    isNewPayee: boolean;  
    date: string;
  }