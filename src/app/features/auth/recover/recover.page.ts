import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { MessageService } from '../../../core/message/message.service';
import { firstErrorMessage } from '../../../shared/utils/forms';
import type { MessageRule } from '../../../shared/utils/forms';
import { validEmail, requiredWithContent } from '../../../shared/utils/validators';

const RECOVER_ERRORS: MessageRule[] = [
  { control: 'correo', error: 'required', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'requerido', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'email', message: 'Ingresa un correo electrónico válido' },
  { control: 'correo', error: 'correo', message: 'Ingresa un correo electrónico válido' },
];

/** Password recovery screen. */
@Component({
  selector: 'app-recover, app-recuperar',
  templateUrl: './recover.page.html',
  styleUrls: ['./recover.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonInput, IonButton, ReactiveFormsModule],
})
export class RecoverPage {
  readonly form = new FormGroup({
    correo: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent, validEmail] }),
  });
  readonly formulario = this.form;

  private readonly messageService = inject(MessageService);
  private readonly navCtrl = inject(NavController);

  async submit(): Promise<void> {
    const error = firstErrorMessage(this.form, RECOVER_ERRORS);
    if (error) {
      await this.messageService.show(error);
      return;
    }

    await this.messageService.show('Te enviaremos un enlace de recuperación a tu correo');
    this.navCtrl.back();
  }

  enviar(): Promise<void> {
    return this.submit();
  }
}
