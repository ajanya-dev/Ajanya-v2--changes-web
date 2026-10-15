import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import SignaturePad from 'signature_pad';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf]
})
export class SignatureComponent implements AfterViewInit, OnInit {
  @ViewChild('signPad') public signPad: ElementRef;
  signaturePad: SignaturePad;
  token: string;
  tokenVerify: any = { verifying: true, verified: false };

  saving = false;
  saved = false;

  constructor(
    private _route: ActivatedRoute,
    private _outsideService: OutsideService,
    private _alert: AlertService
  ) {}

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signPad.nativeElement);
  }

  ngOnInit(): void {
    this._route.params.subscribe((param) => {
      this.token = param?.token;
      this.verifyToken();
    });
  }

  verifyToken() {
    this._outsideService
      .verifySignatureToken(this.token)
      .pipe(finalize(() => (this.tokenVerify.verifying = false)))
      .subscribe((data) => {
        if (data?.success) {
          this.tokenVerify.verified = true;
        }
      });
  }

  clearSignaturePad() {
    this.signaturePad.clear();
  }

  save(nickName: string) {
    const signature = this.signaturePad.toDataURL('image/png');
    this.saving = true;
    const body = { signature, nick_name: nickName };

    this._outsideService
      .saveSignature(this.token, body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe((data) => {
        if (data?.success) {
          this._alert.successAlert({
            content:
              'Your signature has been added. The signature will now appear on the Existing Signature section on the check design page.',
            close: false
          });

          this.clearSignaturePad();
          const data = document.getElementById('nickName') as HTMLInputElement;
          data.value = ' ';
        }
      });
  }
}
