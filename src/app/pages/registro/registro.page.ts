import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
  IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption,
  IonRadioGroup, IonRadio, IonChip, IonCheckbox, IonButton, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, add } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CatalogoService } from '../../services/catalogo.service';
import { MensajeService } from '../../services/mensaje.service';
import { RegistroBorradorService } from '../../services/registro-borrador.service';
import { MIN_PASSWORD_LEN } from '../../services/auth.service';
import { esCorreoValido } from '../../core/validaciones';
import { edadDesdeIso, isoAFecha, isoHaceAnios } from '../../core/fechas';
import { Catalogos } from '../../data/catalogos-semilla';

const MAX_INTERESES = 5;

/** Equivale a ui/auth/registro/RegistroActivity.kt + RegistroViewModel.kt */
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
    IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption,
    IonRadioGroup, IonRadio, IonChip, IonCheckbox, IonButton, IonIcon,
  ],
})
export class RegistroPage implements OnInit {
  readonly maxIntereses = MAX_INTERESES;
  readonly generos = ['Mujer', 'Hombre', 'No binario', 'Prefiero describirlo'];
  readonly opcionesConectar = ['Mujeres', 'Hombres', 'Todes'];
  readonly fechaMaxima = isoHaceAnios(18);

  catalogos: Catalogos = { nacionalidades: [], idiomas: [], intereses: [] };
  cargando = true;

  nombre = '';
  correo = '';
  password = '';
  fechaIso = '';
  nacionalidad = '';
  idioma = '';
  genero = '';
  conectar: string[] = [];
  intereses: string[] = [];
  aceptaDatos = false;
  fotoUri: string | null = null;

  constructor(
    private catalogoService: CatalogoService,
    private mensajes: MensajeService,
    private borrador: RegistroBorradorService,
    private router: Router
  ) {
    addIcons({ camera, add });
  }

  async ngOnInit() {
    this.catalogos = await this.catalogoService.catalogosLocales();
    this.cargando = false;
  }

  /** Abre la galería, como pickImageLauncher.launch("image/*") */
  async elegirFoto() {
    try {
      const foto = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 70,
        width: 400,
        allowEditing: false,
      });
      this.fotoUri = foto.dataUrl ?? null;
    } catch {
      // El usuario canceló: no se hace nada
    }
  }

  alternarConectar(opcion: string) {
    this.conectar = this.conectar.includes(opcion)
      ? this.conectar.filter((o) => o !== opcion)
      : [...this.conectar, opcion];
  }

  alternarInteres(interes: string) {
    if (this.intereses.includes(interes)) {
      this.intereses = this.intereses.filter((i) => i !== interes);
      return;
    }
    if (this.intereses.length >= MAX_INTERESES) {
      this.mensajes.mostrar(`Solo puedes elegir hasta ${MAX_INTERESES} intereses`);
      return;
    }
    this.intereses = [...this.intereses, interes];
  }

  crearCuenta() {
    if (!this.validarFormulario()) return;

    this.borrador.guardar({
      password: this.password,
      perfil: {
        nombre: this.nombre.trim(),
        correo: this.correo.trim(),
        fechaNacimiento: isoAFecha(this.fechaIso),
        nacionalidad: this.nacionalidad,
        genero: this.genero,
        conectar: this.opcionesConectar.filter((o) => this.conectar.includes(o)).join(', '),
        idiomas: this.idioma,
        intereses: this.intereses.join(', '),
        fotoUri: this.fotoUri,
      },
    });
    this.router.navigateByUrl('/perfil-preview');
  }

  /** Mismas validaciones y en el mismo orden que validarFormulario() en Kotlin */
  private validarFormulario(): boolean {
    const nombre = this.nombre.trim();
    const correo = this.correo.trim();
    const edad = this.fechaIso ? edadDesdeIso(this.fechaIso) : null;

    let error: string | null = null;
    if (!nombre) error = 'Ingresa tu nombre';
    else if (nombre.length < 2) error = 'El nombre debe tener al menos 2 caracteres';
    else if (!correo) error = 'Ingresa tu correo';
    else if (!esCorreoValido(correo)) error = 'Ingresa un correo electrónico válido';
    else if (this.password.length < MIN_PASSWORD_LEN) error = 'La contraseña debe tener al menos 6 caracteres';
    else if (!this.fechaIso) error = 'Selecciona tu fecha de nacimiento';
    else if (edad === null || edad < 18) error = 'Debes ser mayor de edad para registrarte';
    else if (!this.nacionalidad) error = 'Selecciona tu nacionalidad';
    else if (!this.idioma) error = 'Selecciona al menos un idioma';
    else if (!this.genero) error = 'Selecciona tu género';
    else if (this.conectar.length === 0) error = 'Selecciona con quién quieres conectar';
    else if (this.intereses.length === 0) error = 'Elige al menos un interés';
    else if (!this.aceptaDatos) error = 'Debes aceptar el tratamiento de datos';

    if (error) {
      this.mensajes.mostrar(error);
      return false;
    }
    return true;
  }
}