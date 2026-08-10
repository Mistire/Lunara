import { Test, TestingModule } from '@nestjs/testing';
import { QueueGateway } from './queue.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('QueueGateway', () => {
  let gateway: QueueGateway;
  let jwtService: any;

  beforeEach(async () => {
    jwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueGateway,
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-secret'),
          },
        },
      ],
    }).compile();

    gateway = module.get<QueueGateway>(QueueGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('broadcastQueueUpdate', () => {
    it('should emit queueUpdated event to clinic room', () => {
      gateway.broadcastQueueUpdate('clinic-1', 'doctor-1', '2026-08-03');
      expect(gateway.server.to).toHaveBeenCalledWith('clinic:clinic-1');
      expect(gateway.server.to('clinic-1').emit).toHaveBeenCalledWith('queueUpdated', {
        doctorId: 'doctor-1',
        scheduledDate: '2026-08-03',
      });
    });
  });
});
