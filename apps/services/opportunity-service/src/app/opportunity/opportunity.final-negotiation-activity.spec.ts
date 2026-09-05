import { Test, TestingModule } from '@nestjs/testing';
import { OpportunityService } from './opportunity.service';
import { OpportunityRepository } from './opportunity.repository';

describe('FinalNegotiationStep', () => {
  let service: OpportunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityService,
        {
          provide: OpportunityRepository,
          useValue: {
            createFinalNegotiationStep: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OpportunityService>(OpportunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
