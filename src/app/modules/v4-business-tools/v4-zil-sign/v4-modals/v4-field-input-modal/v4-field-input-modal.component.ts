import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import SignaturePad from 'signature_pad';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import {
  FieldType,
  ISignatureField
} from '../../v4-models/v4-zil-sign.models';

export interface IV4FieldInputModalData {
  field: ISignatureField;
  fieldType: FieldType;
  prefilledInitials?: string;
}

@Component({
  selector: 'app-v4-field-input-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatCheckbox,
    CommonButtonV4Component,
    V4DatePickerComponent,
    CommonTabV4Component
  ],
  templateUrl: './v4-field-input-modal.component.html',
  styleUrls: ['./v4-field-input-modal.component.scss']
})
export class V4FieldInputModalComponent implements OnInit, AfterViewInit {
  @ViewChild('signPad') signPad!: ElementRef<HTMLCanvasElement>;

  private dialogRef = inject(MatDialogRef<V4FieldInputModalComponent>);
  data = inject<IV4FieldInputModalData>(MAT_DIALOG_DATA);

  field: ISignatureField = this.data.field;
  fieldType: FieldType = this.data.fieldType;

  activeTab: 'TYPE' | 'DRAW' | 'UPLOAD' = 'TYPE';

  signatureDataUrl = '';
  textValue = '';
  signatureText = '';
  initialText = '';
  selectedSignatureStyle: 'cursive' | 'standard' | 'bold' = 'cursive';
  selectedInitialStyle: 'cursive' | 'standard' | 'bold' = 'cursive';
  acknowledgmentChecked = false;
  acknowledgmentError = false;
  initialError = false;
  signatureError = false;
  emailError = false;

  signaturePad: SignaturePad | null = null;
  showSignaturePad = false;
  signatureSource: 'draw' | 'upload' | null = null;

  ngOnInit(): void {
    if (this.isImageField()) {
      this.activeTab = 'TYPE';
    }
    if (this.fieldType === 'initial' && this.data.prefilledInitials) {
      this.initialText = this.data.prefilledInitials;
    }
  }

  ngAfterViewInit(): void {
    if (this.showSignaturePad && this.signPad) {
      setTimeout(() => this.initSignaturePad(), 100);
    }
  }

