import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { DatabaseService } from '../../database/database.service';
import { QueueGateway } from '../queue/queue.gateway';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let databaseService: any;
  let queueGateway: any;
  let mockDb: any;

  const mockDoctor: JwtPayload = {
    sub: 'doctor-1',
    email: 'doctor@lunara.et',
    role: 'doctor',
    clinicId: 'clinic-1',
    fullName: 'Doctor Abebe',
  };

  const mockAdmin: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@lunara.et',
    role: 'admin',
    clinicId: 'clinic-1',
    fullName: 'Admin User',
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        ConsultationsService,
        { provide: DatabaseService, useValue: databaseService },
        { provide: QueueGateway, useValue: queueGateway },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startConsultation', () => {
    it('should throw NotFoundException if appointment does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.startConsultation({ appointmentId: 'invalid-appt' }, mockDoctor),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if appointment is assigned to another doctor', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'appt-1',
            doctorId: 'doctor-2', // different doctor
            patientId: 'patient-1',
            status: 'checked_in',
            clinicId: 'clinic-1',
          },
        ]),
      });

      await expect(
        service.startConsultation({ appointmentId: 'appt-1' }, mockDoctor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if appointment is not checked_in', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'appt-1',
            doctorId: 'doctor-1',
            patientId: 'patient-1',
            status: 'scheduled', // not checked_in
            clinicId: 'clinic-1',
          },
        ]),
      });

      await expect(
        service.startConsultation({ appointmentId: 'appt-1' }, mockDoctor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if consultation already exists', async () => {
      const selectMock = jest.fn();
      // First select: appointment check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'appt-1',
            doctorId: 'doctor-1',
            patientId: 'patient-1',
            status: 'checked_in',
            clinicId: 'clinic-1',
          },
        ]),
      });
      // Second select: duplicate consultation check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'existing-consult' }]),
      });

      mockDb.select = selectMock;

      await expect(
        service.startConsultation({ appointmentId: 'appt-1' }, mockDoctor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully start a consultation and update appointment', async () => {
      const selectMock = jest.fn();
      // 1. Appointment check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'appt-1',
            doctorId: 'doctor-1',
            patientId: 'patient-1',
            status: 'checked_in',
            scheduledDate: '2026-08-11',
            clinicId: 'clinic-1',
          },
        ]),
      });
      // 2. Duplicate check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      mockDb.select = selectMock;

      const mockConsult = { id: 'consult-1', appointmentId: 'appt-1', status: 'in_progress' };
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockConsult]),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 'appt-1' }]),
      });

      const result = await service.startConsultation(
        { appointmentId: 'appt-1', chiefComplaint: 'Fever' },
        mockDoctor,
      );

      expect(result).toEqual(mockConsult);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(queueGateway.broadcastQueueUpdate).toHaveBeenCalledWith(
        'clinic-1',
        'doctor-1',
        '2026-08-11',
      );
    });
  });

  describe('updateConsultation', () => {
    it('should throw NotFoundException if consultation does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.updateConsultation('invalid-id', { chiefComplaint: 'Updated' }, mockDoctor),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the assigned doctor', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            appointmentId: 'appt-1',
            doctorId: 'doctor-2', // assigned to another doctor
            patientId: 'patient-1',
            status: 'in_progress',
          },
        ]),
      });

      await expect(
        service.updateConsultation('consult-1', { chiefComplaint: 'Updated' }, mockDoctor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if attempting to change status of completed/cancelled consultation', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            appointmentId: 'appt-1',
            doctorId: 'doctor-1',
            patientId: 'patient-1',
            status: 'completed', // completed
          },
        ]),
      });

      await expect(
        service.updateConsultation('consult-1', { status: 'cancelled' }, mockDoctor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update and cascade changes on completion', async () => {
      const selectMock = jest.fn();
      // 1. Consultation check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            appointmentId: 'appt-1',
            doctorId: 'doctor-1',
            patientId: 'patient-1',
            status: 'in_progress',
          },
        ]),
      });
      // 2. Appointment details fetch (within transaction)
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            slotId: null,
            scheduledDate: '2026-08-11',
            doctorId: 'doctor-1',
          },
        ]),
      });

      mockDb.select = selectMock;

      const mockUpdatedConsult = { id: 'consult-1', status: 'completed' };
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation((val) => {
          return {
            returning: jest.fn().mockResolvedValue([mockUpdatedConsult]),
          };
        }),
      });

      const result = await service.updateConsultation('consult-1', { status: 'completed' }, mockDoctor);

      expect(result.status).toBe('completed');
      expect(queueGateway.broadcastQueueUpdate).toHaveBeenCalledWith(
        'clinic-1',
        'doctor-1',
        '2026-08-11',
      );
    });
  });

  describe('upsertSoapNotes', () => {
    it('should throw BadRequestException if consultation status is not in_progress', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            doctorId: 'doctor-1',
            status: 'completed', // completed
          },
        ]),
      });

      await expect(
        service.upsertSoapNotes('consult-1', { subjective: 'cough' }, mockDoctor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully upsert SOAP notes', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            doctorId: 'doctor-1',
            status: 'in_progress',
          },
        ]),
      });

      const mockNotes = { consultationId: 'consult-1', subjective: 'cough' };
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockNotes]),
      });

      const result = await service.upsertSoapNotes('consult-1', { subjective: 'cough' }, mockDoctor);
      expect(result).toEqual(mockNotes);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('addDiagnosis', () => {
    it('should successfully add a diagnosis and enforce primary status', async () => {
      const selectMock = jest.fn();
      // 1. Consultation check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'consult-1',
            doctorId: 'doctor-1',
            status: 'in_progress',
          },
        ]),
      });
      // 2. ICD-10 check
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'icd-1' }]),
      });
      // 3. Existing diagnosis check (transaction) - returns empty
      selectMock.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      mockDb.select = selectMock;

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const mockDiag = { id: 'diag-1', consultationId: 'consult-1', icd10CodeId: 'icd-1', isPrimary: true };
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockDiag]),
      });

      const result = await service.addDiagnosis(
        'consult-1',
        { icd10CodeId: 'icd-1', isPrimary: true },
        mockDoctor,
      );

      expect(result).toEqual(mockDiag);
      expect(mockDb.update).toHaveBeenCalled(); // to reset other primary diagnoses
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
