import type { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./features/auth/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recover',
    loadComponent: () => import('./features/auth/recover/recover.page').then((m) => m.RecoverPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'profile-preview',
    loadComponent: () =>
      import('./features/auth/profile-preview/profile-preview.page').then((m) => m.ProfilePreviewPage),
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./features/auth/confirmation/confirmation.page').then((m) => m.ConfirmationPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/map/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadComponent: () => import('./features/activities/list/list.page').then((m) => m.ListPage),
  },
  {
    path: 'new-activity',
    canActivate: [authGuard],
    loadComponent: () => import('./features/activities/new-activity/new-activity.page').then((m) => m.NewActivityPage),
  },
  {
    path: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/feed/feed.page').then((m) => m.FeedPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: '**',
    redirectTo: 'welcome',
  },
];
