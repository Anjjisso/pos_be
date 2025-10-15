import { Test, TestingModule } from '@nestjs/testing';
import { PelangganController } from './pelanggan.controller';

describe('PelangganController', () => {
  let controller: PelangganController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PelangganController],
    }).compile();

    controller = module.get<PelangganController>(PelangganController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
