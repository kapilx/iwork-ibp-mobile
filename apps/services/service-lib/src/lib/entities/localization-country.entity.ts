import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("localization_country")
export class LocalizationCountry {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "name", type: "varchar", nullable: false })
    name: string;

    @Column({ name: "description", type: "text", nullable: true })
    description?: string;

    @Column({ name: "iso_code", type: "varchar", length: 10, nullable: true })
    isoCode?: string;

    @Column({ name: "locale", type: "varchar", length: 20, nullable: true })
    locale?: string;

    @Column({ name: "currency_code", type: "varchar", length: 10, nullable: true })
    currencyCode?: string;

    @Column({ name: "currency_display_name", type: "varchar", length: 50, nullable: true })
    currencyDisplayName?: string;

    @Column({ name: "currency_format", type: "varchar", length: 50, nullable: true })
    currencyFormat?: string;

    @Column({ name: "number_format", type: "varchar", length: 50, nullable: true })
    numberFormat?: string;

    @Column({ name: "date_format", type: "varchar", length: 20, nullable: true })
    dateFormat?: string;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;

    @Column({ name: "created_by", type: "varchar", length: 100, nullable: false })
    createdBy: string;

    @Column({ name: "updated_by", type: "varchar", length: 100, nullable: false })
    updatedBy: string;


    @Column({ name: "phone_number_format", type: "varchar", length: 50, nullable: true })
    phoneNumberFormat?: string;
    @Column({ name: "mobile_format", type: "varchar", length: 50, nullable: true })
    mobileFormat?: string;
    @Column({ name: "fax_format", type: "varchar", length: 20, nullable: true })
    faxFormat?: string;
    @Column({ name: "pincode_format", type: "varchar", length: 20, nullable: true })
    pincodeFormat?: string;
    @Column({ name: "tax_label", type: "varchar", length: 20, nullable: true })
    taxLabel?: string;

    constructor(
        name: string,
        createdBy: string,
        updatedBy: string,
        description?: string,
        isoCode?: string,
        locale?: string,
        currencyCode?: string,
        currencyDisplayName?: string,
        currencyFormat?: string,
        numberFormat?: string,
        dateFormat?: string
    ) {
        this.name = name;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
        this.description = description;
        this.isoCode = isoCode;
        this.locale = locale;
        this.currencyCode = currencyCode;
        this.currencyDisplayName = currencyDisplayName;
        this.currencyFormat = currencyFormat;
        this.numberFormat = numberFormat;
        this.dateFormat = dateFormat;
    }
}
