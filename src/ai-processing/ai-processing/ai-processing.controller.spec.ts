import { Test, TestingModule } from '@nestjs/testing';
import { AiProcessingController } from './ai-processing.controller';

describe('AiProcessingController', () => {
  let controller: AiProcessingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiProcessingController],
    }).compile();

    controller = module.get<AiProcessingController>(AiProcessingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