  initSignaturePad(): void {
    if (!this.signPad?.nativeElement) return;
    this.signaturePad = new SignaturePad(this.signPad.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
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
    if (ctx) ctx.scale(dpr, dpr);
    this.signaturePad.clear();
  }

  openSignaturePanel(): void {
    if (this.signaturePad) this.signaturePad = null;
    this.showSignaturePad = true;
    setTimeout(() => {
      if (!this.signaturePad && this.signPad?.nativeElement) {
        this.initSignaturePad();
      }
    }, 100);
  }

  clearSignature(): void {
    this.signaturePad?.clear();
    this.signatureDataUrl = '';
    this.signatureSource = null;
  }

  discardUploadedSignature(): void {
    this.signatureDataUrl = '';
    this.signatureSource = null;
    const fileInput = document.getElementById(
      'v4-signature-file-input'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  saveSignature(): void {
    if (!this.signaturePad || this.signaturePad.isEmpty()) return;
    const dataUrl = this.signaturePad.toDataURL('image/png');
    this.signatureDataUrl = dataUrl.split(',')[1] || dataUrl;
    this.showSignaturePad = false;
    this.signatureSource = 'draw';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
        return;
      }
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          this.signatureDataUrl = dataUrl.split(',')[1] || dataUrl;
          this.showSignaturePad = false;
          this.signatureSource = 'upload';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'v4-signature-file-input'
    ) as HTMLInputElement;
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
    if (this.fieldType === 'date' || this.fieldType === 'sign_date')
      return 'date';
    return 'text';
  }

  setActiveTab(tab: 'TYPE' | 'DRAW' | 'UPLOAD'): void {
    if (this.isTabDisabled(tab)) return;
    this.activeTab = tab;
    if (tab === 'DRAW') {
      if (!this.showSignaturePad && !this.signatureDataUrl) {
        setTimeout(() => this.openSignaturePanel(), 100);
      }
    } else if (tab === 'UPLOAD' || tab === 'TYPE') {
      this.showSignaturePad = false;
    }
  }

  onTabChange(tab: string): void {
    this.setActiveTab(tab as 'TYPE' | 'DRAW' | 'UPLOAD');
  }

  isTabDisabled(tab: 'TYPE' | 'DRAW' | 'UPLOAD'): boolean {
    if (tab === 'DRAW') return this.signatureSource === 'upload';
    if (tab === 'UPLOAD') return this.signatureSource === 'draw';
    return false;
  }

  get signatureTabs(): ITabItem[] {
    return [
      { label: 'Type', value: 'TYPE', disabled: this.isTabDisabled('TYPE') },
      { label: 'Draw', value: 'DRAW', disabled: this.isTabDisabled('DRAW') },
      { label: 'Upload', value: 'UPLOAD', disabled: this.isTabDisabled('UPLOAD') }
    ];
  }

  selectSignatureStyle(style: 'standard' | 'cursive' | 'bold'): void {
    this.selectedSignatureStyle = style;
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
    return (
      canvas.toDataURL('image/png').split(',')[1] || canvas.toDataURL('image/png')
    );
  }

  generateTextInitial(): string {
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
    return (
      canvas.toDataURL('image/png').split(',')[1] || canvas.toDataURL('image/png')
    );
  }

  extractInitials(fullName: string): string {
    if (!fullName?.trim()) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }

  onSignatureTextChange(): void {
    if (this.fieldType === 'signature' && this.signatureText.trim()) {
      this.signatureError = false;
      const extracted = this.extractInitials(this.signatureText);
      if (extracted) this.initialText = extracted;
    } else if (this.fieldType === 'signature' && !this.signatureText.trim()) {
      this.initialText = '';
    }
  }

  onAcknowledgmentChange(): void {
    if (this.acknowledgmentChecked) {
      this.acknowledgmentError = false;
    } else if (this.signatureText.trim() || this.initialText.trim()) {
      this.acknowledgmentError = true;
    }
  }

  get canSave(): boolean {
    if (this.isImageField()) {
      if (this.activeTab === 'TYPE') {
        return (
          !!(this.signatureText.trim() || this.initialText.trim()) &&
          this.acknowledgmentChecked
        );
      } else if (this.activeTab === 'DRAW') {
        return (
          !!this.signatureDataUrl ||
          (!!this.signaturePad && !this.signaturePad.isEmpty())
        );
      } else {
        return !!this.signatureDataUrl;
      }
    }
    return !!this.textValue.trim();
  }

  save(): void {
    if (this.isImageField()) {
      if (this.activeTab === 'TYPE') {
        if (this.fieldType === 'signature' && !this.signatureText.trim()) {
          this.signatureError = true;
          return;
        }
        if (this.fieldType === 'initial' && !this.initialText.trim()) {
          this.initialError = true;
          return;
        }
        if (!this.acknowledgmentChecked) {
          this.acknowledgmentError = true;
          return;
        }
        if (this.fieldType === 'signature' && this.signatureText.trim()) {
          this.dialogRef.close({
            fieldId: this.field.id,
            value: this.generateTextSignature(),
            type: this.fieldType,
            extractedInitials:
              this.initialText || this.extractInitials(this.signatureText),
            selectedSignatureStyle: this.selectedSignatureStyle
          });
        } else if (
          this.fieldType === 'initial' &&
          this.initialText.trim()
        ) {
          this.dialogRef.close({
            fieldId: this.field.id,
            value: this.generateTextInitial(),
            type: this.fieldType,
            selectedInitialStyle: this.selectedInitialStyle
          });
        }
        return;
      }

      if (
        this.activeTab === 'DRAW' &&
        this.signaturePad &&
        !this.signaturePad.isEmpty() &&
        !this.signatureDataUrl
      ) {
        this.saveSignature();
      }

      if (!this.signatureDataUrl) return;
      let base64 = this.signatureDataUrl;
      if (base64.includes(',')) base64 = base64.split(',')[1];

      this.dialogRef.close({
        fieldId: this.field.id,
        value: base64,
        type: this.fieldType,
        selectedSignatureStyle: this.selectedSignatureStyle
      });
    } else {
      const trimmed = this.textValue.trim();
      if (!trimmed) return;
      if (this.fieldType === 'email' && !this.isValidEmail(trimmed)) {
        this.emailError = true;
        return;
      }
      this.emailError = false;
      this.dialogRef.close({
        fieldId: this.field.id,
        value: trimmed,
        type: this.fieldType
      });
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isDateField(): boolean {
    return this.fieldType === 'date' || this.fieldType === 'sign_date';
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
