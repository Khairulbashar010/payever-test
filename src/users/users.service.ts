import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly httpService: HttpService,
    @InjectQueue('emails') private emailQueue: Queue,
  ) {}

  async createUser(createUserDto: any): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    await createdUser.save();
    // Send dummy email and RabbitMQ event
    this.sendDummyEmail(createdUser);
    this.sendRabbitMQEvent(createdUser);
    return createdUser;
  }

  async getUserById(userId: string): Promise<User> {
    const { data } = await firstValueFrom(this.httpService.get(`https://reqres.in/api/users/${userId}`));
    return data.data;
  }

  async getUserAvatar(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }
    const avatarPath = path.resolve(__dirname, '../../avatars', `${userId}.png`);
    const avatarHash = crypto.createHash('md5').update(user.avatar).digest('hex');

    if (await this.checkFileExists(avatarPath)) {
      return fsPromises.readFile(avatarPath, 'base64');
    } else {
      const { data: avatarBuffer } = await firstValueFrom(this.httpService.get(user.avatar, { responseType: 'arraybuffer' }));
      await fsPromises.writeFile(avatarPath, avatarBuffer);
      await this.saveAvatarToDb(userId, avatarHash);
      return avatarBuffer.toString('base64');
    }
  }

  async deleteUserAvatar(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }
    const avatarPath = path.resolve(__dirname, '../../avatars', `${userId}.png`);
    await fsPromises.unlink(avatarPath);
    await this.deleteAvatarFromDb(userId);
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async saveAvatarToDb(userId: string, avatarHash: string): Promise<void> {
    // Implement saving avatar hash to MongoDB
  }

  private async deleteAvatarFromDb(userId: string): Promise<void> {
    // Implement deleting avatar entry from MongoDB
  }

  private async sendDummyEmail(user: User): Promise<void> {
    await this.emailQueue.add('sendEmail', {
      email: user.email,
      message: `Welcome ${user.first_name} ${user.last_name}!`,
    });
  }

  private async sendRabbitMQEvent(user: User): Promise<void> {
    // Implement RabbitMQ event sending logic
  }
}
