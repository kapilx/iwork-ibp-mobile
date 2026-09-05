import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevealController } from './reveal.controller';
import { RevealService } from './reveal.service';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { Employee } from '../../../../service-lib/src/lib/entities/employee.entity';
import { ContactCommunicationDetails } from '../../../../service-lib/src/lib/entities/contact-communication-details.entity';
import { PolicyEnrollmentEmployee } from '../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity';
import { PolicyEnrollmentDependent } from '../../../../service-lib/src/lib/entities/policy-enrollment-dependent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Employee, ContactCommunicationDetails, PolicyEnrollmentEmployee, PolicyEnrollmentDependent])],
  controllers: [RevealController],
  providers: [RevealService],
})
export class RevealModule {}
