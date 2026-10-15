import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faTrashCan, faFont, faPen, faUpload, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { ISignatureField, FieldType } from '../../../../model/zil-sing.model';
import SignaturePad from 'signature_pad';

export interface IFieldInputModalData {
  field: ISignatureField;
  fieldType: FieldType;
  prefilledInitials?: string;
}

@Component({
  selector: 'app-field-input-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    FaIconComponent
  ],
  templateUrl: './field-input-modal.component.html',
  styleUrl: './field-input-modal.component.scss'
})
export class FieldInputModalComponent implements OnInit, AfterViewInit {
  private dialogRef = inject(MatDialogRef<FieldInputModalComponent>);
  private data = inject(MAT_DIALOG_DATA);

  field: ISignatureField = this.data.field;
  fieldType: FieldType = this.data.fieldType;
  faXmark = faXmark;
  faTrashCan = faTrashCan;
  faFont = faFont;
  faPen = faPen;
  faUpload = faUpload;
  faCheck = faCheck;
  
  // Tab management
  activeTab: 'TYPE' | 'DRAW' | 'UPLOAD' = 'TYPE';
  
  // For signature/initials - stores the selected signature image (base64)
  signatureDataUrl: string = '';
  
  // For text-based fields (name, text, date, company, email, title)
  textValue: string = '';

  // For TYPE tab - signature and initial text inputs
  signatureText: string = '';
  initialText: string = '';
  selectedSignatureStyle: 'cursive' | 'standard' | 'bold' = 'cursive';
  selectedInitialStyle: 'cursive' | 'standard' | 'bold' = 'cursive';
  acknowledgmentChecked: boolean = false;
  acknowledgmentError: boolean = false;
  initialError: boolean = false;
  signatureError: boolean = false;

  // Signature pad
  @ViewChild('signPad') signPad!: ElementRef<HTMLCanvasElement>;
  signaturePad: SignaturePad | null = null;
  showSignaturePad = false;
  isDrawing = false;

  ngOnInit(): void {
    // Initialize with TYPE tab active for signature/initial fields
    if (this.isImageField()) {
      this.activeTab = 'TYPE';
    }
    
    // Auto-populate initials if prefilled initials are provided
    if (this.fieldType === 'initial' && this.data.prefilledInitials) {
      this.initialText = this.data.prefilledInitials;
    }
    
    // If signature field and signature text already exists, extract initials
    if (this.fieldType === 'signature' && this.signatureText) {
      this.selectInitialStyle(this.selectedSignatureStyle);
      this.getSignatureFontFamily(this.selectedSignatureStyle);
      this.getSignatureFontWeight(this.selectedSignatureStyle);
      const extractedInitials = this.extractInitials(this.signatureText);
      if (extractedInitials && !this.initialText) {
        this.initialText = extractedInitials;
        // Sync initial style with signature style
        this.selectedInitialStyle = this.selectedSignatureStyle;
      }
    }
  }

  ngAfterViewInit(): void {
    // Initialize signature pad when shown
    if (this.showSignaturePad && this.signPad) {
      setTimeout(() => {
        this.initSignaturePad();
      }, 100);
    }
  }

  initSignaturePad(): void {
    if (!this.signPad?.nativeElement) return;
    
    this.signaturePad = new SignaturePad(this.signPad.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });

