import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

describe('Application Bootstrap', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should bootstrap the application', async () => {
    await app.init();
    expect(app).toBeDefined();
  });

  it('should have app module defined', () => {
    expect(AppModule).toBeDefined();
  });
});