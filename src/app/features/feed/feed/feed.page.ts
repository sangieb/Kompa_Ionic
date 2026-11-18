import type { OnInit } from '@angular/core';
import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { MessageService } from '../../../core/message/message.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { formatDateTime } from '../../../shared/utils/dates';
import { firstErrorMessage } from '../../../shared/utils/forms';
import type { MessageRule } from '../../../shared/utils/forms';
import { requiredWithContent } from '../../../shared/utils/validators';
import type { Post } from '../models/post.model';
import { PostService } from '../post.service';

export type FeedState = 'loading' | 'success' | 'error' | 'cargando' | 'exito';
export type EstadoFeed = FeedState;

const MAX_TITLE = 80;
const MAX_BODY = 500;

const FEED_ERRORS: MessageRule[] = [
  { control: 'titulo', error: 'required', message: 'Escribe un título' },
  { control: 'titulo', error: 'requerido', message: 'Escribe un título' },
  { control: 'cuerpo', error: 'required', message: 'Escribe un mensaje' },
  { control: 'cuerpo', error: 'requerido', message: 'Escribe un mensaje' },
];

@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButton,
    IonInput,
    IonTextarea,
    IonIcon,
    ReactiveFormsModule,
  ],
})
export class FeedPage implements OnInit {
  @ViewChild(IonContent) content?: IonContent;
  get contenido(): IonContent | undefined {
    return this.content;
  }

  readonly maxTitle = MAX_TITLE;
  readonly maxTitulo = MAX_TITLE;

  readonly maxBody = MAX_BODY;
  readonly maxCuerpo = MAX_BODY;

  readonly form = new FormGroup({
    titulo: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent] }),
    cuerpo: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent] }),
  });
  readonly formulario = this.form;

  readonly state = signal<FeedState>('cargando');
  readonly estado = this.state;

  readonly posts = signal<Post[]>([]);
  readonly publicaciones = this.posts;

  readonly showForm = signal(false);
  readonly mostrarFormulario = this.showForm;

  readonly publishing = signal(false);
  readonly publicando = this.publishing;

  private readonly postService = inject(PostService);
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('cargando');
    this.posts.set(await this.postService.getLocalPosts());

    try {
      this.posts.set(await firstValueFrom(this.postService.refresh()));
      this.state.set('exito');
    } catch {
      this.state.set(this.posts().length > 0 ? 'exito' : 'error');
    }
  }

  async cargar(): Promise<void> {
    return this.load();
  }

  openForm(): void {
    this.showForm.set(true);
    void this.content?.scrollToTop(300);
  }

  abrirFormulario(): void {
    this.openForm();
  }

  cancel(): void {
    this.form.reset();
    this.showForm.set(false);
  }

  cancelar(): void {
    this.cancel();
  }

  async publish(): Promise<void> {
    const error = firstErrorMessage(this.form, FEED_ERRORS);
    if (error) {
      await this.messageService.show(error);
      return;
    }

    this.publishing.set(true);
    try {
      const { titulo, cuerpo } = this.form.getRawValue();
      await this.postService.publish({
        title: titulo.trim(),
        body: cuerpo.trim(),
        author: await this.getAuthorName(),
      });
      this.posts.set(await this.postService.getLocalPosts());
      this.state.set('exito');
      this.cancel();
      await this.messageService.show('Publicación compartida');
    } finally {
      this.publishing.set(false);
    }
  }

  async publicar(): Promise<void> {
    return this.publish();
  }

  date(p: Post): string {
    const createdAt = p.createdAt ?? p.fechaCreacion;
    return createdAt != null ? formatDateTime(createdAt) : '—';
  }

  fecha(p: Post): string {
    return this.date(p);
  }

  private async getAuthorName(): Promise<string> {
    const email = await this.auth.getCurrentEmail();
    const profile = await this.profileService.getCurrentProfile();
    const profileName = profile?.name ?? profile?.nombre;
    const profileEmail = profile?.email ?? profile?.correo;
    if (profileName && profileEmail === email) return profileName;
    return email ?? 'Viajero Kompa';
  }
}
