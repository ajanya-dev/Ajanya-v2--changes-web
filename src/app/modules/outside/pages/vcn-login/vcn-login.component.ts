import { finalize } from 'rxjs/operators';
import {
  UntypedFormGroup,
  Validators,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgStyle, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-vcn-login',
  templateUrl: './vcn-login.component.html',
  styleUrls: ['./vcn-login.component.scss'],
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatTooltip,
    NgClass
  ]
})
export class VcnLoginComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  loginForm: UntypedFormGroup;
  userEmail: string;
  userKey: string;
  warningMsg: string | undefined;
  loading = false;
  isVirtualCard = false;
  logo_if_virtualCard =
    'https://c.onlinecheckwriter.com/public/svg/OCW-powered-by-ZM-2.svg';

  constructor(
    private _fb: UntypedFormBuilder,
    private _router: Router,
    private _route: ActivatedRoute,
    private _outsideService: OutsideService,
    private _localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadFormChangeEvent();
    this.userEmail = this._route.snapshot.queryParams?.email;
    this.userKey = this._route.snapshot.params?.token;
    this.loginForm.patchValue({ email: this.userEmail });
    this.checkCardType();
  }

  checkCardType(): void {
    if (this._router?.url?.includes('auth2')) {
      this.isVirtualCard = true;
    } else {
      this.isVirtualCard = false;
    }
  }

  initForm() {
    this.loginForm = this._fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  loadFormChangeEvent(): void {
    this.loginForm.valueChanges.subscribe((r) => {
      if (r) {
        this.warningMsg = undefined;
      }
    });
  }

  submit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      if (!this.loginForm.controls.email.value) {
        this.warningMsg = 'Email is required';
      } else if (!this.loginForm.controls.password.value) {
        this.warningMsg = 'Password is required';
      }
      return;
    }

    this.loading = true;
    if (this._router?.url?.includes('auth2')) {
      this.virtualCardLogin();
    } else {
      this.vcnCardLogin();
    }
  }

  vcnCardLogin(): void {
    const data = {
      user: { ...this.loginForm.value },
      key: this.userKey
    };
    this.subscriptions.push(
      this._outsideService
        .cardUserLoginUsingKey(data)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          (res) => {
            if (res.success) {
              this._localStorageService.setItem('card-token', res.token);
              this._router.navigateByUrl(`/outside/vcn/card/${res.card_id}`);
            }
          },
          (err) => {
            this.submitErr(err);
          }
        )
    );
  }

  virtualCardLogin(): void {
    const data = {
      user: { ...this.loginForm.value },
      key: this.userKey
    };
    this.subscriptions.push(
      this._outsideService
        ?.virtualCardLogin(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              if (res.success) {
                this._localStorageService.setItem('card-token', res.token);
                this._router.navigateByUrl(
                  `/outside/vcn/virtual-card/${res.card_id}`
                );
              }
            }
          },
          (err) => {
            this.submitErr(err);
          }
        )
    );
  }

  submitErr(err: any): void {
    this.loginForm.patchValue({ password: '' });
    if (err?.error?.errorCode) {
      this.warningMsg = 'Invalid Credentials';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
