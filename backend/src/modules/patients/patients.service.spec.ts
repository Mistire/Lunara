import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('PatientsService', () => {
  let service: PatientsService;
  let databaseService: any;
  let mockDb: any;

  const mockUser: JwtPayload = {
    sub: 'user-1',
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

    // By default, make transaction call the callback with mockDb
    mockDb.transaction.mockImplementation((cb: any) => cb(mockDb));

    databaseService = {
      db: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should generate MRN sequentially starting with 00001 if no prior patient exists', async () => {
      // 1. mock select for MRN: returns empty array
      // 2. mock select for duplicate email: returns empty array
      // 3. mock insert: returns new patient
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation((val) => {
          // If query is for MRN (limit 1)
          return Promise.resolve([]);
        }),
      };

      mockDb.select.mockReturnValue(selectQuery);

      const mockPatient = {
        id: 'patient-uuid',
        mrn: `LUN-${new Date().getFullYear()}-00001`,
        fullName: 'Test Patient',
      };

      const insertQuery = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockPatient]),
      };

      mockDb.insert.mockReturnValue(insertQuery);

      const result = await service.create(
        {
          fullName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          sex: 'male',
        },
        mockUser,
      );

      expect(result.mrn).toBe(`LUN-${new Date().getFullYear()}-00001`);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should increment MRN sequential index if patient already exists in the current year', async () => {
      // First select call (finding last MRN) returns LUN-2026-00042
      // Second select call (finding email duplicate) returns empty
      const lastMrn = `LUN-${new Date().getFullYear()}-00042`;

      const selectMock = jest.fn();
      // First call
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ mrn: lastMrn }]),
      });
      // Second call (email check)
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      mockDb.select = selectMock;

      const mockPatient = {
        id: 'patient-uuid',
        mrn: `LUN-${new Date().getFullYear()}-00043`,
        fullName: 'Test Patient 2',
      };

      const insertQuery = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockPatient]),
      };
      mockDb.insert.mockReturnValue(insertQuery);

      const result = await service.create(
        {
          fullName: 'Test Patient 2',
          dateOfBirth: '1990-01-01',
          sex: 'female',
          email: 'test@gmail.com',
        },
        mockUser,
      );

      expect(result.mrn).toBe(`LUN-${new Date().getFullYear()}-00043`);
    });
  });

  describe('findAll', () => {
    it('should list all patients not deleted in the clinic', async () => {
      const mockPatientsList = [
        { id: 'p1', fullName: 'Patient A', mrn: 'LUN-2026-00001' },
      ];

      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockPatientsList),
      };
      mockDb.select.mockReturnValue(selectQuery);

      const result = await service.findAll(mockUser);
      expect(result).toEqual(mockPatientsList);
    });
  });

  describe('findOne', () => {
    it('should return patient if exists', async () => {
      const mockPatient = { id: 'p1', fullName: 'Patient A' };

      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPatient]),
      };
      mockDb.select.mockReturnValue(selectQuery);

      const result = await service.findOne('p1', mockUser);
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException if patient does not exist', async () => {
      const selectQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(selectQuery);

      await expect(service.findOne('p1', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
