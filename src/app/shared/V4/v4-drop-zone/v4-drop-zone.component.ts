import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { LucideAngularModule, Upload, X, Loader } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-drop-zone-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './v4-drop-zone.component.html',
  styleUrl: './v4-drop-zone.component.scss'
})
export class DropZoneV4Component implements OnInit, OnDestroy {
  private alertService = inject(V4AlertService);

  private static readonly BYTES_PER_MB = 1e6;

  private static readonly MIME_TO_EXTENSION: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpeg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '.docx',
    'text/csv': '.csv',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      '.xlsx'
  };

  accept = input('');
  clearable = input(true);
  disabled = input(false);
  fileSizeMB = input(10);
  loading = input(false);
  description = input('');
  previewHeight = input<string>();
  previewWidth = input<string>();
  removeSubject = input(new Subject<boolean>());

  changeEvent = output<File[]>();
  removeEvent = output<File | undefined>();

  fileConstraintLabel = computed(() => {
    const types = this.getAcceptedDisplayTypes();
    const size = this.fileSizeMB();
    if (!types.length) {
      return `up to ${size}MB`;
    }
    return `${types.join(', ')} up to ${size}MB`;
  });

  @ViewChild('inputElm') inputEl: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      const h = this.previewHeight();
      if (h) this.previewStyle.height = h;
    });
    effect(() => {
      const w = this.previewWidth();
      if (w) this.previewStyle.width = w;
    });
  }

  readonly UploadIcon = Upload;
  readonly XIcon = X;
  readonly LoaderIcon = Loader;

  previewStyle: Pick<CSSStyleDeclaration, 'width' | 'height'> = {
    height: '100px',
    width: '100px'
  };

  hasFocus = false;
  preViewUrl?: ArrayBuffer | string;
  file?: File;
  isImage = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.removeSubject().pipe(takeUntil(this.destroy$)).subscribe((val: boolean) => {
      if (val) this.clear();
    });
  }

  changeFocus(state: boolean): void {
    this.hasFocus = state;
  }

  fileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const { files } = inputElement;

    if (!files?.length) {
      this.clear();
      return;
    }

    const file = files[0];
    if (!this.validateFile(file)) {
      inputElement.value = '';
      return;
    }

    this.changeEvent.emit([file]);
    this.file = file;
    this.isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = () => {
      this.preViewUrl = reader.result ?? undefined;
    };
    reader.readAsDataURL(file);
  }

  clear(): void {
    this.removeEvent.emit(this.file);
    this.hasFocus = false;
    this.isImage = false;
    this.file = undefined;
    this.preViewUrl = undefined;
    if (this.inputEl) {
      this.inputEl.nativeElement.value = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateFile(file: File): boolean {
    if (file.size / DropZoneV4Component.BYTES_PER_MB > this.fileSizeMB()) {
      this.alertService.warningAlert({
        content: `The selected file size should be less than ${this.fileSizeMB()}MB`,
        isCancel: false
      });
      return false;
    }

    const acceptedExtensions = this.getAcceptedExtensions();
    if (acceptedExtensions.length) {
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
      if (!acceptedExtensions.includes(fileExtension)) {
        this.alertService.warningAlert({
          content:
            'The file format you selected is not supported. Please choose a different file and try again.',
          isCancel: false
        });
        return false;
      }
    }

    return true;
  }

  private getAcceptedExtensions(): string[] {
    const acceptValue = this.accept().trim();
    if (!acceptValue) {
      return [];
    }

    return acceptValue
      .split(',')
      .map((token) => this.normalizeAcceptToken(token.trim()))
      .filter((ext): ext is string => !!ext);
  }

  private normalizeAcceptToken(token: string): string | undefined {
    if (!token) {
      return undefined;
    }

    if (token.includes('/')) {
      return DropZoneV4Component.MIME_TO_EXTENSION[token.toLowerCase()];
    }

    const extension = token.startsWith('.') ? token.slice(1) : token;
    return `.${extension.toLowerCase()}`;
  }

  private getAcceptedDisplayTypes(): string[] {
    const displayTypes = new Set<string>();

    this.getAcceptedExtensions().forEach((extension) => {
      const key = extension.slice(1);
      if (key === 'jpg' || key === 'jpeg') {
        displayTypes.add('JPG');
        return;
      }
      displayTypes.add(key.toUpperCase());
    });

    return Array.from(displayTypes);
  }
}
