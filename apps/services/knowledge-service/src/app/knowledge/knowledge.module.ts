import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeCentral } from '../../../../service-lib/src/lib/entities/knowledge-central.entity';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeController } from './knowledge.controller';
import { JwtService } from '@nestjs/jwt';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeCentral]),
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository, JwtService],
})
export class KnowledgeModule {}
