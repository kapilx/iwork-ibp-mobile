import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OpportunityFinalNegotiation } from './opportunity-final-negotiation.entity';
import { LookUp } from './look-up.entity';
import type { Relation } from 'typeorm';

@Entity('opportunity_final_negotiation_service_level_agreement')
export class OpportunityFinalNegotiationServiceLevelAgreement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'opportunity_final_negotiation_id', type: 'int' })
  opportunityFinalNegotiationId: number;

  @Column({ name: 'service_type_id', type: 'int' })
  serviceTypeId: number;

  @Column({ name: 'number_of_days', type: 'int' })
  numberOfDays: number;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.slaDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_final_negotiation_id' })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: 'service_type_id' })
  serviceType: Relation<LookUp>;
}
