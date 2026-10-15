import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { toObservable } from '@angular/core/rxjs-interop';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PersonaVerificationV4Component } from '../components/persona-verification-v4/persona-verification-v4.component';
import { PersonaVerificationModalV5Component } from '../components/persona-verification-modal-v5/persona-verification-modal-v5.component';
import {
  IPusherResponse,
  PersonaModalMode
} from '../model/persona-kyc-kyb-pusher';
import { IKybMissingField } from '../model/persona-v4';

/**
 * Injectable service providing helper functions for Persona verification.
 * This service facilitates opening a modal for Persona KYC (Know Your Customer) or KYB (Know Your Business) verification.
 * It also provides an observable to subscribe to verification results.
 *
 * @remarks
 * This service relies on Angular Material's `MatDialog` for opening modals.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class PersonaHelperService {
  /** Reference to the MatDialog service for opening modals */
  private dialog = inject(MatDialog);

  /** Reads the persisted layout flag to detect the v4 flow from a single point */
  private localStorageService = inject(LocalStorageService);

  /** Signal for Persona KYC/KYB verification result */
  kycKybVerifivationResult = signal(<{ data: IPusherResponse } | undefined>{});

  /** Observable for Persona KYC/KYB verification result */
  kycKybVerifivationResult$ = toObservable(this.kycKybVerifivationResult);

  /**
   * Opens a modal for Persona verification.
   * @param verificationType - Type of verification ('kyc' or 'kyb')
   * @param sourceType - Optional source type for common verification
   * @param kycOnly - Whether to only perform KYC verification
   * @param reVerificationId - Optional business ID for re-verification scenarios
   * @returns An observable emitting the verification result when the modal is closed
   */
  openModalV4(
    verificationType: 'kyc' | 'kyb' | 'kyc_kyb',
    sourceType?: CVSourceType,
    kycOnly = false,
    reVerificationId?: string
  ): Observable<{ data: IPusherResponse } | undefined> {
    return this.dialog
      .open<
        PersonaVerificationV4Component,
        {
          verificationType: 'kyc' | 'kyb' | 'kyc_kyb';
          sourceType?: CVSourceType;
          kycOnly: boolean;
          reVerificationId?: string;
        },
        { data: IPusherResponse }
      >(PersonaVerificationV4Component, {
        width: '400px',
        height: '650px',
        disableClose: true,
        panelClass: 'persona-modal',
        data: {
          verificationType,
          sourceType,
          kycOnly,
          reVerificationId
        }
      })
      .afterClosed();
  }

  /**
   * Opens the V5 Persona verification experience inside a MatDialog.
   * The modal shows one panel at a time (left panel by default with the SDK
   * + step UI; "Show Preview" toggles to the right-side data preview).
   *
   * @param verificationType - 'kyc' | 'kyb' | 'kyc_kyb'
   * @param sourceType - Optional source type for common verification
   * @param kycOnly - Whether to only perform KYC verification
   * @param reVerificationId - Optional business ID for re-verification scenarios
   * @param inquiryId - Optional pre-created inquiry to resume instead of creating one
   * @param mode - Which flow opened the modal. Decides how a pre-created inquiry is
   *   resumed. Defaults to the EDD flow.
   * @param sessionToken - Optional session token supplied by the opener (enterprise)
   * @param missingFields - Optional backend-computed fields the user must still complete
   * @returns Observable of the verification result emitted when the modal closes
   */
  openModal(
    verificationType: 'kyc' | 'kyb' | 'kyc_kyb',
    sourceType?: CVSourceType,
    kycOnly = false,
    reVerificationId?: string,
    inquiryId?: string,
    mode: PersonaModalMode = 'default',
    sessionToken?: string,
    missingFields?: IKybMissingField[]
  ): Observable<{ data: IPusherResponse } | undefined> {
    // Detect the v4 flow from a single point rather than threading a flag
    // through every caller. Persisted as 0/1 at login.
    const isV4Flow =
      this.localStorageService.getItem('isV4LayoutEnabled') === 1;

    return this.dialog
      .open<
        PersonaVerificationModalV5Component,
        {
          verificationType: 'kyc' | 'kyb' | 'kyc_kyb';
          sourceType?: CVSourceType;
          kycOnly: boolean;
          reVerificationId?: string;
          inquiryId?: string;
          mode: PersonaModalMode;
          sessionToken?: string;
          missingFields?: IKybMissingField[];
        },
        { data: IPusherResponse }
      >(PersonaVerificationModalV5Component, {
        width: '400px',
        height: '690px',
        disableClose: true,
        panelClass: isV4Flow
          ? ['persona-modal', 'persona-modal-v4']
          : ['persona-modal' , 'persona-modal-v5'],
        data: {
          verificationType: 'kyc_kyb',
          sourceType,
          kycOnly,
          reVerificationId,
          inquiryId,
          mode,
          sessionToken,
          missingFields
        }
      })
      .afterClosed();
  }
}