    // Resize canvas to match display size
    this.resizeCanvas();
  }

  resizeCanvas(): void {
    if (!this.signPad?.nativeElement || !this.signaturePad) return;
    
    const canvas = this.signPad.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    this.signaturePad.clear();
  }

  openSignaturePanel(): void {
    // Reset signature pad instance if it exists to allow reinitialization
    if (this.signaturePad) {
      this.signaturePad = null;
    }
    this.showSignaturePad = true;
    setTimeout(() => {
      if (!this.signaturePad && this.signPad?.nativeElement) {
        this.initSignaturePad();
      }
    }, 100);
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      // Reset signature pad instance so it can be reinitialized
      this.signaturePad = null;
    }
    this.signatureDataUrl = '';
    this.showSignaturePad = false;
  }

  saveSignature(): void {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      return;
    }
    
    // Get signature as base64 data URL
    const dataUrl = this.signaturePad.toDataURL('image/png');
    // Extract just the base64 part (remove data:image/png;base64, prefix)
    this.signatureDataUrl = dataUrl.split(',')[1] || dataUrl;
    this.showSignaturePad = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
        alert('Please select a valid image file (PNG, JPG, JPEG, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          // Extract just the base64 part
          this.signatureDataUrl = dataUrl.split(',')[1] || dataUrl;
          this.showSignaturePad = false;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('signature-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  isImageField(): boolean {
    return this.fieldType === 'signature' || this.fieldType === 'initial';
  }

  isTextField(): boolean {
    return !this.isImageField();
  }

  getFieldLabel(): string {
    const labels: Record<FieldType, string> = {
      signature: 'Sign Here',
      initial: 'Initial Here',
      name: 'Enter Full Name',
      sign_date: 'Enter Sign Date',
      company: 'Enter Company Name',
      title: 'Enter Job Title',
      date: 'Enter Date',
      text: 'Enter Text',
      email: 'Enter Email',
      checkbox: 'Enter Checkbox',
      radio: 'Enter Radio',
      attachment: 'Enter Attachment'
    };
    return labels[this.fieldType] || 'Enter Value';
  }

  getPlaceholder(): string {
    const placeholders: Record<FieldType, string> = {
      signature: 'Sign Here',
      initial: 'Initial Here',
      name: 'Enter your full name',
      sign_date: 'MM/DD/YYYY',
      company: 'Enter company name',
      title: 'Enter job title',
      date: 'MM/DD/YYYY',
      text: 'Enter text',
      email: 'Enter email address',
      checkbox: 'Enter checkbox',
      radio: 'Enter radio',
      attachment: 'Enter attachment'
    };
    return placeholders[this.fieldType] || 'Enter value';
  }

  getInputType(): string {
    if (this.fieldType === 'email') return 'email';
    if (this.fieldType === 'date' || this.fieldType === 'sign_date') return 'date';
    return 'text';
  }

  save(): void {
    if (this.isImageField()) {
      if (this.activeTab === 'TYPE') {
        if (this.fieldType === 'signature' && !this.signatureText.trim()) {
          this.signatureError = true;
          return;
        }
        this.signatureError = false;

        if (this.fieldType === 'initial' && !this.initialText.trim()) {
          this.initialError = true;
          return;
        }
        this.initialError = false;

        // Validate acknowledgment checkbox for TYPE tab
        if (!this.acknowledgmentChecked) {
          this.acknowledgmentError = true;
          return;
        }
        this.acknowledgmentError = false;

        // Generate text-based signature/initial
        if (this.fieldType === 'signature' && this.signatureText.trim()) {
          const base64Signature = this.generateTextSignature();
          // Extract and include initials when saving signature
          const extractedInitials = this.initialText || this.extractInitials(this.signatureText);
          this.dialogRef.close({
            fieldId: this.field.id,
            value: base64Signature,
            type: this.fieldType,
            extractedInitials,
            selectedSignatureStyle: this.selectedSignatureStyle
          });
        } else if (this.fieldType === 'initial' && this.initialText.trim()) {
          const base64Initial = this.generateTextInitial();
          this.dialogRef.close({
            fieldId: this.field.id,
            value: base64Initial,
            type: this.fieldType,
            selectedInitialStyle: this.selectedInitialStyle
          });
        }
        return;
      }

      // For DRAW and UPLOAD tabs
      // If signature pad exists and has content, automatically save it
      if (this.activeTab === 'DRAW' && this.signaturePad && !this.signaturePad.isEmpty() && !this.signatureDataUrl) {
        this.saveSignature();
      }

      if (!this.signatureDataUrl) {
        return;
      }
      // Ensure signature is base64 (without data URL prefix)
      let base64Signature = this.signatureDataUrl;
      if (base64Signature.includes(',')) {
        base64Signature = base64Signature.split(',')[1];
      }

      this.dialogRef.close({
        fieldId: this.field.id,
        value: base64Signature,
        type: this.fieldType,
        selectedSignatureStyle: this.selectedSignatureStyle
      });
    } else {
      if (!this.textValue.trim()) {
        return;
      }
      this.dialogRef.close({
        fieldId: this.field.id,
        value: this.textValue.trim(),
        type: this.fieldType,
        selectedInitialStyle: this.selectedInitialStyle
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  get canSave(): boolean {
    if (this.isImageField()) {
      if (this.activeTab === 'TYPE') {
        return !!(this.signatureText.trim() || this.initialText.trim()) && this.acknowledgmentChecked;
      } else if (this.activeTab === 'DRAW') {
        // Enable OK button if signature is already saved OR if signature pad has content
        return !!this.signatureDataUrl || (!!this.signaturePad && !this.signaturePad.isEmpty());
      } else {
        return !!this.signatureDataUrl;
      }
    } else {
      return !!this.textValue.trim();
    }
  }

  setActiveTab(tab: 'TYPE' | 'DRAW' | 'UPLOAD'): void {
    this.activeTab = tab;
    if (tab === 'DRAW') {
      // Initialize signature pad when switching to DRAW tab
      if (!this.showSignaturePad && !this.signatureDataUrl) {
        setTimeout(() => {
          this.openSignaturePanel();
        }, 100);
      }
    } else if (tab === 'UPLOAD') {
      this.showSignaturePad = false;
    } else if (tab === 'TYPE') {
      this.showSignaturePad = false;
    }
  }

  selectSignatureStyle(style: 'standard' | 'cursive' | 'bold'): void {
    this.selectedSignatureStyle = style;
    
    // If initials were auto-extracted from signature, sync the style
    if (this.fieldType === 'signature' && this.signatureText.trim() && this.initialText.trim()) {
      const extractedInitials = this.extractInitials(this.signatureText);
      if (extractedInitials === this.initialText) {
        this.selectedInitialStyle = style;
      }
    }
  }

  selectInitialStyle(style: 'standard' | 'cursive' | 'bold'): void {
    this.selectedInitialStyle = style;
  }

  getSignatureFontFamily(style: 'standard' | 'cursive' | 'bold'): string {
    switch (style) {
      case 'cursive':
        return 'Dancing Script, cursive';
      case 'bold':
        return 'Arial, sans-serif';
      default:
        return 'Arial, sans-serif';
    }
  }

  getSignatureFontWeight(style: 'standard' | 'cursive' | 'bold'): string {
    return style === 'bold' ? 'bold' : 'normal';
  }

  generateTextSignature(): string {
    // Generate signature image from text with selected font
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const fontFamily = this.getSignatureFontFamily(this.selectedSignatureStyle);
    const fontWeight = this.getSignatureFontWeight(this.selectedSignatureStyle);
    const fontSize = 48;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const text = this.signatureText || '';
    const metrics = ctx.measureText(text);
    
    canvas.width = metrics.width + 40;
    canvas.height = fontSize + 40;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 20, fontSize + 10);
    
    return canvas.toDataURL('image/png').split(',')[1] || canvas.toDataURL('image/png');
  }

  generateTextInitial(): string {
    // Generate initial image from text with selected font
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const fontFamily = this.getSignatureFontFamily(this.selectedInitialStyle);
    const fontWeight = this.getSignatureFontWeight(this.selectedInitialStyle);
    const fontSize = 48;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const text = this.initialText || '';
    const metrics = ctx.measureText(text);
    
    canvas.width = metrics.width + 40;
    canvas.height = fontSize + 40;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 20, fontSize + 10);
    
    return canvas.toDataURL('image/png').split(',')[1] || canvas.toDataURL('image/png');
  }

  /**
   * Extract initials from a full name
   * Examples: "John Doe" -> "JD", "John" -> "JJ", "John Michael Doe" -> "JD"
   */
  extractInitials(fullName: string): string {
    if (!fullName || !fullName.trim()) {
      return '';
    }

    const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 0) {
      return '';
    }
    
    if (nameParts.length === 1) {
      // Single name: return first letter twice (e.g., "John" -> "JJ")
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Multiple names: first letter of first name + first letter of last name
    const firstName = nameParts[0].charAt(0).toUpperCase();
    const lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    
    return firstName + lastName;
  }

  /**
   * Handle acknowledgment checkbox changes to clear/set error state
   */
  onAcknowledmentChange(): void {
    if (this.acknowledgmentChecked) {
      this.acknowledgmentError = false;
    } else {
      // Show error immediately when unchecked if there's content
      if (this.signatureText.trim() || this.initialText.trim()) {
        this.acknowledgmentError = true;
      }
    }
  }

  /**
   * Handle signature text changes to auto-extract and display initials
   */
  onSignatureTextChange(): void {
    if (this.fieldType === 'signature' && this.signatureText.trim()) {
      this.signatureError = false;
      const extractedInitials = this.extractInitials(this.signatureText);
      if (extractedInitials) {
        // Auto-populate initials when signature text changes
        // User can still manually edit the initial field if needed
        this.initialText = extractedInitials;
      }
    } else if (this.fieldType === 'signature' && !this.signatureText.trim()) {
      // Clear initials if signature is cleared
      this.initialText = '';
    }
  }

  onInitialTextChange(): void {
    this.selectInitialStyle(this.selectedSignatureStyle);
    this.getSignatureFontFamily(this.selectedSignatureStyle);
    this.getSignatureFontWeight(this.selectedSignatureStyle);
    if (this.fieldType === 'initial' && this.initialText.trim()) {
      this.initialError = false;
    }
  }

  onInitialTextBlur(): void {
    if (this.fieldType === 'initial' && !this.initialText.trim()) {
      this.initialError = true;
    } else {
      this.initialError = false;
    }
  }

  onSignatureTextBlur(): void {
    if (this.fieldType === 'signature' && !this.signatureText.trim()) {
      this.signatureError = true;
    } else {
      this.signatureError = false;
    }
  }

}

