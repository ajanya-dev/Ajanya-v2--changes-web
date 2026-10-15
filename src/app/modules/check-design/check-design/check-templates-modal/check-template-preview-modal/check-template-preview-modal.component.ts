import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { IAllTemplates } from '../../../model/check-template';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';

/**
 * @description Represents Check template preview modal component.
 */
@Component({
  selector: 'app-check-template-preview-modal',
  templateUrl: './check-template-preview-modal.component.html',
  styleUrls: ['./check-template-preview-modal.component.scss'],
  standalone: true,
  imports: [NgOptimizedImage, MatDialogClose, FaIconComponent]
})
export class CheckTemplatePreviewModalComponent implements OnInit {
  template: string;
  constructor(@Inject(MAT_DIALOG_DATA) public templateData: IAllTemplates) {}

  ngOnInit() {
    this.template = this.templateData.s3_image_link;
  }
}
