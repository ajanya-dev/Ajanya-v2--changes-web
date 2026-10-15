import { Routes } from "@angular/router";
import { InterPaymentComponent } from "./page/inter-payment/inter-payment.component";

export const internationalPaymentRoutes: Routes = [
  {
    path: "",
    redirectTo: "index",
    pathMatch: "full"
  },
  {
    path: "index",
    component: InterPaymentComponent,
  },
  {
    path: "main/clone/:id",
    component: InterPaymentComponent,
  },
  {
    path: "new",
    component: InterPaymentComponent,
  }
];
