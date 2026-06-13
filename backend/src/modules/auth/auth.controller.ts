import { Controller, Post, Body, Get, Request, UseGuards, Patch } from '@nestjs/common';
import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';

class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @IsOptional() timezone?: string;
}

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class UpdatePreferencesDto {
  @IsArray() @IsOptional() categories?: string[];
  @IsArray() @IsOptional() excludedCategories?: string[];
  @IsString() @IsOptional() writingStyle?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(@Request() req, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(req.user.userId, dto);
  }
}
