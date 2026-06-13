import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    const user = await this.usersService.create({ name, email, password });
    const token = this.signToken(user._id.toString(), user.email);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user._id.toString(), user.email);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    };
  }

  private signToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
