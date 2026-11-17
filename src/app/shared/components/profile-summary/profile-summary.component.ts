import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonChip, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  camera,
  flagOutline,
  heartOutline,
  languageOutline,
  peopleOutline,
  personOutline,
} from 'ionicons/icons';

import type { Profile } from '../../../core/profile/profile.model';
import { ageFromDateText } from '../../utils/dates';

/**
 * Displays profile overview (cover, details, and chips).
 */
@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
  imports: [IonChip, IonIcon],
})
export class ProfileSummaryComponent {
  @Input() profile!: Profile;

  @Input() set perfil(p: Profile) {
    this.profile = p;
  }
  get perfil(): Profile {
    return this.profile;
  }

  @Input() editable = false;

  @Output() editPhoto = new EventEmitter<void>();
  @Output() editarFoto = this.editPhoto;

  constructor() {
    addIcons({ camera, calendarOutline, flagOutline, personOutline, peopleOutline, languageOutline, heartOutline });
  }

  get birthDateText(): string {
    const rawDate = this.profile?.birthDate ?? this.profile?.fechaNacimiento ?? '';
    const age = this.age;
    return age !== null ? `${rawDate} (${age} años)` : rawDate;
  }

  get nacimiento(): string {
    return this.birthDateText;
  }

  get age(): number | null {
    const rawDate = this.profile?.birthDate ?? this.profile?.fechaNacimiento ?? '';
    return ageFromDateText(rawDate);
  }

  get edad(): number | null {
    return this.age;
  }

  get connect(): string {
    const list = this.profile?.connectWith ?? this.profile?.conectar ?? [];
    return list.join(', ');
  }

  get conectar(): string {
    return this.connect;
  }

  get languagesCount(): number {
    return (this.profile?.languages ?? this.profile?.idiomas ?? []).length;
  }

  get idiomas(): number {
    return this.languagesCount;
  }

  get interestsCount(): number {
    return (this.profile?.interests ?? this.profile?.intereses ?? []).length;
  }

  get intereses(): number {
    return this.interestsCount;
  }
}
