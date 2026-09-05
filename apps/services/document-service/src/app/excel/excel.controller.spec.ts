import { Test, TestingModule } from '@nestjs/testing';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { ExcelRepository } from './excel.repository';

describe('ExcelController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [ExcelController],
      providers: [
        ExcelService,
        {
          provide: ExcelRepository,
          useValue: { brokingSlipExcelGeneration: jest.fn().mockResolvedValue('url') },
        },
      ],
    }).compile();
  });

  describe('generateExcel', () => {
    it('should return url on success', async () => {
      const controller = app.get<ExcelController>(ExcelController);
      const service = app.get<ExcelService>(ExcelService);
      const spy = jest.spyOn(service, 'generateExcel').mockResolvedValue('url');
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await controller.generateExcel({ fileName: 'file', data: [] }, res);
      expect(spy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 201,
        message: 'Successfully generated the excel',
        data: 'url',
      });
    });
  });
});
