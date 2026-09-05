import { SetMetadata } from '@nestjs/common';

export const SKIP_MASKING_KEY = 'masking:skip';

export const SkipMasking = () => SetMetadata(SKIP_MASKING_KEY, true);
