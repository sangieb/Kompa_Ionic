import type { Routes } from '@angular/router';

import { sesionGuard } from './core/auth/sesion.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () => import('./features/autenticacion/inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/autenticacion/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar',
    loadComponent: () => import('./features/autenticacion/recuperar/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/autenticacion/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'perfil-preview',
    loadComponent: () =>
      import('./features/autenticacion/perfil-preview/perfil-preview.page').then((m) => m.PerfilPreviewPage),
  },
  {
    path: 'confirmacion',
    loadComponent: () =>
      import('./features/autenticacion/confirmacion/confirmacion.page').then((m) => m.ConfirmacionPage),
  },
  {
    path: 'home',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/mapa/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'lista',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/actividades/lista/lista.page').then((m) => m.ListaPage),
  },
  {
    path: 'nueva-actividad',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/actividades/nueva-actividad/nueva-actividad.page').then((m) => m.NuevaActividadPage),
  },
  {
    path: 'feed',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/feed/feed/feed.page').then((m) => m.FeedPage),
  },
  {
    path: 'perfil',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/perfil/perfil/perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
