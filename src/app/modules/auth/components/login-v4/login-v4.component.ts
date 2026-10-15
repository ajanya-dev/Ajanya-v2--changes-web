import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  LucideAngularModule,
  CreditCard,
  Globe,
  FileText,
  Shield,
  Eye,
  EyeOff,
  Phone,
  ChevronDown,
  CircleAlert,
  Info
} from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { ILoginPayload } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { ScriptService } from 'src/app/core/services/script.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { IdleService } from 'src/app/core/services/idle.service';
import { VersionCheckerService } from 'src/app/shared/service/version-service/version.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { ChangeBaseUrlModalV4Component } from 'src/app/shared/modal/change-base-url(staging)/change-base-url-modal-v4/change-base-url-modal-v4.component';
import { Utils } from 'src/app/data/utils';

@Component({
  selector: 'app-login-v4',
  templateUrl: './login-v4.component.html',
  styleUrls: ['./login-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    NgOptimizedImage,
    LucideAngularModule,
    MatTooltip,
    WhiteLabelDirective,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class LoginV4Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private scriptService = inject(ScriptService);
  private themeService = inject(ThemeService);
  private localStorageService = inject(LocalStorageService);
  private layoutService = inject(LayoutService);
  public authV3Service = inject(AuthV3Service);
  private idleService = inject(IdleService);
  private route = inject(ActivatedRoute);
  private versionCheckerService = inject(VersionCheckerService);
  private dialog = inject(MatDialog);

  readonly CreditCardIcon = CreditCard;
  readonly GlobeIcon = Globe;
  readonly FileTextIcon = FileText;
  readonly ShieldIcon = Shield;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly PhoneIcon = Phone;
  readonly ChevronDownIcon = ChevronDown;
  readonly CircleAlertIcon = CircleAlert;
  readonly InfoIcon = Info;
  readonly securityBadges = ['SOC 2 Compliant', 'PCI DSS', '256-bit Encryption'];
  readonly features = [
    { icon: CreditCard, label: 'Send & receive payments instantly' },
    { icon: Globe,      label: 'International wire transfers' },
    { icon: FileText,   label: 'Invoice management & tracking' },
    { icon: Shield,     label: 'Bank-level security' },
  ];

  loginForm: FormGroup;
  passwordHide = true;
  isRememberMe = false;
  isReadOnly = false;
  isItDev = !!environment.isItDev;
  showExistingAccountMessage = signal(false);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isZilMoneyLogoVisible = StaticWhiteLabelConditions.zilMoneyLogoVisible;

  private subscriptions: Subscription[] = [];

  async ngOnInit() {
    this.checkExistingInvitedUser();
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
    this.layoutService.enableUseMobileAppPage();
  }

  private checkExistingInvitedUser(): void {
    const { invitation, type } = this.route.snapshot.queryParams;
    this.isReadOnly = !!invitation
      && type === 'existing'
      && environment.env_id !== 'compass'
      && environment.env_id !== 'csnhc';
  }

  initFormGroup(): void {
    this.loginForm = this.fb.group({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ])
    });

    if (this.route.snapshot.queryParams?.email) {
      this.loginForm.get('username')?.setValue(this.route.snapshot.queryParams.email);
    }

    if (this.route.snapshot.queryParams?.existingAccount === 'true') {
      this.showExistingAccountMessage.set(true);
    }
  }

  onchange(): void {
    this.authV3Service.inValid = false;
    this.authV3Service.warningMsg = '';
  }

  enterKey(event: KeyboardEvent, field: number): void {
    const target = event.target as HTMLInputElement;
    if (event.key === 'Enter' && target.value) {
      if (field === 1) {
        document.getElementById('password-field-v4')?.focus();
      } else {
        this.submit();
      }
    }
  }

  openChangeRootUrl(): void {
    this.dialog.open(ChangeBaseUrlModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded'
    });
  }

  submit(): void {
    const payload: ILoginPayload = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value
    };
    this.authV3Service.submit(payload, this.loginForm);
  }

  ngOnDestroy(): void {
    Utils.showRecaptcheBadge(false);
    this.authV3Service.unSubscribeLoginSubscriptions();
    this.authV3Service.unSubscibeCommonSubscription();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
