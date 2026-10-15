import { NgSelectModule } from '@ng-select/ng-select';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { RouterTestingModule } from '@angular/router/testing';
import { RECAPTCHA_V3_SITE_KEY, ReCaptchaV3Service } from 'ng-recaptcha';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginComponent } from './login.component';

/**
 * @description Mock the store class with the needed methods.
 */
class MockStore {
  dispatch = jest.fn();

  select = jest.fn();
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        { provide: Store, useClass: MockStore },
        {
          provide: RECAPTCHA_V3_SITE_KEY,
          useValue: 'your-recaptcha-v3-site-key'
        },
        ReCaptchaV3Service
      ],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatTooltipModule,
        NgSelectModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call submit method on login button click', () => {
    const submitSpy = jest.spyOn(component, 'submit');
    const button = fixture.debugElement.nativeElement.querySelector('button');
    button.click();
    expect(submitSpy).toHaveBeenCalled();
  });
});
