import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(businessId: string) {
    const members = await this.prisma.businessMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map(m => ({
      memberId: m.id,
      userId: m.userId,
      name: m.user.name,
      phone: m.user.phone,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async inviteMember(businessId: string, requesterId: string, phone: string, role: UserRole = UserRole.STAFF) {
    await this.assertOwnerOrManager(businessId, requesterId);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('No Vepari account found for this phone number.');

    const existing = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    });
    if (existing) throw new ConflictException('This user is already a team member.');

    const member = await this.prisma.businessMember.create({
      data: { businessId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    return {
      memberId: member.id,
      userId: member.userId,
      name: member.user.name,
      phone: member.user.phone,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  async updateRole(businessId: string, requesterId: string, memberId: string, role: UserRole) {
    await this.assertOwner(businessId, requesterId);

    const member = await this.prisma.businessMember.findFirst({ where: { id: memberId, businessId } });
    if (!member) throw new NotFoundException('Member not found.');
    if (member.userId === requesterId) throw new ForbiddenException('Cannot change your own role.');

    const updated = await this.prisma.businessMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    return {
      memberId: updated.id,
      userId: updated.userId,
      name: updated.user.name,
      phone: updated.user.phone,
      role: updated.role,
      joinedAt: updated.joinedAt,
    };
  }

  async removeMember(businessId: string, requesterId: string, memberId: string) {
    await this.assertOwnerOrManager(businessId, requesterId);

    const member = await this.prisma.businessMember.findFirst({ where: { id: memberId, businessId } });
    if (!member) throw new NotFoundException('Member not found.');
    if (member.userId === requesterId) throw new ForbiddenException('Cannot remove yourself.');

    const requester = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: requesterId } },
    });
    if (requester?.role === UserRole.MANAGER && member.role !== UserRole.STAFF) {
      throw new ForbiddenException('Managers can only remove staff members.');
    }

    await this.prisma.businessMember.delete({ where: { id: memberId } });
    return { message: 'Member removed.' };
  }

  private async assertOwner(businessId: string, userId: string) {
    const member = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!member || member.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the business owner can perform this action.');
    }
  }

  private async assertOwnerOrManager(businessId: string, userId: string) {
    const member = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!member || member.role === UserRole.STAFF) {
      throw new ForbiddenException('Only owners and managers can perform this action.');
    }
  }
}
