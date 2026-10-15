import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AuthV3Service } from '../../services/auth-v3.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, Mail, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-forgot-password-v4',
  templateUrl: './forgot-password-v4.component.html',
  styleUrls: ['./forgot-password-v4.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgOptimizedImage, RouterLink, CommonInputFieldV4Component, CommonButtonV4Component, LucideAngularModule]
})
export class ForgotPasswordV4Component implements OnInit, OnDestroy {
  readonly MailIcon = Mail;
  readonly ArrowLeftIcon = ArrowLeft;
  public authV3Service = inject(AuthV3Service);
  private authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private appSettingService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  private formBuilder = inject(FormBuilder);
  private alertservice = inject(V4AlertService);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  forgotForm: UntypedFormGroup;
  displayTime: number = 0;
  subscriptions: Subscription[] = [];
  isDisable = true;
  showTimer = false;
  timerSetTime: Date;
  totalTimer: string;
  appConfig: IAppConfig;
  env = environment;
  logoPath = 'assets/main/zil_Money_logo.svg';
  isResetLinkLoading = signal(false);

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.localStorageService.removeItem('reset-email');
  }

  ngOnInit(): void {
    this.initForm();
    this.loadAppSettings();
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((data) => {
        if (data) {
          this.forgotForm.controls.username.patchValue(data.e);
        } else if (data == null) {
          this.forgotForm.controls.username.setValue('');
        }
      })
    );
    if (this.env.isItWhiteLabel) {
      const environmentId = this.env.env_id.includes('sandbox') ? this.env.env_id.replace('-sandbox', '') : this.env.env_id;
      this.logoPath = `assets/white_label/${environmentId}/assets/app_logo.svg`;
    } else {
      this.logoPath = this.authV3Service.appConfig?.zilMoneyLogo ?? 'assets/main/zil_Money_logo.svg';
    }
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
    if (this.localStorageService.getItem('reset-email')) {
      if (this.showTimer) {
        this.isDisable = true;
      }
      this.forgotForm.patchValue({
        username: this.localStorageService.getItem('reset-email')
      });
    }
    this.checkExistingTimer();
  }

  initForm() {
    this.forgotForm = this.formBuilder.group({
      username: ''
    });
  }

  @HostListener('window:beforeunload', ['$event']) goToPage(e: any) {
    e.preventDefault();
    e.returnValue = '';
  }

  sendEmailtoForgotPassword() {
    this.localStorageService.setItem('reset-email', this.forgotForm.controls.username.value);
    this.isDisable = true;
    this.isResetLinkLoading.set(true);
    this.subscriptions.push(
      this.authService
        .forgotPassword(this.forgotForm.value)
        .pipe(finalize(() => this.isResetLinkLoading.set(false)))
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.alertservice.successAlert({ content: res.message, timeout: 3000 });
              const startTimer = new Date();
              this.localStorageService.setItem('setTime', startTimer.toString());
              this.intervell(30);
            } else {
              this.isDisable = false;
            }
          },
          error: () => {
            this.isDisable = false;
          }
        })
    );
  }

  checkExistingTimer() {
    if (this.localStorageService.getItem('setTime')) {
      this.timerSetTime = new Date(this.localStorageService.getItem('setTime')!);
      const currentTime = new Date();
      const remainingSeconds = 30 - (currentTime.getTime() - this.timerSetTime.getTime()) / 1000;
      this.intervell(remainingSeconds);
    }
  }

  intervell(sec?: any) {
    this.showTimer = true;
    this.displayTime = sec;
    const timer = setInterval(() => {
      this.displayTime--;
      this.totalTimer = `00:${Math.floor(this.displayTime) < 10 ? '0' + (Math.floor(this.displayTime) < 0 ? '0' : Math.floor(this.displayTime)) : Math.floor(this.displayTime)}`;
      if (this.displayTime <= 0) {
        this.showTimer = false;
        this.localStorageService.removeItem('reset-email');
        this.localStorageService.removeItem('setTime');
        this.isDisable = false;
        clearInterval(timer);
      }
    }, 1000);
  }

  onEmailInput(el: HTMLInputElement) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailPattern.test(el.value)) {
      this.isDisable = this.showTimer;
    } else {
      this.isDisable = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
