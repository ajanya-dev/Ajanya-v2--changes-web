import { finalize } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

/**
 * Component for the welcome step of the affiliate program.
 */
@Component({
  selector: 'app-affiliate-pap-welcome',
  templateUrl: './affiliate-pap-welcome.component.html',
  styleUrls: ['./affiliate-pap-welcome.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    CommonButtonV35Component
  ]
})
export class AffiliatePapWelcomeComponent implements OnDestroy {
  @Output() nextEvent = new EventEmitter();
  @Output() backEvent = new EventEmitter();

  private _affiliateService = inject(AffiliateProgramsService);
  private _alertService = inject(AlertService);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  
  /** Indicates whether a request is currently loading. */
  loading = false;

  /** List of subscriptions to be unsubscribed when the component is destroyed. */
  subscriptions: Subscription[] = [];

  /** Base URL for the affiliate program website. */
  baseUrl = environment.website;

  /** Form control for the affiliate code input field. */
  affiliateCode = new FormControl<string>('', Validators.required);

  /**
   * Handles the "Back" button click event.
   */
  onBack() {
    this.backEvent.emit();
  }

  /**
   * Generates an affiliate link based on the provided affiliate code.
   * Sends a request to join the affiliate program.
   */
  generateLink() {
    this.affiliateCode.markAsTouched();
    if (this.affiliateCode.invalid) return;
    if (this.affiliateCode.value) {
      this.loading = true;
      this.subscriptions.push(
        this._affiliateService
          .joinAffiliate(this.affiliateCode.value)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res) => {
              this._alertService.successAlert({ content: res.message });
              this.nextEvent.emit();
            }
          })
      );
    }
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
