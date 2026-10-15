import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from 'src/environments/environment';

class SentryErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (environment.production && !environment.isItDev) {
      Sentry.captureException(error.originalError || error);
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }
}

export default SentryErrorHandler;
