import { Test, TestingModule } from '@nestjs/testing';
import { ClipboardGateway } from './clipboard.gateway.js';

describe('ClipboardGateway', () => {
  let gateway: ClipboardGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClipboardGateway],
    }).compile();

    gateway = module.get<ClipboardGateway>(ClipboardGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
