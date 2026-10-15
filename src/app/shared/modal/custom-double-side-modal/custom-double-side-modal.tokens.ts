import { InjectionToken } from '@angular/core';
import type { DoubleSideModalRef } from './custom-double-side-modal-ref';

export const DOUBLE_SIDE_MODAL_DATA = new InjectionToken<unknown>(
  'DOUBLE_SIDE_MODAL_DATA'
);

export const DOUBLE_SIDE_MODAL_REF = new InjectionToken<DoubleSideModalRef>(
  'DOUBLE_SIDE_MODAL_REF'
);

export const DOUBLE_SIDE_PANEL_DATA = new InjectionToken<unknown>(
  'DOUBLE_SIDE_PANEL_DATA'
);
