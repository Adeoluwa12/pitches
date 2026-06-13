import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface UpdatePreferencesDto {
  categories?: string[];
  excludedCategories?: string[];
  writingStyle?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      timezone: dto.timezone || 'Africa/Lagos',
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.categories) user.preferences.categories = dto.categories;
    if (dto.excludedCategories) user.preferences.excludedCategories = dto.excludedCategories;
    if (dto.writingStyle) user.preferences.writingStyle = dto.writingStyle;

    return user.save();
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
