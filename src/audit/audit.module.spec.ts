import { Test, TestingModule } from '@nestjs/testing';
import { AuditModule } from './audit.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseModule } from '../database/database.module';

describe('AuditModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuditModule, DatabaseModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuditService', () => {
    const auditService = module.get<AuditService>(AuditService);
    expect(auditService).toBeDefined();
    expect(auditService).toBeInstanceOf(AuditService);
  });

  it('should provide AuditController', () => {
    const auditController = module.get<AuditController>(AuditController);
    expect(auditController).toBeDefined();
    expect(auditController).toBeInstanceOf(AuditController);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });
});