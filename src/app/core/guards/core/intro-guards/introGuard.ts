import { inject } from '@angular/core';
import {  CanActivateFn, Router } from '@angular/router';
import { IntroService } from '../../../../modules/intro-tour/service/intro.service';

export const IntroGuard: CanActivateFn = (): boolean => {

   /**
   * @description Injecting dependencies using inject method
   */
   const router = inject(Router);
   const introService = inject(IntroService);

  if (introService.isPageReloaded()) {
    router.navigate(['/manage/home']); // Redirect if page is reloaded
    return false; 
  }
  return true; 
};
