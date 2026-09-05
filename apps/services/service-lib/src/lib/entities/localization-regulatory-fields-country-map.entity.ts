import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LocalizationCompanyRegulatoryFields } from './localization-company-regulatory-field.entity';
import { LocalizationCountry } from './localization-country.entity';

@Entity('localization_regulatory_fields_country_map')
export class LocalizationRegulatoryFieldsCountryMap {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'country_id' })
  countryId: number;

  @Column({ name: 'regulatory_key_id' })
  regulatoryKeyId: number;

  @Column({ name: 'field_label', type: 'varchar' })
  fieldLabel: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'meta_data', type: 'jsonb', nullable: true })
  metaData?: Record<string, any>;

  // ✅ Add relation to localization_country
  @ManyToOne(() => LocalizationCountry, { eager: false })
  @JoinColumn({ name: 'country_id' })
  country: LocalizationCountry;

  // ✅ Add relation to localization_company_regulatory_fields
  @ManyToOne(() => LocalizationCompanyRegulatoryFields, { eager: false })
  @JoinColumn({ name: 'regulatory_key_id' })
  regulatoryField: LocalizationCompanyRegulatoryFields;
}
