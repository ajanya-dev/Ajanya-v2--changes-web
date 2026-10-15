import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faStore } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { normalizeShopifyDomain } from 'src/app/shared/utils/shopify-domain.util';

@Component({
  selector: 'app-shopify-domain-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    MatDialogClose
  ],
  templateUrl: './shopify-domain-modal.component.html',
  styleUrl: './shopify-domain-modal.component.scss'
})
export class ShopifyDomainModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ShopifyDomainModalComponent>);

  faXmark = faXmark;
  faStore = faStore;

  shopForm: FormGroup;

  ngOnInit(): void {
    this.shopForm = this.fb.group({
      shop: ['', [Validators.required]]
    });
  }

  /**
   * @description Normalizes the typed store domain to a bare
   * `<store>.myshopify.com` host before it reaches the API.
   * @param value - Raw value from the form
   */
  normalizeDomain(value: string): string {
    return normalizeShopifyDomain(value);
  }

  onConnect(): void {
    this.shopForm.markAllAsTouched();
    if (this.shopForm.invalid) return;
    const shop = this.normalizeDomain(this.shopForm.value.shop);
    if (!shop) return;
    this.dialogRef.close(shop);
  }
}
