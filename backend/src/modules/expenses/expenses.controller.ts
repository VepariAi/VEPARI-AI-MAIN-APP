import {
  Controller, Get, Post, Body, Param, Query,
  ParseIntPipe, DefaultValuePipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { ExpensesService, CreateExpenseDto, EXPENSE_CATEGORIES } from './expenses.service';
import { AuditService } from '../audit/audit.service';
import { PaymentMethod } from '@prisma/client';

class CreateExpenseBody {
  category!: string;
  amountInPaise!: number;
  description?: string;
  notes?: string;
  paymentMethod?: string;
  date?: string;
}

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async createExpense(
    @Param('businessId') businessId: string,
    @Body() body: CreateExpenseBody,
    @Req() req: { ip?: string; user?: { id: string } },
  ) {
    const category = body.category as typeof EXPENSE_CATEGORIES[number];
    const dto: CreateExpenseDto = {
      businessId,
      category,
      amountInPaise: body.amountInPaise,
    };
    if (body.description !== undefined) dto.description = body.description;
    if (body.notes !== undefined) dto.notes = body.notes;
    if (body.paymentMethod !== undefined) dto.paymentMethod = body.paymentMethod as PaymentMethod;
    if (body.date !== undefined) dto.date = new Date(body.date);
    const expense = await this.expensesService.createExpense(dto);
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'EXPENSE_CREATED',
      resource: 'expense',
      resourceId: expense.id,
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return expense;
  }

  @Get()
  listExpenses(
    @Param('businessId') businessId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.expensesService.listExpenses(businessId, limit, offset);
  }

  @Get('today-total')
  getExpensesTodayTotal(@Param('businessId') businessId: string) {
    return this.expensesService.getExpensesTodayTotal(businessId);
  }

  @Get(':expenseId')
  getExpense(
    @Param('businessId') businessId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.getExpenseById(businessId, expenseId);
  }
}
