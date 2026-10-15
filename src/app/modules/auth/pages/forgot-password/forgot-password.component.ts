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
import { NgIf, NgClass, NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AuthV3Service } from '../../services/auth-v3.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, ReactiveFormsModule, NgClass,NgOptimizedImage,CommonButtonV35Component,RouterLink]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);
  private authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private appSettingService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  private formBuilder = inject(FormBuilder);
  private alertservice=inject(AlertService);
  
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isEmailed = false;
  forgotForm: UntypedFormGroup;
  displayTime: number=0;
  subscriptions: Subscription[] = [];
  isDisable = true;
  config: any = {};
  showTimer = false;
  resendLoader = false;
  currentTime: Date;
  timerSetTime: Date;
  totalTimer: string;
  appConfig: IAppConfig;
  env = environment;
  logoPath = 'assets/main/app_logo.svg';
  isResetLinkLoading = signal(false);

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.localStorageService.removeItem('reset-email');
  }

  ngOnInit(): void {
    this.initForm();
    this.loadAppSettings();
    this.activatedRoute.queryParams.subscribe((data) => {
      if (data) {
        this.forgotForm.controls.username.patchValue(data.e);
      } else if (data == null) {
        this.forgotForm.controls.username.setValue('');
      }
    });
    if (this.env.isItWhiteLabel) {
      const environmentId =  this.env.env_id.includes('sandbox') ? this.env.env_id.replace('-sandbox', '') : this.env.env_id;
      this.logoPath = `assets/white_label/${environmentId}/assets/app_logo.svg`;
    } else {
      this.logoPath =
      this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
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
    if (e.isTrusted) {
      this.resendLoader = true;
    } else {
      this.resendLoader = false;
    }
    // Cancel the event
    e.preventDefault();
    // Chrome requires returnValue to be set
    e.returnValue = '';
  }

  sendEmailtoForgotPassword() {
    this.localStorageService.setItem(
      'reset-email',
      this.forgotForm.controls.username.value
    );
    this.isDisable = true;
    this.isEmailed = false;
    this.isResetLinkLoading.set(true);
    this.subscriptions.push(
      this.authService
        .forgotPassword(this.forgotForm.value)
        .pipe(
          finalize(() => this.isResetLinkLoading.set(false))
        )
        .subscribe((res: any) => {
          if (res.success) {
           
            this.alertservice.successAlert({content:res.message,timeout:3000})
            this.isEmailed = true;
            const startTimer = new Date();
            this.localStorageService.setItem('setTime', startTimer.toString());
            this.intervell(30);
          }
        })
    );
  }
  checkExistingTimer() {
    if (this.localStorageService.getItem('setTime')) {
      this.timerSetTime = new Date(
        this.localStorageService.getItem('setTime')!
      );
      const currentTime = new Date();
      const remainingSeconds =
        30 - (currentTime.getTime() - this.timerSetTime.getTime()) / 1000;
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

  countDown(val: any) {
    const arr: any[] = [];
    let n = val;
    while (n > 59) {
      arr.push(n % 60);
      n = n / 60;
    }

    arr.push(n);
    return arr;
  }

 
  getValue(event:KeyboardEvent ) {
    const inputElement= event.target as HTMLInputElement;
    const email:string = inputElement.value;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    if (emailPattern.test(email)) {
      this.isDisable = this.showTimer ;
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
