import { Test, TestingModule } from '@nestjs/testing';
import { PdfAnalyserService } from './pdf-analyser.service';

describe('PdfAnalyserService', () => {
  let service: PdfAnalyserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfAnalyserService],
    }).compile();

    service = module.get<PdfAnalyserService>(PdfAnalyserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
