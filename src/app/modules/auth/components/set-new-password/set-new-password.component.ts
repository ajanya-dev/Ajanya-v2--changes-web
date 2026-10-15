import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AuthV3Service } from '../../services/auth-v3.service';
import { NgClass, NgIf, NgStyle } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-set-new-password',
  templateUrl: './set-new-password.component.html',
  styleUrls: ['./set-new-password.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgClass,
    NgIf,
    NgStyle,
    CommonButtonV35Component
  ]
})
export class SetNewPasswordComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);

  ngOnInit() {
    this.authV3Service.initForm();
  }

  ngOnDestroy(): void {
    this.authV3Service.subscriptions.forEach((s: Subscription) =>
      s.unsubscribe()
    );
  }
}
