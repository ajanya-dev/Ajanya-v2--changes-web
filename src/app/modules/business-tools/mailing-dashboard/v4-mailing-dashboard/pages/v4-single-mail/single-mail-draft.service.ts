import { Injectable } from '@angular/core';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';

export interface ISingleMailDraft {
  formValue: unknown;
  currentStep: 1 | 2 | 3;
  shippingAddress: 'to-payee-address' | 'to-custom-address';
  attachments: ICheckAttachmentData[];
  attachmentCount: number;
  isCustom: boolean;
  customElementGroup: { [key: string]: string }[];
  checkId: string | null;
}

@Injectable({ providedIn: 'root' })
export class SingleMailDraftService {
  private draft: ISingleMailDraft | null = null;

  save(draft: ISingleMailDraft): void {
    this.draft = draft;
  }

  peek(): ISingleMailDraft | null {
    return this.draft;
  }

  clear(): void {
    this.draft = null;
  }
}
