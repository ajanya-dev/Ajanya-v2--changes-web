/* eslint-disable no-param-reassign */
import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-gift-card-login',
  standalone: true,
  imports: [
    NgOptimizedImage,
    CommonButtonV35Component
  ],
  templateUrl: './gift-card-login.component.html',
  styleUrl: './gift-card-login.component.scss'
})
export class GiftCardLoginComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);
  private outsideService = inject(OutsideService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  
  logoPath = 'assets/main/app_logo.svg';
  isLogin = signal(false);
  userKey = signal('');
  isInvalid = signal(false);
  otp = ['', '', '', ''];
  destroy$ = new Subject();

  ngOnInit(): void {
    this.userKey.set(this.activatedRoute.snapshot.params?.token);
  }

  onDigitInput(index: number, event: Event) {
    const {value} = event.target as HTMLInputElement;
    
    // Only allow digits
    if (!/^\d*$/.test(value)) {
      (event.target as HTMLInputElement).value = '';
      this.otp[index] = '';
      return;
    }
    
    // Clear any existing value and only take the last character if multiple digits are entered
    if (value.length >= 1) {
      (event.target as HTMLInputElement).value = value.slice(-1);
      this.otp[index] = value.slice(-1);
    } else {
      this.otp[index] = '';
    }
    
    // Auto-focus next input
    if (value && index < 3) {
      const inputs = this.otpInputs.toArray();
      setTimeout(() => {
        inputs[index + 1].nativeElement.focus();
      }, 10);
    }
    
    this.isInvalid.set(false);
  }
  
  onKeyDown(index: number, event: KeyboardEvent) {
    // Handle backspace to move to previous input
    if (event.key === 'Backspace' && index > 0 && !this.otp[index]) {
      const inputs = this.otpInputs.toArray();
      setTimeout(() => {
        inputs[index - 1].nativeElement.focus();
      }, 10);
    }
  }
  
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    if (!event.clipboardData) return;
    
    const pastedData = event.clipboardData.getData('text');
    const digits = pastedData.match(/\d/g);
    
    if (!digits) return;
    
    const inputs = this.otpInputs.toArray();
    
    // Fill in as many inputs as we have digits (up to 4)
    digits.slice(0, 4).forEach((digit, index) => {
      this.otp[index] = digit;
      inputs[index].nativeElement.value = digit;
      
      // Focus the next empty field or the last field if all filled
      if (index < 3 && digits.length > index + 1) {
        inputs[index + 1].nativeElement.focus();
      } else if (index < 3) {
        inputs[index + 1].nativeElement.focus();
      }
    });
    
    this.isInvalid.set(false);
  }
  
  onSubmit() {
    if (this.otp.some(digit => !digit)) {
      this.isInvalid.set(true);
      return;
    }
    
    const otpValue = this.otp.join('');
    
    const payload = {
      password: otpValue,
      key: this.userKey()
    };
    
    this.isLogin.set(true);
    this.outsideService
      .giftCardLogin(payload)
      .pipe(
        finalize(() => this.isLogin.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.localStorageService.setItem('card-token', res.token);
            this.localStorageService.setItem('gift-card', this.userKey());
            this.router.navigateByUrl(`/outside/vcn/gift-card/${res.card_id}`);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}