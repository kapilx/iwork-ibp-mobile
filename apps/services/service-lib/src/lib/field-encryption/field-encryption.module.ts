import { Module } from "@nestjs/common";
import { FieldEncryptionService } from "./services/field-encryption.service";
import { FieldEncryptionSubscriber } from "./subscribers/field-encryption.subscriber";

@Module({
  providers: [FieldEncryptionService, FieldEncryptionSubscriber],
  exports: [FieldEncryptionService, FieldEncryptionSubscriber],
})
export class FieldEncryptionModule {}
