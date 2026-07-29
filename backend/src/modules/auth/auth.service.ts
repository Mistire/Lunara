import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../database/schema/users';
import { clinics } from '../../database/schema/clinics';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const userList = await this.databaseService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        clinicId: users.clinicId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, loginDto.email.toLowerCase().trim()))
      .limit(1);

    if (userList.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = userList[0];

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact clinic administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.databaseService.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
      },
    };
  }

  async refreshToken(refreshTokenString: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'lunara_jwt_refresh_secret_key_change_in_production_2024';

      const payload = this.jwtService.verify<JwtPayload>(refreshTokenString, {
        secret: refreshSecret,
      });

      const userList = await this.databaseService.db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          clinicId: users.clinicId,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (userList.length === 0 || !userList[0].isActive) {
        throw new UnauthorizedException('User no longer active or valid');
      }

      const user = userList[0];
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        fullName: user.fullName,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.generateRefreshToken(newPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const userList = await this.databaseService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        clinicId: users.clinicId,
        clinicName: clinics.name,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(clinics, eq(users.clinicId, clinics.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userList.length === 0) {
      throw new NotFoundException('User profile not found');
    }

    return userList[0];
  }

  private generateRefreshToken(payload: JwtPayload): string {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'lunara_jwt_refresh_secret_key_change_in_production_2024';

    return this.jwtService.sign(
      { sub: payload.sub, email: payload.email, role: payload.role, clinicId: payload.clinicId },
      {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );
  }
}
