import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { ReCaptchaV3Service } from 'ng-recaptcha';

/**
 * Service for retrieving ReCaptcha tokens asynchronously.
 * @class - Service Class for Recaptcha.
 */
@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  /**
   * @param recaptchaV3Service The ReCaptchaV3Service dependency.
   */
  constructor(private recaptchaV3Service: ReCaptchaV3Service) {}

  /**
   * Retrieves the ReCaptcha token asynchronously.
   * @returns An Observable that emits the ReCaptcha token or undefined.
   */
  get recaptchaToken(): Observable<string | undefined> {
    return new Observable((ob) => {
      if (!environment?.recaptcha?.siteKey) {
        ob.next(undefined);
        ob.complete();
        return;
      }
      this.recaptchaV3Service.execute('importantAction').subscribe(
        (token: string) => {
          ob.next(token);
          ob.complete();
        },
        (_err: any) => {
          ob.error(_err);
        }
      );
    });
  }
}
