import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { PhoneInputComponent } from 'src/app/shared/components/phone-input/phone-input.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCopy,
  faHome,
  faHouseBuilding,
  faPlus,
  faTrashCan,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { SignatureComponent } from './pages/signature/signature.component';
import { RestoreAcccountComponent } from './pages/restore-acccount/restore-acccount.component';
import { EverifyComponent } from './pages/everify/everify.component';
import { EverifyDetailsComponent } from './pages/everify-details/everify-details.component';
import { PaymentTrackComponent } from './pages/payment-track/payment-track.component';
import { AttachmentFromPhoneComponent } from './pages/attachment-from-phone/attachment-from-phone.component';
import { VcnDetailsComponent } from './pages/vcn-details/vcn-details.component';
import { VcnLoginComponent } from './pages/vcn-login/vcn-login.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { PayWithZilComponent } from './pages/pay-with-zil/pay-with-zil.component';
import { VirtualCardDetailsComponent } from './pages/virtual-card-details/virtual-card-details.component';
import { CardInvoiceDocumentsFromPhoneComponent } from './card-invoice-documents-from-phone/card-invoice-documents-from-phone.component';
import { MicroDepositDocUploadComponent } from './pages/micro-deposit-doc-upload/micro-deposit-doc-upload.component';
import { UploadAttachmentComponent } from './upload-attachment/upload-attachment.component';
import { OutsidePricingPlanComponent } from './pages/outside-pricing-plan/outside-pricing-plan.component';
import { ProofOfDeliveryComponent } from './pages/proof-of-delivery/proof-of-delivery.component';
import { ExternalBankComponent } from './pages/external-bank/external-bank.component';
import { ExternalBankFormWrapperComponent } from './pages/external-bank-form-wrapper/external-bank-form-wrapper.component';
import { FeeCalculatorComponent } from './pages/fee-calculator/fee-calculator.component';
import { ExternalPayeeComponent } from './pages/external-payee/external-payee.component';
import { GiftCardDetailsComponent } from './pages/gift-card-details/gift-card-details.component';
import { GiftCardLoginComponent } from './pages/gift-card-login/gift-card-login.component';
import { VcnCardholderFormComponent } from './pages/vcn-cardholder-form/vcn-cardholder-form.component';
import { PayeeKybVerificationComponent } from './pages/payee-kyb-verification/payee-kyb-verification.component';
import { RequestReceiptComponent } from './pages/request-receipt/request-receipt.component';
import { ExternalMicroDepositComponent } from './pages/external-micro-deposit/external-micro-deposit.component';

const routes: Routes = [
  { path: 'signature/:token', component: SignatureComponent },
  {
    path: 'attachments-from-phone/:uuId',
    component: AttachmentFromPhoneComponent
  },
  { path: 'everify', component: EverifyComponent },
  { path: 'everify-details', component: EverifyDetailsComponent },
  { path: 'payment_status/:id', component: PaymentTrackComponent },
  { path: 'vcn/card/:uuId', component: VcnDetailsComponent },
  { path: 'vcn/auth/:token', component: VcnLoginComponent },
  { path: 'pay-with-zil/auth/:uuId', component: PayWithZilComponent },
  { path: 'vcn/auth2/:token', component: VcnLoginComponent },
  { path: 'vcn/virtual-card/:uuId', component: VirtualCardDetailsComponent },
  {
    path: 'verify-card-invoice',
    component: CardInvoiceDocumentsFromPhoneComponent
  },
  { path: 'bank-account-verify', component: MicroDepositDocUploadComponent },
  {
    path: 'deposit-slips/:id/verify-link',
    component: UploadAttachmentComponent
  },
  { path: 'checks/:id/verify-link', component: UploadAttachmentComponent },
  {
    path: 'pricing-plan',
    component: OutsidePricingPlanComponent
  },
  { path: 'proof-of-delivery', component: ProofOfDeliveryComponent },
  {
    path: 'external-bank-form/:id',
    component: ExternalBankComponent
  },
  {
    path: 'external-bank-form',
    component: ExternalBankFormWrapperComponent
  },
  {
    path: 'external-payee-form/:id',
    component: ExternalPayeeComponent
  },
  {
    path: 'fee-calculator',
    component: FeeCalculatorComponent
  },
  { path: 'vcn/auth2/gift-card/:token', component: GiftCardLoginComponent },
  { path: 'vcn/gift-card/:uuId', component: GiftCardDetailsComponent },
  { path: 'vcn/cardholder-form/:id', component: VcnCardholderFormComponent },
  { path: 'payee-kyb-verification/:id', component: PayeeKybVerificationComponent },
  { path: 'enterprise-onboarding/verification',component:PayeeKybVerificationComponent},
  { path: 'request-receipt/:id', component: RequestReceiptComponent },
  { 
    path: 'md-confirm', 
    component: ExternalMicroDepositComponent 
  },
  {
    path: 'zil-sign/sign/:token',
    loadComponent: () => import('../business-tools/zil-sign/pages/sign-pdf-viewer/sign-pdf-viewer.component').then(c => c.SignPdfViewerComponent)
  },
  {
    path: 'zil-sign/success',
    loadComponent: () => import('../business-tools/zil-sign/pages/sign-success/sign-success.component').then(c => c.SignSuccessComponent)
  },
  {
    path: 'v4-zil-sign/sign/:token',
    loadComponent: () => import('../v4-business-tools/v4-zil-sign/v4-pages/v4-sign-pdf-viewer/v4-sign-pdf-viewer.component').then(c => c.V4SignPdfViewerComponent)
  },
  {
    path: 'v4-zil-sign/success',
    loadComponent: () => import('../v4-business-tools/v4-zil-sign/v4-pages/v4-sign-success/v4-sign-success.component').then(c => c.V4SignSuccessComponent)
  },
  {
    path: 'document-vault/share-collect/:id',
    loadComponent: () => import('../business-tools/document-vault/components/share-collect-outside/share-collect-outside.component').then(c => c.ShareCollectOutsideComponent)
  },
  {
    path: 'document-vault/download/:id',
    loadComponent: () => import('../business-tools/document-vault/components/share-download-outside/share-download-outside.component').then(c => c.ShareDownloadOutsideComponent)
  },
  {
    path: 'upload-document',
    loadComponent: () => import('./pages/document-verification/document-verification.component').then(c => c.DocumentVerificationComponent)
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    PhoneInputComponent,

    AngularMaterialModule,
    RouterModule.forChild(routes),
    NgSelectModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule,
    SignatureComponent,
    RestoreAcccountComponent,
    EverifyComponent,
    EverifyDetailsComponent,
    PaymentTrackComponent,
    AttachmentFromPhoneComponent,
    VcnDetailsComponent,
    VcnLoginComponent,
    PayWithZilComponent,
    VirtualCardDetailsComponent,
    CardInvoiceDocumentsFromPhoneComponent,
    MicroDepositDocUploadComponent,
    ExternalBankComponent,
    ExternalBankFormWrapperComponent,
    ExternalMicroDepositComponent
  ]
})
export class OutsideModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faChevronRight,
      faChevronLeft,
      faHome,
      faCircleExclamation,
      faCircleCheck,
      faCircle,
      faHouseBuilding,
      faCopy,
      faCircleInfo,
      faTrashCan,
      faCheck
    );
  }
}
