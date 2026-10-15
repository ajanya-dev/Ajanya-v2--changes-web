import { Routes } from "@angular/router";



export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/sign-doc-list/sign-doc-list.component').then(c => c.SignDocListComponent)
    },
    {
        path: 'sign-doc-view/:id',
        loadComponent: () => import('./pages/sign-doc-view/sign-doc-view.component').then(c => c.SignDocViewComponent)
    },
    {
        path: 'sign-doc-list',
        loadComponent: () => import('./pages/sign-doc-list/sign-doc-list.component').then(c => c.SignDocListComponent)
    },
    {
        path: 'request-sign',
        loadComponent: () => import('./modal/request-sign-modal/request-sign-modal.component').then(c => c.RequestSignModalComponent)
    }
];