import { Test, TestingModule } from '@nestjs/testing';
import { KasirService } from './kasir.service';

describe('KasirService', () => {
  let service: KasirService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KasirService],
    }).compile();

    service = module.get<KasirService>(KasirService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
