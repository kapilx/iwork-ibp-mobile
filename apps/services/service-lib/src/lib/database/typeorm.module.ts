import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
  exports: [TypeOrmModule],
})
export class TypeOrmConfigModule {}