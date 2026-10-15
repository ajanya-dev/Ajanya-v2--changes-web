import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ILoginPayload } from 'src/app/models/user';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-regular-svg-icons';
import { environment } from 'src/environments/environment';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-new-login',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    MatTooltip,
    CommonButtonV35Component,
    FontAwesomeModule,
    WhiteLabelDirective,
    V35ControlMessageComponent
  ],
  templateUrl: './new-login.component.html',
  styleUrl: './new-login.component.scss'
})
export class NewLoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public authV3Service = inject(AuthV3Service);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  passwordHide = true;
  isRememberMe = false;
  currentPage = input<'cardProgramWalletGiftCard' | 'cardProgramReceiverRequest' | 'dd' | 'e_check'>('cardProgramWalletGiftCard');

  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  isBuckzy =
    environment.env_id === 'buckzy' || environment.env_id === 'buckzy-sandbox';

  isOlliepay = environment.env_id === 'olliepay';
  sandbox = environment.env_id === 'sandbox';
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  // Shared stats for both card-program flows
  private readonly cardProgramStatistics = [
    { value: '1M+', label: 'Active Users' },
    { value: '100B+', label: 'Transaction Processed' },
    { value: '15M+', label: 'Virtual Cards Generated' }
  ];

  // Statistics data
  statistics = {
    cardProgramWalletGiftCard: this.cardProgramStatistics,
    cardProgramReceiverRequest: this.cardProgramStatistics,
    dd: [
      { value: '$200B+', label: 'Transferred securely' },
      { value: '2M+', label: 'Businesses trust us' },
      { value: '99.9%', label: 'uptime always on' }
    ],
    e_check: [
      { value: '50M+', label: 'e-Checks delivered' },
      { value: '100B+', label: 'Payments processed' },
      { value: '80%', label: 'Savings per payment' }
    ]
  };

  // Compliance badges
  complianceBadges = [
    { name: 'AICPA SOC', image: 'assets/images/certifications/SOC1.png' },
    { name: 'ISO 9001', image: 'assets/images/certifications/ISO9001.png' },
    { name: 'ISO 27001', image: 'assets/images/certifications/ISO27001.png' },
    { name: 'ISO 22301', image: 'assets/images/certifications/ISO2200.png' },
    {
      name: 'HIPAA COMPLIANT',
      image: 'assets/images/certifications/HIPPA.png'
    },
    { name: 'AICPA SOC 2', image: 'assets/images/certifications/SOC2.png' },
    { name: 'GDPR', image: 'assets/images/certifications/GDPR.png' },
    { name: 'CCPA', image: 'assets/images/certifications/CCPA.png' },
    {
      name: '53A',
      image: 'assets/images/certifications/53A.png'
    },
    {
      name: 'PCI-DSS Certified',
      image: 'assets/images/certifications/PCIDSS.png'
    }
  ];

  ngOnInit() {
    this.initFormGroup();
    if (this.route.snapshot.queryParams?.email) {
      this.loginForm
        .get('username')
        ?.setValue(this.route.snapshot.queryParams?.email);
    }
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
    });
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

  togglePasswordVisibility() {
    this.passwordHide = !this.passwordHide;
  }

  getHeadline(page: 'cardProgramWalletGiftCard' | 'cardProgramReceiverRequest' | 'dd' | 'e_check') {
    switch (page) {
      case 'cardProgramWalletGiftCard':
      case 'cardProgramReceiverRequest':
        return 'The Future of Smart Payments';
      case 'dd':
        return `Move Money <br> the Smart Way`;
      case 'e_check':
        return `Send Checks <br> the Smart Way`;
      default:
        return 'The Future of Smart Payments';
    }
  }

  getSubheadline(page: 'cardProgramWalletGiftCard' | 'cardProgramReceiverRequest' | 'dd' | 'e_check') {
    switch (page) {
      case 'cardProgramWalletGiftCard':
      case 'cardProgramReceiverRequest':
        return 'Empower your business with instant Visa cards. Easily spend, track, and control expenses.';
      case 'dd':
        return 'Send and receive ACH transfers effortlessly with no hidden fees. <br> Stay in control with secure, trackable, and cost-effective payments.';
      case 'e_check':
        return 'Email checks instantly with no printing, postage, or delays. <br> Enjoy secure, paper-free payments with full tracking and control.';
      default:
        return 'Empower your business with instant Visa cards. Easily spend, track, and control expenses.';
    }
  }

  ngOnDestroy() {
    this.authV3Service.unSubscribeLoginSubscriptions();
    this.authV3Service.unSubscibeCommonSubscription();
  }
}
