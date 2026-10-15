import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { finalize } from 'rxjs/operators';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-everify',
  templateUrl: './everify.component.html',
  styleUrls: ['./everify.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, ReactiveFormsModule, ControlMessageComponent]
})
export class EverifyComponent implements OnInit {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  bottomSection = false;
  verifyForm: UntypedFormGroup;
  inValid = false;
  checkID: string;
  loading = false;
  appConfig: IAppConfig;
  checkId: string;
  spinnerloading = false;
  learnMore = true;

  constructor(
    private fb: UntypedFormBuilder,
    private _outsideService: OutsideService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.getCheckId();
    this.openWindow();
  }

  getCheckId() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.checkId = params.id;
    });
  }

  openWindow() {
    if (this.checkId != null) {
      this.spinnerloading = true;
      this._outsideService
        .everifyCheck(this.checkId)
        .pipe(finalize(() => (this.spinnerloading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.router.navigate([`/outside/everify-details`], {
              queryParams: res.data
            });
          }
        });
    }
  }

  moreDetails() {
    this.bottomSection = true;
    this.learnMore = false;
  }

  initFormGroup(): void {
    this.verifyForm = this.fb.group({
      checkId: new UntypedFormControl('', Validators.required)
    });
  }

  submit() {
    this.verifyForm.markAllAsTouched();

    if (this.verifyForm.invalid) {
      return;
    }

    this.loading = true;
    this.checkID = this.verifyForm.controls.checkId.value;
    this._outsideService
      .everifyCheck(this.checkID)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((res) => {
        if (res.success) {
          this.router.navigate([`/outside/everify-details`], {
            queryParams: res.data
          });
        }
      });
  }

  onGoToWebsite(): void {
    window.open(StaticWhiteLabelConditions.website);
  }
}
