import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input
} from '@angular/core';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Utils } from 'src/app/data/utils';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { MatDialog } from '@angular/material/dialog';
import { IntroCommonDropdownComponent } from '../../intro-common-dropdown/intro-common-dropdown.component';
import { IntroService } from '../../../service/intro.service';
import {CheckMailModalComponent} from '../../check-mail-modal/check-mail-modal.component';
import {CheckEmailModalComponent} from '../../check-email-modal/check-email-modal.component';

@Component({
  selector: 'app-pay-form',
  templateUrl: './pay-form.component.html',
  styleUrls: ['./pay-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgSelectModule,
    AmountInputComponent,
    IntroCommonDropdownComponent,
    CommonButtonV35Component,
    FormsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    CheckMailModalComponent,
    FaIconComponent 
  ]
})
export class PayFormComponent {
  public formId = input('');
  @Output() saveEvent = new EventEmitter();
  @Output() sendEvent = new EventEmitter();
  @Output() printEvent = new EventEmitter();
  @Output() sendMailEvent = new EventEmitter();
  @Output() printCheckEvent = new EventEmitter();
  @Output() paymentEvent = new EventEmitter();
  utils = Utils;

  introService = inject(IntroService);
  dialog = inject(MatDialog);

  paymentButton() {
    this.paymentEvent.emit();
  }

  saveButton() {
    this.saveEvent.emit();
  }
  
  send() {
    this.sendEvent.emit();
  }

  print(){
    this.printEvent.emit();
  }

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }

  openPdf(check: string) {
    let pdf: string;
  
    if (check === 'white-check-paper') {
      pdf = '/assets/pdf/intro-tour-dummy-white-check-paper.pdf';
    } else {
      pdf = '/assets/pdf/intro-tour-dummy-check-paper.pdf';
    }
    this.printCheckEvent.emit();
    // Open the PDF file in a new tab
    window.open(pdf, '_blank');
  }
  
  openCheckMailModal( ) {
      this.introStepUpdate('.mat-mdc-dialog-container');
      const dialogRef = this.dialog.open(CheckMailModalComponent, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: {},
          ShippingCost: {},
          caldata: {},
          isDisableNavigation: true
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if(res === 'send-mail'){
          this.sendMailEvent.emit();
        }else{
          this.introStepUpdate('.intro-pay-receive');
        }
      });
    }
  
  openCheckEmailModal( ) {
      this.introStepUpdate('.mat-mdc-dialog-container');
      const dialogRef = this.dialog.open(CheckEmailModalComponent, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: {},
          ShippingCost: {},
          caldata: {},
          isDisableNavigation: true
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if(res === 'send-email'){
          this.sendMailEvent.emit();
        }else{
          this.introStepUpdate('.intro-pay-receive');
        }
      });
    }
  
}
