import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';
import { UserRole } from '@prisma/client';

const ROLE_ORDER: Record<UserRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
};

@Injectable()
export class BusinessMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: { id: string };
      params?: { businessId?: string };
      businessMember?: { role: UserRole; memberId: string };
    }>();

    const userId = req.user?.id;
    const businessId = req.params?.businessId;

    if (!userId || !businessId) {
      throw new ForbiddenException('Business membership required.');
    }

    const member = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this business.');
    }

    // Attach for downstream use (e.g. controllers reading role without extra DB call)
    req.businessMember = { role: member.role, memberId: member.id };

    // Check minimum role if @RequireRole() is on the handler or class
    const requiredRole = this.reflector.getAllAndOverride<UserRole | undefined>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRole && ROLE_ORDER[member.role] < ROLE_ORDER[requiredRole]) {
      throw new ForbiddenException(
        `This action requires at least the ${requiredRole} role.`,
      );
    }

    return true;
  }
}
