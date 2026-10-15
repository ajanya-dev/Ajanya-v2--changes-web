import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { Utils } from 'src/app/data/utils';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPhone } from '@fortawesome/pro-solid-svg-icons';
import { currentPlans } from '../currentsubplans';
import { WhatsNewService } from '../../../../shared/service/whats-new/whats-new.service';
import { AuthV3Service } from '../../services/auth-v3.service';
import { IPlan } from '../../model/login';
import { IRegisterResponse } from '../register/model/register';
import { WhiteLabelPipe } from '../../../../pipes/white-label.pipe';

@Component({
  selector: 'app-signup2',
  templateUrl: './signup2.component.html',
  styleUrls: ['./signup2.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgOptimizedImage,
    WhiteLabelPipe
  ]
})
export class Signup2Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private authDataService = inject(AuthDataService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private gettingStartedService = inject(GettingStartedService);
  private whatsNewService = inject(WhatsNewService);
  private recaptchaService = inject(RecaptchaService);
  public authV3Service = inject(AuthV3Service);

  subscriptions: Subscription[] = [];
  submitting = false;
  environment = environment;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  userForm: FormGroup;
  showValidBox = false;
  checkingEmail = false;
  emailError = '';
  confirmPassowrdError = '';
  passwordError = '';
  chosenPlan: IPlan;
  currentPlans: IPlan[] = currentPlans;
  recaptchaToken: string | undefined;
  faPhone = faPhone;

  ngOnInit(): void {
    Utils.showRecaptcheBadge();
    const planCode = this.route.snapshot.params?.plancode;
    this.currentPlans.forEach((plan) => {
      if (plan.planCode === planCode) {
        this.chosenPlan = plan;
      }
    });

    if (!this.chosenPlan) {
      this.chosenPlan = this.currentPlans[1];
    }

    this.initForm();
  }

  initForm() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, ValidationService.emailValidator]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100)
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100)
        ]
      ],
      termsAndCondition: [false]
    });

    this.valueChangesAction();
  }

  valueChangesAction() {
    this.userForm.controls.email.valueChanges
      .pipe(debounceTime(600))
      .subscribe((value) => {
        if (!this.userForm.controls.email.errors && this.userForm.touched) {
          this.emailError = '';
          this.checkMailExists(value);
        } else if (this.userForm.controls.email.errors?.required) {
          this.emailError = 'Email is required';
        } else if (this.userForm.controls.email.errors?.invalidEmailAddress) {
          this.emailError = 'Invalid Email address';
        }
      });

    this.userForm.controls.password.valueChanges.subscribe(() => {
      const { errors } = this.userForm.controls.password;
      if (errors) {
        if (errors.required) {
          this.passwordError = 'Password is required';
        } else if (errors.minlength) {
          this.passwordError = 'Password must be of minimum lenght 8';
        }
      } else {
        this.passwordError = '';
      }
    });

    this.userForm.controls.confirmPassword.valueChanges.subscribe((value) => {
      if (value !== this.userForm.controls.password.value) {
        this.confirmPassowrdError = 'Password does not match';
      } else {
        this.confirmPassowrdError = '';
      }
    });
  }

  passwordFocus() {
    this.showValidBox = !this.showValidBox;
  }

  isPasswordValid() {
    const { password } = this.userForm.value;

    const letter = document.getElementById('letter');
    const capital = document.getElementById('capital');
    const number = document.getElementById('number');
    const length = document.getElementById('length');

    const validateClass = (element: HTMLElement, isValid: boolean) => {
      if (isValid) {
        element.classList.remove('invalid');
        element.classList.add('valid');
      } else {
        element.classList.add('invalid');
        element.classList.remove('valid');
      }
    };

    // Validate lowercase letters
    const lowerCaseLetters = /[a-z]/g;
    validateClass(letter as HTMLElement, !!password.match(lowerCaseLetters));

    // Validate capital letters
    const upperCaseLetters = /[A-Z]/g;
    validateClass(capital as HTMLElement, !!password.match(upperCaseLetters));

    // Validate numbers
    const numbers = /[0-9]/g;
    validateClass(number as HTMLElement, !!password.match(numbers));

    // validate length
    validateClass(length as HTMLElement, password?.length >= 8);

    if (
      password.match(lowerCaseLetters) &&
      password.match(upperCaseLetters) &&
      password.match(numbers) &&
      password.length >= 8
    ) {
      // this.myVal = false;
    }
  }

  checkMailExists(username: string) {
    this.checkingEmail = true;
    this.authService
      .checkemail({ username })
      .pipe(
        finalize(() => {
          this.checkingEmail = false;
        })
      )
      .subscribe(
        (res) => {
          if (res?.success) {
            this.emailError = '';
          }
        },
        (err) => (this.emailError = err.error.errorMsg)
      );
  }

  submit() {
    const data = this.userForm.value;
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid) {
      return;
    }
    if (data.password !== data.confirmPassword) {
      this.alertService.warningAlert({
        content:
          'Please choose a stronger password. Try mixing lower case, upper case and numbers.'
      });
      return;
    }
    if (!data.termsAndCondition) {
      this.alertService.infoAlert({
        content: 'Please accept terms and conditions'
      });
      return;
    }
    this.submitting = true;
    const signupRequest = () => {
      const body = this.createregisterBody(data);
      this.subscriptions.push(
        this.authService
          .register(body)
          .pipe(
            finalize(() => {
              this.submitting = false;
            })
          )
          .subscribe((res) => {
            if (res) {
              this.onSignupSuccess(res);
            }
          })
      );
    };

    this.recaptchaService.recaptchaToken.subscribe(
      (res: string | undefined) => {
        this.recaptchaToken = res;
        signupRequest();
      }
    );
  }

  async onSignupSuccess(res: IRegisterResponse) {
    try {
      await this.authDataService.onSignupSuccess(res);
    } catch {
      // Intentionally ignore tracking failures so redirect remains unchanged.
    }
    if (this.chosenPlan) {
      this.router.navigate(['/manage/user-profile/verify-email-phone'], {
        queryParams: { plancode: this.chosenPlan.planCode }
      });
    } else {
      this.gettingStartedService.resetGettingStartedData();
      this.whatsNewService.routeUserBasedOnVideoFlag(
        '/manage/verification/index',
        ''
      );
    }
  }

  getAllCookies() {
    const allCookies: { [key: string]: string } = {};
    document.cookie.split(';').forEach((c) => {
      allCookies[c.split('=')[0]] = c.split('=')[1];
    });
    return allCookies;
  }

  createregisterBody(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    extraData: { [key: string]: string };
  }) {
    return {
      name: data.name,
      username: data.email,
      password: data.password,
      password_confirmation: data.confirmPassword,
      extraData: this.getAllCookies(),
      recaptcha: this.recaptchaToken
    };
  }

  customerImages1 = [
    'customer_review1.png',
    'customer_review2.png',
    'customer_review3.png',
    'customer_review4.png'
  ];

  ngOnDestroy() {
    this.subscriptions.forEach((e) => e.unsubscribe());
    Utils.showRecaptcheBadge(false);
  }
}
