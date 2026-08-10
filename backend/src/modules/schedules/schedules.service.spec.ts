import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let databaseService: any;
  let mockDb: any;

  const mockUser: JwtPayload = {
    sub: 'doctor-1',
    email: 'doctor@lunara.et',
    role: 'doctor',
    clinicId: 'clinic-1',
    fullName: 'Doctor User',
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateSchedule', () => {
    it('should create a new weekly schedule if none exists', async () => {
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // no existing schedule
      };
      mockDb.select.mockReturnValue(selectQuery);

      const mockSchedule = { id: 's1', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' };
      const insertQuery = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockSchedule]),
      };
      mockDb.insert.mockReturnValue(insertQuery);

      const result = await service.createOrUpdateSchedule(
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '10:00',
          slotDurationMinutes: 30,
        },
        mockUser,
      );

      expect(result).toEqual(mockSchedule);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update existing weekly schedule if it exists', async () => {
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'existing-schedule-id' }]),
      };
      mockDb.select.mockReturnValue(selectQuery);

      const mockSchedule = { id: 'existing-schedule-id', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' };
      const updateQuery = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockSchedule]),
      };
      mockDb.update.mockReturnValue(updateQuery);

      const result = await service.createOrUpdateSchedule(
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '10:00',
          slotDurationMinutes: 30,
        },
        mockUser,
      );

      expect(result).toEqual(mockSchedule);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('generateSlots', () => {
    it('should throw BadRequestException if start date is after end date', async () => {
      await expect(
        service.generateSlots(
          {
            startDate: '2026-08-15',
            endDate: '2026-08-01',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate time slots based on active doctor availability schedules', async () => {
      // 1. Mock select doctorSchedules: returns Monday schedule (8:00 to 10:00)
      const mockSchedule = {
        id: 's1',
        doctorId: 'doctor-1',
        dayOfWeek: 1, // Monday
        startTime: '08:00:00',
        endTime: '10:00:00',
        slotDurationMinutes: 30,
        isActive: true,
      };

      const createThenable = (value: any) => ({
        then: (resolve: any) => resolve(value),
        limit: jest.fn().mockImplementation(() => createThenable(value)),
      });

      const selectMock = jest.fn();

      // First query inside loop or setup: select schedules
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => createThenable([mockSchedule])),
      });

      // Also need to handle queries checking for existing slots:
      // Mock it returns empty array so slots can be created
      selectMock.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => createThenable([])),
      });

      mockDb.select = selectMock;

      const insertQuery = {
        values: jest.fn().mockReturnThis(),
      };
      mockDb.insert.mockReturnValue(insertQuery);

      // We generate for a range containing exactly 1 Monday (e.g. Aug 3, 2026 is Monday)
      // Range: 2026-08-03 (Monday) to 2026-08-03 (Monday)
      const result = await service.generateSlots(
        {
          startDate: '2026-08-03',
          endDate: '2026-08-03',
          doctorId: 'doctor-1',
        },
        mockUser,
      );

      // Monday 8:00 - 10:00 with 30 min duration should yield 4 slots:
      // 8:00-8:30, 8:30-9:00, 9:00-9:30, 9:30-10:00
      expect(result.slotsCreatedCount).toBe(4);
    });
  });
});
