import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ILoginPayload } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { ScriptService } from 'src/app/core/services/script.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { Utils } from 'src/app/data/utils';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { IdleService } from 'src/app/core/services/idle.service';
import { Subscription } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  NgOptimizedImage,
  NgIf,
  NgStyle,
  NgFor,
  NgClass
} from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { VersionCheckerService } from 'src/app/shared/service/version-service/version.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { faPhone, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { NewLoginComponent } from '../new-login/new-login.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    RouterLink,
    NgStyle,
    NgFor,
    NgClass,
    MatTooltip,
    NgSelectModule,
    WhiteLabelDirective,
    FontAwesomeModule,
    NewLoginComponent
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private scriptService = inject(ScriptService);
  private themeService = inject(ThemeService);
  private localStorageService = inject(LocalStorageService);
  private layoutservice = inject(LayoutService);
  public authV3Service = inject(AuthV3Service);
  private idleService = inject(IdleService);
  private versionCheckerService = inject(VersionCheckerService);
  private route = inject(ActivatedRoute);

  environment = environment;
  loginForm: FormGroup;
  passwordHide = true;
  isRememberMe = false;
  socialLoginRootUrl: string;
  isItDev = false;
  isReadOnly = false;
  ROOT_URL = environment.rootUrl;
  isBuckzy =
    environment.env_id === 'buckzy' || environment.env_id === 'buckzy-sandbox';
    
  isOlliepay = environment.env_id === 'olliepay';
  sandbox = environment.env_id === 'sandbox';
  isArcharina = environment.env_id === 'archarina' || environment.env_id === 'archarina-sandbox';
    
  subscriptions: Subscription[] = [];
  showNewUiSignal = signal(false);
  initiatedFrom = signal<string|undefined>('');
  initiatedFromPages = ['cardProgramWalletGiftCard', 'cardProgramReceiverRequest', 'e_check', 'dd'];
  showExistingAccountMessage = signal(false);

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  supportNo = StaticWhiteLabelConditions.customerSupportNo;
  faPhone = faPhone;
  faCircleInfo = faCircleInfo;

  async ngOnInit() {
    this.checkExistingInvitedUser();
    this.showNewUi();
    this.initFormGroup();
    await this.versionCheckerService.clearCache();
    this.versionCheckerService.checkForUpdate();
    this.themeService.disableTheme();
    this.localStorageService.setItem('userId', '0');
    Utils.showRecaptcheBadge();
    this.authV3Service.loadAppSettings();
    this.authV3Service.loadSwiperData();
    this.authV3Service.onSocialLogin();
    this.authV3Service.getReturnUrl();
    this.authV3Service.isSetNewPassword();
    this.scriptService.addZohoSrcipt();
    this.socialLoginRootUrl = `${this.ROOT_URL.split('.com')[0]}.com`;
    this.isItDev = !!environment.isItDev;
    this.authV3Service.getErrorAlert();
    this.subscriptions.push(
      this.idleService.isIdleForTimeInterval$.subscribe((isIdle) => {
        if (isIdle && !this.localStorageService.appToken) {
          this.authV3Service.getBrowserAuthToken();
        }
      })
    );
    this.idleService.onInteraction();
    this.authV3Service.getBrowserAuthToken();
    this.layoutservice.enableUseMobileAppPage();
  }

  /**
   * @description Show new login UI if the user is logged in from a card program wallet gift card or the login UI is set to new
   */
  showNewUi(): void {
    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if(this.initiatedFromPages.includes(params?.initiated_from)) {
          this.showNewUiSignal.set(true);
          this.initiatedFrom.set(params?.initiated_from);
          // Set the showNewLoginUi flag to true
          this.localStorageService.setItem('showNewLoginUi', this.initiatedFrom());
        }else{
          // Set the showNewLoginUi flag to false
          this.showNewUiSignal.set(false);
          this.initiatedFrom.set(undefined);
          this.localStorageService.removeItem('showNewLoginUi');
        }
      })
    );    
  }

  enterKey(event: KeyboardEvent, number: number) {
    const password = document.getElementById('password');
    const targetValue = event.target as unknown as HTMLInputElement;
    if (event.keyCode === 13 && targetValue.value) {
      if (number === 1) {
        password?.focus();
      } else {
        password?.blur();
        this.submit();
      }
    }
  }

  onchange(evnt: Event) {
    const event = evnt.target as HTMLInputElement;
    const len = String(event.value);
    if (len.length > 0) {
      this.authV3Service.inValid = false;
      this.authV3Service.warningMsg = '';
    }
  }

  initFormGroup(): void {
    this.loginForm = this.fb.group({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3)
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ])
      // remember_me: new FormControl('false')
    });    

    if(this.route.snapshot.queryParams?.email) {
      this.loginForm.get('username')?.setValue(this.route.snapshot.queryParams?.email);
    }

    if (this.route.snapshot.queryParams?.existingAccount === 'true') {
      this.showExistingAccountMessage.set(true);
    }

  }

  createLoginBody(): ILoginPayload {
    return {
      username: this.getFormValue('username'),
      password: this.getFormValue('password')
    };
  }

  submit() {
    this.authV3Service.submit(this.createLoginBody(), this.loginForm);
  }

  getFormValue(name: string) {
    return this.loginForm.get(name)?.value;
  }

  /**
 * Checks if the current user was invited as an existing user (not via Compass environment)
 * and sets the form to read-only mode accordingly.
 */
private checkExistingInvitedUser(): void {
  const { invitation, type } = this.route.snapshot.queryParams;

  const isExistingInvitedUser =
    !!invitation && type === 'existing' && environment.env_id !== 'compass' && environment.env_id !== 'csnhc';

  this.isReadOnly = isExistingInvitedUser;
}

  ngOnDestroy() {
    Utils.showRecaptcheBadge(false);
    this.authV3Service.unSubscribeLoginSubscriptions();
    this.authV3Service.unSubscibeCommonSubscription();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
