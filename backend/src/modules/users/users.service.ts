import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        language: true,
        isActive: true,
        createdAt: true,
        businessMembers: {
          select: {
            role: true,
            business: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: { name?: string; language?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, phone: true, name: true, language: true },
    });
    return user;
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
