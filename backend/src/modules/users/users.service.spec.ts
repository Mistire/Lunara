import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: any;

  const mockAdminUser: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@lunara.et',
    role: 'admin',
    clinicId: 'clinic-1',
    fullName: 'Admin User',
  };

  beforeEach(async () => {
    databaseService = {
      db: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of staff users scoped to clinic', async () => {
      const mockUsers = [
        { id: '1', fullName: 'Staff 1', email: 'staff1@lunara.et', role: 'doctor' },
      ];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockUsers),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      const result = await service.findAll(mockAdminUser);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if user email already exists', async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      await expect(
        service.create(
          {
            fullName: 'New Staff',
            email: 'existing@lunara.et',
            password: 'Password123!',
            role: 'nurse',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
