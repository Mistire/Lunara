import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('VitalSignsService', () => {
  let service: VitalSignsService;
  let databaseService: any;
  let mockDb: any;

  const mockUser: JwtPayload = {
    sub: 'user-1',
    email: 'nurse@lunara.et',
    role: 'nurse',
    clinicId: 'clinic-1',
    fullName: 'Nurse User',
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
    };

    databaseService = {
      db: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VitalSignsService,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<VitalSignsService>(VitalSignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if patient does not exist', async () => {
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // patient not found
      };
      mockDb.select.mockReturnValue(selectQuery);

      await expect(
        service.create(
          {
            patientId: 'non-existent-id',
            temperature: 37,
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate BMI and record vital signs with correct type stringifications', async () => {
      // 1. mock patient exist check
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      };
      mockDb.select.mockReturnValue(selectQuery);

      const mockVitalsRecord = {
        id: 'v1',
        patientId: 'p1',
        weightKg: '70.00',
        heightCm: '175.0',
        bmi: '22.86',
      };

      const insertQuery = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockVitalsRecord]),
      };
      mockDb.insert.mockReturnValue(insertQuery);

      const result = await service.create(
        {
          patientId: 'p1',
          weightKg: 70.0,
          heightCm: 175.0,
          temperature: 36.8,
        },
        mockUser,
      );

      expect(result.bmi).toBe('22.86');
      expect(mockDb.insert).toHaveBeenCalled();
      
      // Check values argument structure passed to database
      const insertArgs = mockDb.insert.mock.calls[0][0]; // the table
      const valuesArgs = mockDb.insert().values.mock.calls[0][0];
      
      expect(valuesArgs.weightKg).toBe('70.00');
      expect(valuesArgs.heightCm).toBe('175.0');
      expect(valuesArgs.temperature).toBe('36.8');
      expect(valuesArgs.bmi).toBe('22.86');
    });
  });

  describe('findByAppointment', () => {
    it('should throw NotFoundException if no vital signs are logged for appointment', async () => {
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(selectQuery);

      await expect(service.findByAppointment('appt-1')).rejects.toThrow(NotFoundException);
    });
  });
});
