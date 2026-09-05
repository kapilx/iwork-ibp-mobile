import { Test } from '@nestjs/testing';
import { ExcelService } from './excel.service';
import { ExcelRepository } from './excel.repository';

describe('ExcelService', () => {
  let service: ExcelService;
  let repository: ExcelRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExcelService,
        {
          provide: ExcelRepository,
          useValue: {
            brokingSlipExcelGeneration: jest.fn().mockResolvedValue('url'),
            quoteComparisonReportExcelGeneration: jest
              .fn()
              .mockResolvedValue('url'),
          },
        },
      ],
    }).compile();
    service = module.get<ExcelService>(ExcelService);
    repository = module.get<ExcelRepository>(ExcelRepository);
  });

  describe('generateExcel', () => {
    it('should call repository with provided data', async () => {
      const spy = jest.spyOn(repository, 'brokingSlipExcelGeneration');
      const data: any[] = [];
      const result = await service.generateExcel('test', data);
      expect(spy).toHaveBeenCalledWith('test', data);
      expect(result).toBe('url');
    });
  });

  describe('generateQuoteComparisonReportExcel', () => {
    it('should call repository with provided data', async () => {
      const spy = jest.spyOn(
        repository,
        'quoteComparisonReportExcelGeneration',
      );
      const data: any = {};
      const result = await service.generateQuoteComparisonReportExcel(
        'file',
        data,
      );
      expect(spy).toHaveBeenCalledWith('file', data);
      expect(result).toBe('url');
    });
  });
});
