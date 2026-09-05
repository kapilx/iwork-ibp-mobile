// module: scope-nugget-config.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nudge } from '../../../../service-lib/src/lib/entities/master-nudge.entity';
import { NudgeDataController } from './nudge-data.controller';
import { NudgeDataService } from './nudge-data.service';
import { NudgeDataRepository } from './nudge-data.repository';
import { NudgeAction } from '../../../../service-lib/src/lib/entities/master-nudge-action.entity';
import { NudgeParameter } from '../../../../service-lib/src/lib/entities/master-nudge-parameters.entity';
import { NudgeScope } from '../../../../service-lib/src/lib/entities/master-nudge-scope.entity';
import { NudgeScopeRoleMapping } from '../../../../service-lib/src/lib/entities/master-nudge-scope-role-mapping.entity';
import { CacheModule} from '../../../../service-lib/src/lib/cache/cache.module'

@Module({
  imports: [TypeOrmModule.forFeature([Nudge, NudgeAction, NudgeParameter, NudgeScope, NudgeScopeRoleMapping]), CacheModule],
  controllers: [NudgeDataController],
  providers: [NudgeDataService, NudgeDataRepository],
  exports: [NudgeDataService],
})
export class NudgeDataModule {}