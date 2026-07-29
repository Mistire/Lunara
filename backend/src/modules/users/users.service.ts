import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../database/schema/users';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async findAll(currentUser: JwtPayload) {
    return this.databaseService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.clinicId, currentUser.clinicId));
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const userList = await this.databaseService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.clinicId, currentUser.clinicId)))
      .limit(1);

    if (userList.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return userList[0];
  }

  async create(dto: CreateUserDto, currentUser: JwtPayload) {
    // Check if email already exists
    const existing = await this.databaseService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('A staff account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [newUser] = await this.databaseService.db
      .insert(users)
      .values({
        clinicId: currentUser.clinicId,
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        role: dto.role,
        phone: dto.phone,
        isActive: true,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return newUser;
  }

  async update(id: string, dto: UpdateUserDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const updateData: Partial<typeof users.$inferInsert> = {};

    if (dto.fullName) updateData.fullName = dto.fullName.trim();
    if (dto.email) updateData.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    updateData.updatedAt = new Date();

    const [updatedUser] = await this.databaseService.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.clinicId, currentUser.clinicId)))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async remove(id: string, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    // Deactivate user instead of hard deletion to preserve audit trail
    const [deactivated] = await this.databaseService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.clinicId, currentUser.clinicId)))
      .returning({
        id: users.id,
        isActive: users.isActive,
      });

    return deactivated;
  }
}
