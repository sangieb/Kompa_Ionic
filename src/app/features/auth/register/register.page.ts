import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import type { ValidatorFn } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, camera, shieldCheckmarkOutline } from 'ionicons/icons';

import { MIN_PASSWORD_LEN } from '../../../core/auth/auth.service';
import { hashPassword } from '../../../core/auth/password-hash';
import { MessageService } from '../../../core/message/message.service';
import { PermissionsService } from '../../../core/permissions/permissions.service';
import { PhotoOptionsService } from '../../../core/photo/photo-options.service';
import { PhotoService } from '../../../core/photo/photo.service';
import type { Catalogs } from '../../../data/seed-catalogs';
import { CONNECT_OPTIONS, GENDERS } from '../../../data/seed-catalogs';
import { TermsModalComponent } from '../../../shared/components/terms-modal/terms-modal.component';
import { isoToDate, isoYearsAgo } from '../../../shared/utils/dates';
import { firstErrorMessage } from '../../../shared/utils/forms';
import type { MessageRule } from '../../../shared/utils/forms';
import { compressPhoto } from '../../../shared/utils/photo';
import {
  legalAge,
  minLength,
  requiredAccepted,
  requiredWithContent,
  validEmail,
} from '../../../shared/utils/validators';
import { RegistrationDraftService } from '../registration-draft.service';

import { CatalogService } from './catalog.service';

const MAX_INTERESTS = 5;

