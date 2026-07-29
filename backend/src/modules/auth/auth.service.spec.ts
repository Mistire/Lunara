import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../database/database.service';

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: any;
  let jwtService: any;

  beforeEach(async () => {
    databaseService = {
      db: {
        select: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: databaseService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email is not found', async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      await expect(
        service.login({ email: 'nonexistent@lunara.et', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('correct_password', 10);
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'doctor@lunara.et',
            passwordHash,
            role: 'doctor',
            clinicId: 'clinic-1',
            isActive: true,
            fullName: 'Dr. Abebe',
          },
        ]),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      await expect(
        service.login({ email: 'doctor@lunara.et', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and user profile if credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('valid_password', 10);
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'doctor@lunara.et',
            passwordHash,
            role: 'doctor',
            clinicId: 'clinic-1',
            isActive: true,
            fullName: 'Dr. Abebe',
          },
        ]),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(true),
      };
      databaseService.db.update.mockReturnValue(mockUpdate);

      const result = await service.login({
        email: 'doctor@lunara.et',
        password: 'valid_password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('doctor@lunara.et');
      expect(result.user.role).toBe('doctor');
    });
  });
});
