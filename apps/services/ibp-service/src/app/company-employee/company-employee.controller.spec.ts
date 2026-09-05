import { Test, TestingModule } from '@nestjs/testing';
import { CompanyEmployeeController } from './company-employee.controller';

describe('CompanyEmployeeController', () => {
  let controller: CompanyEmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyEmployeeController],
    }).compile();

    controller = module.get<CompanyEmployeeController>(CompanyEmployeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
