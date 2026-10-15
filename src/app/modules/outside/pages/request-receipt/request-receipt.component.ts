import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFileJpg,
  faFilePdf,
  faFilePng,
  faUpToLine
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { environment } from 'src/environments/environment';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { ActivatedRoute } from '@angular/router';
import { Subject, finalize, take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  standalone: true,
  selector: 'app-request-receipt',
  templateUrl: './request-receipt.component.html',
  styleUrls: ['./request-receipt.component.scss'],
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    CommonModule,
    NgOptimizedImage,
    NgClass
  ]
})
export class RequestReceiptComponent implements OnInit {
  public authV3Service = inject(AuthV3Service);
  private outsideService = inject(OutsideService);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  @ViewChild('fileInput') fileInput!: ElementRef;

  faPDF = faFilePdf;
  faPNG = faFilePng;
  faJPG = faFileJpg;
  faFileUpload = faUpToLine;

  selectedFile: File | null = null;
  isDragging = false;
  iduser: string;
  isLoading = signal(false);
  fileStatus = 'No file chosen';
  logoPath = 'assets/main/app_logo.svg';
  env = environment;
  destroy$ = new Subject();

  ngOnInit() {
    // Get the ID from the route parameters
    this.route.params.subscribe(params => {
      this.iduser = params['id'];
    });
     
    if (this.env.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${this.env.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.fileStatus = 'Invalid file type. Please upload PDF, JPG, or PNG.';
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.fileStatus = 'File too large. Maximum size is 5MB.';
      return;
    }

    this.selectedFile = file;
    this.fileStatus = `Selected: ${file.name}`;
  }

  uploadDocument() {
    if (!this.selectedFile) {
      this.fileStatus = 'Please select a file first';
      return;
    }

    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    this.outsideService.uploadPaymentReceipt(formData, this.iduser).pipe(
      finalize(() => this.isLoading.set(false)),
      take(1)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          const data = {
            content: res.message,
            close: true,
            timeout: 2000
          };
          this.alertService.successAlert(data)
        }
      },
      error: (err) => {
        this.isLoading.set(false)
      },
    });
  }

    /**
   * @description Method to open live chat
   */
    goToLiveChat(): void {
      this.dynamicWhiteLabelService.goToLiveChat();
    }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }
}
