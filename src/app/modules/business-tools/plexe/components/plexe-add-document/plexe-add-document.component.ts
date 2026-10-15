import { AlertService } from '../../../../../shared/service/alert/alert.service';
import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IRequiredDocument,
  IRequiredDocumentFile
} from 'src/app/modules/business-tools/plexe/model/plexe';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-plexe-add-document',
  templateUrl: './plexe-add-document.component.html',
  styleUrls: ['./plexe-add-document.component.scss'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink]
})
export class PlexeAddDocumentComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;
  @Output() nextStep = new EventEmitter<boolean>();
  @Input() applicationId: string;
  subscription: Subscription[] = [];
  isLoading = false;
  ducumentList: IRequiredDocument[];
  requiedDocs: IRequiredDocumentFile[] = [];
  currentIndex: number;
  btnDisable = false;
  isEinChecked = false;

  constructor(
    private _plexeService: PlexeService,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getRequiredDocuments();
    this.checkEin();
  }

  /**
   * @description  Selecting files.
   *
   */
  selectFile(index: number, label: string): void {
    if (label === 'EIN' && this.isEinChecked) {
      return;
    }

    this.requiedDocs[index].file = undefined;
    this.currentIndex = index;
    this.fileInput.nativeElement.click();
    this.fileInput.nativeElement.dispatchEvent(new Event('change'));
  }

  /**
   * @description  Checking selected files.
   *
   */
  onFileSelected(event: Event): void {
    const eventTarget = event.target as HTMLInputElement;
    if (!(eventTarget.files?.length === 0)) {
      if (eventTarget.files) {
        const selectedFile: File = eventTarget.files[0];
        if (this.maxSizeValidator(selectedFile.size)) {
          this._alertService.failedAlert({ content: 'Max size is 2MB' });
          eventTarget.value = '';
          return;
        }
        const currentIndex = this.currentIndex;
        this.requiedDocs[currentIndex].file = selectedFile;
        eventTarget.value = '';
      }
    }
  }

  /**
   * @description  Checking Kyb Ein.
   *
   */
  checkEin(): void {
    this.subscription.push(
      this._plexeService.checkKybEin(this.applicationId).subscribe(
        (res) => {
          if (res) {
            this.isEinChecked = false;
          }
        },
        (err: HttpErrorResponse) => {
          if (err.error.errorCode === '1') {
            this.isEinChecked = true;
          }
        }
      )
    );
  }

  /**
   * @description  Get required documents.
   *
   */
  getRequiredDocuments(): void {
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getRequiredDocuments(this.applicationId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success && res?.data) {
            res.data.forEach((element) => {
              this.requiedDocs.push({
                label: element.label,
                docId: element.id,
                locations: element.locations
              });
            });
          }
        })
    );
  }

  /**
   * @description  File size validation.
   *
   */
  maxSizeValidator(size: number): boolean {
    const divider = 2e6;
    if (size > divider) {
      return true;
    }
    return false;
  }

  /**
   * @description  Submitting the datas.
   *
   */
  onSubmit(): void {
    const sendingData = new FormData();
    const filteredArray = this.requiedDocs.filter((obj) => obj.label !== 'EIN');

    if (
      (!this.isEinChecked &&
        this.requiedDocs.some((element) => !element.file)) ||
      (this.isEinChecked && filteredArray.some((element) => !element.file))
    ) {
      this._alertService.infoAlert({
        content: 'Please attach every required document before submitting'
      });
      return;
    }

    const docsArray = this.isEinChecked ? filteredArray : this.requiedDocs;

    for (let i = 0; i < docsArray.length; i++) {
      const element = docsArray[i];
      sendingData.append('data[' + i + '][label]', element.label);
      sendingData.append('data[' + i + '][id]', element.docId);
      if (element.file) {
        sendingData.append('data[' + i + '][file]', element.file);
      }
    }

    this.btnDisable = true;
    this.subscription.push(
      this._plexeService
        .addDocument(this.applicationId, sendingData)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.nextStep.emit(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
