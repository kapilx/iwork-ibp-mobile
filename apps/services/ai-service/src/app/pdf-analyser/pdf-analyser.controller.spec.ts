import { Test, TestingModule } from '@nestjs/testing';
import { PdfAnalyserController } from './pdf-analyser.controller';
import { PdfAnalyserService } from './pdf-analyser.service';

describe('PdfAnalyserController', () => {
  let controller: PdfAnalyserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfAnalyserController],
      providers: [PdfAnalyserService],
    }).compile();

    controller = module.get<PdfAnalyserController>(PdfAnalyserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
