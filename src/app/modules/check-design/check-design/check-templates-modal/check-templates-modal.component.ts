import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { IAllTemplates, IPreMadeTemplates } from '../../model/check-template';
import { CheckTemplatePreviewModalComponent } from './check-template-preview-modal/check-template-preview-modal.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Represents Check template modal component.
 */
@Component({
  selector: 'app-check-templates-modal',
  templateUrl: './check-templates-modal.component.html',
  styleUrls: ['./check-templates-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    NgClass,
    NgOptimizedImage,
    MatTooltip,
    CommonButtonV35Component
  ]
})
export class CheckTemplatesModalComponent implements OnInit, OnDestroy {
  private checkDesignService = inject(CheckDesignService);
  private dialogRef = inject(MatDialogRef<CheckTemplatesModalComponent>);
  private dialog = inject(MatDialog);

  subscriptions: Subscription[] = [];
  preMadeTemplates: IPreMadeTemplates[];
  allPreMadeTemplates: IAllTemplates[];
  selectedPreTemplate: string;
  loading = false;
  templateId: string;
  spinnerloading = false;
  categoryName = 'All Templates';
  templates: IAllTemplates[];
  allTemplates: IAllTemplates[];

  ngOnInit(): void {
    this.getPremadeTemplates();
  }

  /**
   * @description Getting check templates using this method.
   */
  getPremadeTemplates() {
    this.spinnerloading = true;
    this.subscriptions.push(
      this.checkDesignService
        .getPremadeTemplates()
        .pipe(
          finalize(() => {
            this.spinnerloading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.preMadeTemplates = res.data.category_designs;
            this.allPreMadeTemplates = res.data.all_designs;
            this.selectedPreTemplate = res.data.all_designs[0].s3_image_link;
            this.templateId = res.data.all_designs[0].id;
            this.allTemplates = this.allPreMadeTemplates;
            this.preMadeTemplates.forEach((e) => {
              if (this.categoryName === e.category_name) {
                this.templates = e.items;
              }
            });
          }
        })
    );
  }

  /**
   * @description To select the check template.
   */
  selectedTemplate(temp: IAllTemplates) {
    this.selectedPreTemplate = temp.s3_image_link;
    this.templateId = temp.id;
  }

  /**
   * @description To select the check template category.
   */
  selectedCategory(item: IPreMadeTemplates) {
    this.categoryName = item.category_name;
    this.preMadeTemplates.forEach((e) => {
      if (this.categoryName === e.category_name) {
        this.templates = e.items;
        this.selectedPreTemplate = e.items[0].s3_image_link;
        this.templateId = e.items[0].id;
      }
    });
  }

  /**
   * @description To select the all template category.
   */
  selectedAllCategory() {
    this.categoryName = 'All Templates';
    this.allTemplates = this.allPreMadeTemplates;
    this.selectedPreTemplate = this.allPreMadeTemplates[0].s3_image_link;
    this.templateId = this.allPreMadeTemplates[0].id;
  }

  /**
   * @description view the check template.
   */
  zoomImage(template: IAllTemplates) {
    this.dialog.open(CheckTemplatePreviewModalComponent, {
      maxWidth: '700px',
      width: '100%',
      maxHeight: '85%',
      disableClose: false,
      autoFocus: false,
      data: template,
      panelClass: 'preview-modal'
    });
  }

  submit() {
    this.dialogRef.close({ templateId: this.templateId });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
