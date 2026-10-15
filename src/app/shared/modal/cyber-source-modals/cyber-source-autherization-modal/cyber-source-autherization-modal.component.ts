import { environment } from 'src/environments/environment';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Inject,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { Subscription } from 'rxjs';
import { ICyberSourceCardAddRequestModel } from 'src/app/modules/integration/model/integration';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Modal component for cyber source authorization.
 */
@Component({
  selector: 'app-cyber-source-autherization-modal',
  templateUrl: './cyber-source-autherization-modal.component.html',
  styleUrls: ['./cyber-source-autherization-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FaIconComponent]
})
export class CyberSourceAutherizationModalComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('cyberForm') cyberForm: ElementRef;

  acceptOrigins = [
    'https://staging.api.ocw.sebipay.com',
    'https://app.onlinecheckwriter.com'
  ];
  iframeUrl: string;
  subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ICyberSourceCardAddRequestModel,
    private _dialogRef: MatDialogRef<CyberSourceAutherizationModalComponent>,
    private _cyberSourceService: CybersourceService
  ) {}

  ngOnInit(): void {
    this.getAcceptedOrigins();
    if (environment.env_id.includes('staging') || environment.isItWhiteLabel) {
      this.iframeUrl =
        'https://testsecureacceptance.cybersource.com/embedded/pay';
    } else {
      this.iframeUrl = 'https://secureacceptance.cybersource.com/embedded/pay';
    }

    window.addEventListener('message', (event) => {
      if (this.acceptOrigins.includes(event.origin)) {
        this._dialogRef.close(event.data);
      }
    });
  }

  ngAfterViewInit() {
    this.appendFormData(this.data);
  }

  /**
   * @description Method to append data to the form and submit it.
   * @param data - `this.data`.
   */
  appendFormData(data: ICyberSourceCardAddRequestModel) {
    const form = document.getElementById('submitionForm');
    for (const key in data) {
      if (key !== 'id') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.id = key;
        const keyType = data[key as keyof ICyberSourceCardAddRequestModel];
        const keyValue = keyType as string;
        input.value = keyValue;
        form?.appendChild(input);
      }
    }

    this.cyberForm.nativeElement.submit();
  }
  /**
   * @description Method to get accepted origins and set them to `this.acceptOrigins`.
   */
  getAcceptedOrigins() {
    this.subscriptions.push(
      this._cyberSourceService.getAcceptedOrigins().subscribe((res) => {
        res.forEach((e) => {
          this.acceptOrigins.push(e.origin_name);
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
