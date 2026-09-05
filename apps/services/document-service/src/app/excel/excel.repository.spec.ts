import { Test } from '@nestjs/testing';
import { ExcelRepository } from './excel.repository';
import * as fileUtils from '../../../../service-lib/src/lib/utils/file-management.utils';

describe('ExcelRepository', () => {
  let repository: ExcelRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ExcelRepository],
    }).compile();
    repository = module.get<ExcelRepository>(ExcelRepository);
  });

  describe('brokingSlipExcelGeneration', () => {
    it('should call excelSheetGeneration with provided data', async () => {
      const spy = jest
        .spyOn(fileUtils, 'excelSheetGeneration')
        .mockResolvedValue('url');
      const data: fileUtils.VersionSheet[] = [];
      const result = await repository.brokingSlipExcelGeneration('test', data);
      expect(spy).toHaveBeenCalledWith('test', data);
      expect(result).toBe('url');
    });
  });

  describe('quoteComparisonReportExcelGeneration', () => {
    it('should call quoteComparisonReportExcelSheetGeneration with provided data', async () => {
      const spy = jest
        .spyOn(fileUtils, 'quoteComparisonReportExcelSheetGeneration')
        .mockResolvedValue('url');
      const data: any = {};
      const result = await repository.quoteComparisonReportExcelGeneration(
        'file',
        data,
      );
      expect(spy).toHaveBeenCalledWith('file', data);
      expect(result).toBe('url');
    });
  });
});
