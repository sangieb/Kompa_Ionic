import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar',
    loadComponent: () => import('./pages/recuperar/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'perfil-preview',
    loadComponent: () => import('./pages/perfil-preview/perfil-preview.page').then((m) => m.PerfilPreviewPage),
  },
  {
    path: 'confirmacion',
    loadComponent: () => import('./pages/confirmacion/confirmacion.page').then((m) => m.ConfirmacionPage),
  },
  {
    path: 'lista',
    loadComponent: () => import('./pages/lista/lista.page').then((m) => m.ListaPage),
  },
  {
    path: 'feed',
    loadComponent: () => import('./pages/feed/feed.page').then((m) => m.FeedPage),
  },
  {
    path: 'nueva-actividad',
    loadComponent: () => import('./pages/nueva-actividad/nueva-actividad.page').then((m) => m.NuevaActividadPage),
  },
];
