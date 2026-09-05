import { SetMetadata } from '@nestjs/common';

export const MASKING_TABLE_KEY = 'masking:table';

export const ApplyMasking = (tableName: string) =>
  SetMetadata(MASKING_TABLE_KEY, tableName);
