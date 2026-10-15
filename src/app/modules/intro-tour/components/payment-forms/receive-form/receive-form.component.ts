import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MemoInputComponent } from 'src/app/shared/components/memo-input/memo-input.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { IntroCommonDropdownComponent } from '../../intro-common-dropdown/intro-common-dropdown.component';
import { IntroService } from '../../../service/intro.service';

@Component({
  selector: 'app-receive-form',
  templateUrl: './receive-form.component.html',
  styleUrls: ['./receive-form.component.scss'],
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
    MatCheckboxModule,
    MemoInputComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    MatTooltipModule
  ]
})
export class ReceiveFormComponent {
  public formId = input('');
  @Output() paymentRequest = new EventEmitter();

  private introService = inject(IntroService);

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }

  requestButton() {
    this.paymentRequest.emit();
  }

  commonDropdownChange(selector: string) {
    this.introStepUpdate(selector);
  }
}
