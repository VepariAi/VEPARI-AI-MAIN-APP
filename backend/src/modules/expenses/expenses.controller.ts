import {
  Controller, Get, Post, Body, Param, Query,
  ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpensesService, CreateExpenseDto, EXPENSE_CATEGORIES } from './expenses.service';
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
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  createExpense(
    @Param('businessId') businessId: string,
    @Body() body: CreateExpenseBody,
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
    return this.expensesService.createExpense(dto);
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
}
