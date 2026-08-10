import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { DatabaseService } from '../../database/database.service';
import { QueueGateway } from '../queue/queue.gateway';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let databaseService: any;
  let queueGateway: any;
  let mockDb: any;

  const mockUser: JwtPayload = {
    sub: 'receptionist-1',
    email: 'receptionist@lunara.et',
    role: 'receptionist',
    clinicId: 'clinic-1',
    fullName: 'Receptionist User',
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    };

    mockDb.transaction.mockImplementation((cb: any) => cb(mockDb));

    databaseService = {
      db: mockDb,
    };

    queueGateway = {
      broadcastQueueUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: DatabaseService, useValue: databaseService },
        { provide: QueueGateway, useValue: queueGateway },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if patient does not exist', async () => {
      const selectMock = jest.fn();
      // patientCheck returns empty
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      mockDb.select = selectMock;

      await expect(
        service.create(
          {
            patientId: 'invalid-patient',
            doctorId: 'doctor-1',
            scheduledDate: '2026-08-03',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if staff member is not a valid active doctor', async () => {
      const selectMock = jest.fn();
      // 1. patientCheck returns patient
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      });
      // 2. doctorCheck returns nurse instead of doctor
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'd1', role: 'nurse' }]),
      });

      mockDb.select = selectMock;

      await expect(
        service.create(
          {
            patientId: 'p1',
            doctorId: 'd1',
            scheduledDate: '2026-08-03',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully book a walk_in appointment and assign correct queue number', async () => {
      const selectMock = jest.fn();
      // 1. patientCheck
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      });
      // 2. doctorCheck
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'd1', role: 'doctor' }]),
      });
      // 3. countRes (existing count is 3)
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 3 }]),
      });

      mockDb.select = selectMock;

      const mockAppt = {
        id: 'appt-123',
        queueNumber: 4,
        doctorId: 'd1',
        scheduledDate: '2026-08-03',
      };

      const insertQuery = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockAppt]),
      };
      mockDb.insert.mockReturnValue(insertQuery);

      const result = await service.create(
        {
          patientId: 'p1',
          doctorId: 'd1',
          scheduledDate: '2026-08-03',
          type: 'walk_in',
        },
        mockUser,
      );

      expect(result.queueNumber).toBe(4);
      expect(queueGateway.broadcastQueueUpdate).toHaveBeenCalledWith(
        'clinic-1',
        'd1',
        '2026-08-03',
      );
    });

    it('should throw ConflictException if time slot is already booked for a scheduled appointment', async () => {
      const selectMock = jest.fn();
      // 1. patientCheck
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      });
      // 2. doctorCheck
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'd1', role: 'doctor' }]),
      });
      // 3. slotCheck (slot isBooked: true)
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'slot-1', doctorId: 'd1', date: '2026-08-03', isBooked: true }]),
      });

      mockDb.select = selectMock;

      await expect(
        service.create(
          {
            patientId: 'p1',
            doctorId: 'd1',
            scheduledDate: '2026-08-03',
            type: 'scheduled',
            slotId: 'slot-1',
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