const REGISTRATION_ERRORS: MessageRule[] = [
  { control: 'nombre', error: 'required', message: 'Ingresa tu nombre' },
  { control: 'nombre', error: 'requerido', message: 'Ingresa tu nombre' },
  { control: 'nombre', error: 'minLength', message: 'El nombre debe tener al menos 2 caracteres' },
  { control: 'nombre', error: 'longitudMinima', message: 'El nombre debe tener al menos 2 caracteres' },
  { control: 'correo', error: 'required', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'requerido', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'email', message: 'Ingresa un correo electrónico válido' },
  { control: 'correo', error: 'correo', message: 'Ingresa un correo electrónico válido' },
  {
    control: 'password',
    error: 'minlength',
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres`,
  },
  { control: 'fechaNacimiento', error: 'required', message: 'Selecciona tu fecha de nacimiento' },
  { control: 'fechaNacimiento', error: 'requerido', message: 'Selecciona tu fecha de nacimiento' },
  { control: 'fechaNacimiento', error: 'legalAge', message: 'Debes ser mayor de edad para registrarte' },
  { control: 'fechaNacimiento', error: 'mayorDeEdad', message: 'Debes ser mayor de edad para registrarte' },
  { control: 'nacionalidad', error: 'required', message: 'Selecciona tu nacionalidad' },
  { control: 'nacionalidad', error: 'requerido', message: 'Selecciona tu nacionalidad' },
  { control: 'idioma', error: 'required', message: 'Selecciona al menos un idioma' },
  { control: 'idioma', error: 'requerido', message: 'Selecciona al menos un idioma' },
  { control: '', error: 'connectRequired', message: 'Selecciona con quién quieres conectar' },
  { control: '', error: 'conectarRequerido', message: 'Selecciona con quién quieres conectar' },
  { control: '', error: 'interestsRequired', message: 'Elige al menos un interés' },
  { control: '', error: 'interesesRequeridos', message: 'Elige al menos un interés' },
  { control: 'aceptaTerminos', error: 'required', message: 'Debes aceptar los Términos y Condiciones' },
  { control: 'aceptaTerminos', error: 'requerido', message: 'Debes aceptar los Términos y Condiciones' },
  { control: 'aceptaDatos', error: 'required', message: 'Debes autorizar el tratamiento de tus datos personales' },
  { control: 'aceptaDatos', error: 'requerido', message: 'Debes autorizar el tratamiento de tus datos personales' },
];

const connectRequired: ValidatorFn = (control) => {
  const selected = control.get('conectar')?.value;
  return Array.isArray(selected) && selected.length > 0 ? null : { connectRequired: true, conectarRequerido: true };
};

const interestsRequired: ValidatorFn = (control) => {
  const selected = control.get('intereses')?.value;
  return Array.isArray(selected) && selected.length > 0 ? null : { interestsRequired: true, interesesRequeridos: true };
};

@Component({
  selector: 'app-register, app-registro',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonInput,
    IonInputPasswordToggle,
    IonSelect,
    IonSelectOption,
    IonRadioGroup,
    IonRadio,
    IonChip,
    IonCheckbox,
    IonButton,
    IonIcon,
    ReactiveFormsModule,
    TermsModalComponent,
  ],
})
export class RegisterPage implements OnInit {
  readonly maxInterests = MAX_INTERESTS;
  readonly maxIntereses = MAX_INTERESTS;

  readonly genders = GENDERS;
  readonly generos = GENDERS;

  readonly connectOptions = CONNECT_OPTIONS;
  readonly opcionesConectar = CONNECT_OPTIONS;

  readonly maxDate = isoYearsAgo(18);
  readonly fechaMaxima = this.maxDate;

  readonly form = new FormGroup(
    {
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [requiredWithContent, minLength(2)],
      }),
      correo: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent, validEmail] }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.minLength(MIN_PASSWORD_LEN)],
      }),
      fechaNacimiento: new FormControl<string>('', {
        nonNullable: true,
        validators: [requiredWithContent, legalAge],
      }),
      nacionalidad: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent] }),
      idioma: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent] }),
      genero: new FormControl<string>('', { nonNullable: true }),
      conectar: new FormControl<string[]>([], { nonNullable: true }),
      intereses: new FormControl<string[]>([], { nonNullable: true }),
      aceptaTerminos: new FormControl<boolean>(false, { nonNullable: true, validators: [requiredAccepted] }),
      aceptaDatos: new FormControl<boolean>(false, { nonNullable: true, validators: [requiredAccepted] }),
    },
    { validators: [connectRequired, interestsRequired] },
  );
  readonly formulario = this.form;

  readonly catalogs = signal<Catalogs>({
    nationalities: [],
    languages: [],
    interests: [],
    nacionalidades: [],
    idiomas: [],
    intereses: [],
  });
  readonly catalogos = this.catalogs;

  readonly loading = signal(true);
  readonly cargando = this.loading;

  readonly photoUri = signal<string | null>(null);
  readonly fotoUri = this.photoUri;

  readonly termsModalOpen = signal(false);
  readonly modalTerminosAbierto = this.termsModalOpen;

  private readonly catalogService = inject(CatalogService);
  private readonly messageService = inject(MessageService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly photoService = inject(PhotoService);
  private readonly photoOptionsService = inject(PhotoOptionsService);
  private readonly draft = inject(RegistrationDraftService);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ camera, add, shieldCheckmarkOutline });
  }

  async ngOnInit(): Promise<void> {
    this.catalogs.set(await this.catalogService.getLocalCatalogs());
    this.loading.set(false);
  }

  get selectedConnectOptions(): string[] {
    return this.form.controls.conectar.value;
  }
  get opcionesConectarElegidas(): string[] {
    return this.selectedConnectOptions;
  }

  get selectedInterests(): string[] {
    return this.form.controls.intereses.value;
  }
  get interesesElegidos(): string[] {
    return this.selectedInterests;
  }

  async pickPhoto(): Promise<void> {
    const source = await this.photoOptionsService.selectSource();
    if (!source) return;

    const allowed =
      source === 'camera'
        ? await this.permissionsService.ensureCamera()
        : await this.permissionsService.ensureGallery();
    if (!allowed) return;

    const { photo, error } =
      source === 'camera' ? await this.photoService.takePhoto() : await this.photoService.pickFromGallery();

    if (error) {
      await this.messageService.show(error);
      return;
    }
    if (photo) {
      this.photoUri.set(await compressPhoto(photo, 400, 0.7));
    }
  }

  async elegirFoto(): Promise<void> {
    return this.pickPhoto();
  }

  toggleConnect(option: string): void {
    const selected = this.selectedConnectOptions;
    this.form.controls.conectar.setValue(
      selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option],
    );
  }

  alternarConectar(opcion: string): void {
    this.toggleConnect(opcion);
  }

  toggleInterest(interest: string): void {
    const selected = this.selectedInterests;
    if (selected.includes(interest)) {
      this.form.controls.intereses.setValue(selected.filter((i) => i !== interest));
      return;
    }
    if (selected.length >= MAX_INTERESTS) {
      void this.messageService.show(`Solo puedes elegir hasta ${MAX_INTERESTS} intereses`);
      return;
    }
    this.form.controls.intereses.setValue([...selected, interest]);
  }

  alternarInteres(interes: string): void {
    this.toggleInterest(interes);
  }

  openTerms(): void {
    this.termsModalOpen.set(true);
  }

  abrirTerminos(): void {
    this.openTerms();
  }

  closeTerms(): void {
    this.termsModalOpen.set(false);
  }

  cerrarTerminos(): void {
    this.closeTerms();
  }

  async createAccount(): Promise<void> {
    const error = firstErrorMessage(this.form, REGISTRATION_ERRORS);
    if (error) {
      await this.messageService.show(error);
      if (this.form.controls.aceptaTerminos.invalid || this.form.controls.aceptaDatos.invalid) {
        this.termsModalOpen.set(true);
      }
      return;
    }

    const data = this.form.getRawValue();
    const connectList = this.connectOptions.filter((o) => data.conectar.includes(o));
    this.draft.save({
      profile: {
        name: data.nombre.trim(),
        email: data.correo.trim(),
        birthDate: isoToDate(data.fechaNacimiento),
        nationality: data.nacionalidad,
        gender: data.genero,
        connectWith: connectList,
        languages: [data.idioma],
        interests: [...data.intereses],
        photoUri: this.photoUri(),
        nombre: data.nombre.trim(),
        correo: data.correo.trim(),
        fechaNacimiento: isoToDate(data.fechaNacimiento),
        nacionalidad: data.nacionalidad,
        genero: data.genero,
        conectar: connectList,
        idiomas: [data.idioma],
        intereses: [...data.intereses],
      },
      credentials: await hashPassword(data.password),
      consent: {
        terms: data.aceptaTerminos,
        data: data.aceptaDatos,
        date: new Date().toISOString(),
        terminos: data.aceptaTerminos,
        datos: data.aceptaDatos,
        fecha: new Date().toISOString(),
      },
    });
    await this.router.navigateByUrl('/profile-preview');
  }

  async crearCuenta(): Promise<void> {
    return this.createAccount();
  }
}
