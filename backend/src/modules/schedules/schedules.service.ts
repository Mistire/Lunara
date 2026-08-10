import { Injectable, BadRequestException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { doctorSchedules, timeSlots } from '../../database/schema/schedules';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SchedulesService {
  constructor(private databaseService: DatabaseService) {}

  async createOrUpdateSchedule(dto: CreateScheduleDto, currentUser: JwtPayload) {
    const doctorId = dto.doctorId || currentUser.sub;

    // Check if schedule for this dayOfWeek already exists for this doctor
    const existing = await this.databaseService.db
      .select()
      .from(doctorSchedules)
      .where(
        and(
          eq(doctorSchedules.doctorId, doctorId),
          eq(doctorSchedules.dayOfWeek, dto.dayOfWeek),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing schedule
      const [updated] = await this.databaseService.db
        .update(doctorSchedules)
        .set({
          startTime: `${dto.startTime}:00`,
          endTime: `${dto.endTime}:00`,
          slotDurationMinutes: dto.slotDurationMinutes || 30,
          isActive: true,
        })
        .where(eq(doctorSchedules.id, existing[0].id))
        .returning();

      return updated;
    } else {
      // Create new schedule rule
      const [newSchedule] = await this.databaseService.db
        .insert(doctorSchedules)
        .values({
          doctorId,
          dayOfWeek: dto.dayOfWeek,
          startTime: `${dto.startTime}:00`,
          endTime: `${dto.endTime}:00`,
          slotDurationMinutes: dto.slotDurationMinutes || 30,
          isActive: true,
        })
        .returning();

      return newSchedule;
    }
  }

  async findSchedulesByDoctor(doctorId: string) {
    return this.databaseService.db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctorId))
      .orderBy(asc(doctorSchedules.dayOfWeek));
  }

  async findSlotsByDoctorAndDate(doctorId: string, dateStr: string) {
    return this.databaseService.db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.doctorId, doctorId),
          eq(timeSlots.date, dateStr),
        ),
      )
      .orderBy(asc(timeSlots.startTime));
  }

  async generateSlots(dto: GenerateSlotsDto, currentUser: JwtPayload) {
    const doctorId = dto.doctorId || currentUser.sub;

    const [y1, m1, d1] = dto.startDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const [y2, m2, d2] = dto.endDate.split('-').map(Number);
    const end = new Date(y2, m2 - 1, d2);

    if (start > end) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const createdSlotsCount = await this.databaseService.db.transaction(async (tx) => {
      let slotsCreated = 0;

      // 1. Fetch all active schedules for the doctor
      const schedules = await tx
        .select()
        .from(doctorSchedules)
        .where(
          and(
            eq(doctorSchedules.doctorId, doctorId),
            eq(doctorSchedules.isActive, true),
          ),
        );

      if (schedules.length === 0) {
        return 0;
      }

      // Map dayOfWeek -> Schedule for quick access
      const scheduleMap = new Map<number, typeof doctorSchedules.$inferSelect>();
      schedules.forEach((s) => scheduleMap.set(s.dayOfWeek, s));

      // 2. Loop through each day in the date range
      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const schedule = scheduleMap.get(dayOfWeek);

        if (!schedule) continue;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Generate slots for this day
        const startMinutes = this.parseTimeToMinutes(schedule.startTime);
        const endMinutes = this.parseTimeToMinutes(schedule.endTime);
        const duration = schedule.slotDurationMinutes;

        // Fetch existing slots for this day to avoid duplicates
        const existingSlots = await tx
          .select({ startTime: timeSlots.startTime })
          .from(timeSlots)
          .where(
            and(
              eq(timeSlots.doctorId, doctorId),
              eq(timeSlots.date, dateStr),
            ),
          );
        const existingStartTimes = new Set(existingSlots.map((s) => s.startTime));

        for (
          let current = startMinutes;
          current + duration <= endMinutes;
          current += duration
        ) {
          const slotStartStr = this.minutesToTimeString(current);
          const slotEndStr = this.minutesToTimeString(current + duration);

          if (!existingStartTimes.has(slotStartStr)) {
            await tx.insert(timeSlots).values({
              scheduleId: schedule.id,
              doctorId,
              date: dateStr,
              startTime: slotStartStr,
              endTime: slotEndStr,
              isBooked: false,
            });
            slotsCreated++;
          }
        }
      }

      return slotsCreated;
    });

    return { success: true, slotsCreatedCount: createdSlotsCount };
  }

  private parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }
}
