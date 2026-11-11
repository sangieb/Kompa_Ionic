import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import type { ValidatorFn } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
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
import { add, camera } from 'ionicons/icons';

import { MIN_PASSWORD_LEN } from '../../../core/auth/auth.service';
import { hashPassword } from '../../../core/auth/password-hash';
import { FotoOpcionesService } from '../../../core/foto/foto-opciones.service';
import { FotoService } from '../../../core/foto/foto.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { PermisosService } from '../../../core/permisos/permisos.service';
import type { Catalogos } from '../../../data/catalogos-semilla';
import { GENEROS, OPCIONES_CONECTAR } from '../../../data/catalogos-semilla';
import { isoAFecha, isoHaceAnios } from '../../../shared/utils/fechas';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { comprimirFoto } from '../../../shared/utils/foto';
import {
  aceptadoRequerido,
  correoValido,
  longitudMinima,
  mayorDeEdad,
  requeridoConContenido,
} from '../../../shared/utils/validadores';
import { RegistroBorradorService } from '../registro-borrador.service';

import { CatalogoService } from './catalogo.service';

const MAX_INTERESES = 5;

/** Validaciones del registro, en el mismo orden que validarFormulario() en Kotlin. */
const ERRORES_REGISTRO: ReglaMensaje[] = [
  { control: 'nombre', error: 'requerido', mensaje: 'Ingresa tu nombre' },
  { control: 'nombre', error: 'longitudMinima', mensaje: 'El nombre debe tener al menos 2 caracteres' },
  { control: 'correo', error: 'requerido', mensaje: 'Ingresa tu correo' },
  { control: 'correo', error: 'correo', mensaje: 'Ingresa un correo electrónico válido' },
  {
    control: 'password',
    error: 'minlength',
    mensaje: `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres`,
  },
  { control: 'fechaNacimiento', error: 'requerido', mensaje: 'Selecciona tu fecha de nacimiento' },
  { control: 'fechaNacimiento', error: 'mayorDeEdad', mensaje: 'Debes ser mayor de edad para registrarte' },
  { control: 'nacionalidad', error: 'requerido', mensaje: 'Selecciona tu nacionalidad' },
  { control: 'idioma', error: 'requerido', mensaje: 'Selecciona al menos un idioma' },
  { control: 'genero', error: 'requerido', mensaje: 'Selecciona tu género' },
  { control: '', error: 'conectarRequerido', mensaje: 'Selecciona con quién quieres conectar' },
  { control: '', error: 'interesesRequeridos', mensaje: 'Elige al menos un interés' },
  { control: 'aceptaDatos', error: 'requerido', mensaje: 'Debes aceptar el tratamiento de datos' },
];

/** Debe elegir con quién conectar (chips del formulario). */
const conectarRequerido: ValidatorFn = (control) => {
  const elegidos = control.get('conectar')?.value;
  return Array.isArray(elegidos) && elegidos.length > 0 ? null : { conectarRequerido: true };
};

/** Debe elegir al menos un interés. */
const interesesRequeridos: ValidatorFn = (control) => {
  const elegidos = control.get('intereses')?.value;
  return Array.isArray(elegidos) && elegidos.length > 0 ? null : { interesesRequeridos: true };
};

/** Equivale a ui/auth/registro/RegistroActivity.kt + RegistroViewModel.kt */
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
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
  ],
})
export class RegistroPage implements OnInit {
  readonly maxIntereses = MAX_INTERESES;
  readonly generos = GENEROS;
  readonly opcionesConectar = OPCIONES_CONECTAR;
  readonly fechaMaxima = isoHaceAnios(18);

  readonly formulario = new FormGroup(
    {
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [requeridoConContenido, longitudMinima(2)],
      }),
      correo: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido, correoValido] }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.minLength(MIN_PASSWORD_LEN)],
      }),
      fechaNacimiento: new FormControl<string>('', {
        nonNullable: true,
        validators: [requeridoConContenido, mayorDeEdad],
      }),
      nacionalidad: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
      idioma: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
      genero: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
      conectar: new FormControl<string[]>([], { nonNullable: true }),
      intereses: new FormControl<string[]>([], { nonNullable: true }),
      aceptaDatos: new FormControl<boolean>(false, { nonNullable: true, validators: [aceptadoRequerido] }),
    },
    { validators: [conectarRequerido, interesesRequeridos] },
  );

  readonly catalogos = signal<Catalogos>({ nacionalidades: [], idiomas: [], intereses: [] });
  readonly cargando = signal(true);
  readonly fotoUri = signal<string | null>(null);

  private readonly catalogoService = inject(CatalogoService);
  private readonly mensajes = inject(MensajeService);
  private readonly permisos = inject(PermisosService);
  private readonly fotos = inject(FotoService);
  private readonly opciones = inject(FotoOpcionesService);
  private readonly borrador = inject(RegistroBorradorService);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ camera, add });
  }

  async ngOnInit(): Promise<void> {
    this.catalogos.set(await this.catalogoService.catalogosLocales());
    this.cargando.set(false);
  }

  get opcionesConectarElegidas(): string[] {
    return this.formulario.controls.conectar.value;
  }

  get interesesElegidos(): string[] {
    return this.formulario.controls.intereses.value;
  }

  /** Muestra el selector cámara/galería y comprueba el permiso del origen elegido. */
  async elegirFoto(): Promise<void> {
    const fuente = await this.opciones.elegirFuente();
    if (!fuente) return;

    const permitido = await (fuente === 'camara' ? this.permisos.asegurarCamara() : this.permisos.asegurarGaleria());
    if (!permitido) return;

    const { foto, error } = fuente === 'camara' ? await this.fotos.tomarFoto() : await this.fotos.elegirDeGaleria();
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }
    if (foto) {
      this.fotoUri.set(await comprimirFoto(foto, 400, 0.7));
    }
  }

  alternarConectar(opcion: string): void {
    const elegidas = this.opcionesConectarElegidas;
    this.formulario.controls.conectar.setValue(
      elegidas.includes(opcion) ? elegidas.filter((o) => o !== opcion) : [...elegidas, opcion],
    );
  }

  alternarInteres(interes: string): void {
    const elegidos = this.interesesElegidos;
    if (elegidos.includes(interes)) {
      this.formulario.controls.intereses.setValue(elegidos.filter((i) => i !== interes));
      return;
    }
    if (elegidos.length >= MAX_INTERESES) {
      void this.mensajes.mostrar(`Solo puedes elegir hasta ${MAX_INTERESES} intereses`);
      return;
    }
    this.formulario.controls.intereses.setValue([...elegidos, interes]);
  }

  async crearCuenta(): Promise<void> {
    const error = primerMensajeError(this.formulario, ERRORES_REGISTRO);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    const datos = this.formulario.getRawValue();
    this.borrador.guardar({
      perfil: {
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        fechaNacimiento: isoAFecha(datos.fechaNacimiento),
        nacionalidad: datos.nacionalidad,
        genero: datos.genero,
        conectar: this.opcionesConectar.filter((o) => datos.conectar.includes(o)),
        idiomas: [datos.idioma],
        intereses: [...datos.intereses],
        fotoUri: this.fotoUri(),
      },
      // La contraseña se hashea aquí: el texto plano no sale del formulario.
      credenciales: await hashPassword(datos.password),
    });
    await this.router.navigateByUrl('/perfil-preview');
  }
}
