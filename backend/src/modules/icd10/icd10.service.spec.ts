import { Test, TestingModule } from '@nestjs/testing';
import { Icd10Service } from './icd10.service';
import { DatabaseService } from '../../database/database.service';

describe('Icd10Service', () => {
  let service: Icd10Service;
  let databaseService: any;

  beforeEach(async () => {
    databaseService = {
      db: {
        select: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Icd10Service,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<Icd10Service>(Icd10Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return empty array if query is too short', async () => {
      const result = await service.search('a');
      expect(result).toEqual([]);
    });

    it('should return search results for valid query string', async () => {
      const mockCodes = [
        { id: '1', code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
      ];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCodes),
      };
      databaseService.db.select.mockReturnValue(mockQuery);

      const result = await service.search('pneumonia');
      expect(result).toEqual(mockCodes);
    });
  });
});
