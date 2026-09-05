import { PartialType } from '@nestjs/mapped-types';
import { CreateSimpleAuthDto } from './create-simple-auth.dto';

export class UpdateSimpleAuthDto extends PartialType(CreateSimpleAuthDto) {}
