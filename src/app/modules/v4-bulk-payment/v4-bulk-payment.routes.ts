import { Routes } from "@angular/router";
import { importProvidersFrom } from "@angular/core";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { groupPaymentsFeature } from "../group-payments/store/groupPayments.reducer";
import { StoreEffects } from "../group-payments/store/groupPayments.effects";

export const routes: Routes = [
    {
        path: '',
        providers: [
            importProvidersFrom(
                StoreModule.forFeature(groupPaymentsFeature),
                EffectsModule.forFeature([StoreEffects])
            )
        ],
        children: [
            {path:'',redirectTo:'index',pathMatch: 'full'},
            {path:'index',
                loadComponent: () => import('./pages/v4-bulk-payment-center/v4-bulk-payment-center.component').then((c) => c.V4BulkPaymentCenterComponent)
            }
        ]
    }
];
