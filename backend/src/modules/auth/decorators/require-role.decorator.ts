import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const REQUIRE_ROLE_KEY = 'requireRole';
export const RequireRole = (role: UserRole) => SetMetadata(REQUIRE_ROLE_KEY, role);
