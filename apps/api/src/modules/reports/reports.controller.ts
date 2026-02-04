// Reports Controller
// REST API endpoints for financial reports

import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
  };
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import {
  DailyRevenueQueryDto,
  WeeklyRevenueQueryDto,
  MonthlyRevenueQueryDto,
  CashFlowQueryDto,
} from './dto/report-query.dto';
import {
  RevenueReportDto,
  CashFlowDto,
  ClientDebtsResponseDto,
  RevenueProjectionDto,
  PaymentHistoryResponseDto,
} from './dto/report-response.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ReportsExportService,
  ) {}

  /**
   * Get daily revenue report
   */
  @Get('revenue/daily')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get daily revenue report' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', example: '2026-02-04' })
  @ApiResponse({
    status: 200,
    description: 'Daily revenue report',
    type: RevenueReportDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getDailyRevenue(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('date') dateStr: string,
  ): Promise<RevenueReportDto> {
    const date = new Date(dateStr);
    return this.reportsService.getDailyRevenue(req.user.tenantId, facilityId, date);
  }

  /**
   * Get weekly revenue report
   */
  @Get('revenue/weekly')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get weekly revenue report' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'weekStart', description: 'Week start date (YYYY-MM-DD)', example: '2026-02-03' })
  @ApiResponse({
    status: 200,
    description: 'Weekly revenue report',
    type: RevenueReportDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getWeeklyRevenue(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('weekStart') weekStartStr: string,
  ): Promise<RevenueReportDto> {
    const weekStart = new Date(weekStartStr);
    return this.reportsService.getWeeklyRevenue(req.user.tenantId, facilityId, weekStart);
  }

  /**
   * Get monthly revenue report
   */
  @Get('revenue/monthly')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get monthly revenue report' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'month', description: 'Month (YYYY-MM)', example: '2026-02' })
  @ApiResponse({
    status: 200,
    description: 'Monthly revenue report',
    type: RevenueReportDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getMonthlyRevenue(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('month') month: string,
  ): Promise<RevenueReportDto> {
    return this.reportsService.getMonthlyRevenue(req.user.tenantId, facilityId, month);
  }

  /**
   * Get cash flow report
   */
  @Get('cash-flow')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Cash flow report',
    type: CashFlowDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getCashFlow(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ): Promise<CashFlowDto> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    return this.reportsService.getCashFlow(req.user.tenantId, facilityId, startDate, endDate);
  }

  /**
   * Get client debts report
   */
  @Get('client-debts')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get clients with outstanding debts' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Client debts report',
    type: ClientDebtsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getClientDebts(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
  ): Promise<ClientDebtsResponseDto> {
    return this.reportsService.getClientDebts(req.user.tenantId, facilityId);
  }

  /**
   * Get revenue projections
   */
  @Get('projections')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue projections from future bookings' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'daysAhead', description: 'Days ahead to project', required: false, example: 30 })
  @ApiResponse({
    status: 200,
    description: 'Revenue projections',
    type: RevenueProjectionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getRevenueProjections(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('daysAhead') daysAhead?: number,
  ): Promise<RevenueProjectionDto> {
    return this.reportsService.getRevenueProjections(
      req.user.tenantId,
      facilityId,
      daysAhead ? parseInt(daysAhead.toString(), 10) : 30,
    );
  }

  /**
   * Get payment history
   */
  @Get('payment-history')
  @Roles('OWNER', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment history with pagination' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', description: 'Page size', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Payment history',
    type: PaymentHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner only' })
  async getPaymentHistory(
    @Req() req: RequestWithUser,
    @Query('facilityId') facilityId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<PaymentHistoryResponseDto> {
    return this.reportsService.getPaymentHistory(
      req.user.tenantId,
      facilityId,
      page ? parseInt(page.toString(), 10) : 1,
      pageSize ? parseInt(pageSize.toString(), 10) : 50,
    );
  }

  /**
   * Export revenue report to Excel
   */
  @Get('export/revenue/excel')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export revenue report to Excel' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'month', description: 'Month (YYYY-MM)', required: false })
  @ApiQuery({ name: 'period', description: 'Period type: daily, weekly, monthly', example: 'monthly' })
  @ApiResponse({ status: 200, description: 'Excel file' })
  async exportRevenueExcel(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly',
    @Query('date') date?: string,
    @Query('month') month?: string,
  ): Promise<void> {
    let report: RevenueReportDto;

    if (period === 'daily' && date) {
      report = await this.reportsService.getDailyRevenue(req.user.tenantId, facilityId, new Date(date));
    } else if (period === 'weekly' && date) {
      report = await this.reportsService.getWeeklyRevenue(req.user.tenantId, facilityId, new Date(date));
    } else if (period === 'monthly' && month) {
      report = await this.reportsService.getMonthlyRevenue(req.user.tenantId, facilityId, month);
    } else {
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      report = await this.reportsService.getMonthlyRevenue(req.user.tenantId, facilityId, currentMonth);
    }

    const buffer = await this.exportService.generateRevenueExcel(report, 'Instalación'); // TODO: Get facility name

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-ingresos-${report.period}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export revenue report to PDF
   */
  @Get('export/revenue/pdf')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export revenue report to PDF' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'month', description: 'Month (YYYY-MM)', required: false })
  @ApiQuery({ name: 'period', description: 'Period type: daily, weekly, monthly', example: 'monthly' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async exportRevenuePDF(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly',
    @Query('date') date?: string,
    @Query('month') month?: string,
  ): Promise<void> {
    let report: RevenueReportDto;

    if (period === 'daily' && date) {
      report = await this.reportsService.getDailyRevenue(req.user.tenantId, facilityId, new Date(date));
    } else if (period === 'weekly' && date) {
      report = await this.reportsService.getWeeklyRevenue(req.user.tenantId, facilityId, new Date(date));
    } else if (period === 'monthly' && month) {
      report = await this.reportsService.getMonthlyRevenue(req.user.tenantId, facilityId, month);
    } else {
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      report = await this.reportsService.getMonthlyRevenue(req.user.tenantId, facilityId, currentMonth);
    }

    const buffer = await this.exportService.generateRevenuePDF(report, 'Instalación'); // TODO: Get facility name

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-ingresos-${report.period}.pdf`);
    res.send(buffer);
  }

  /**
   * Export cash flow report to Excel
   */
  @Get('export/cashflow/excel')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export cash flow report to Excel' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Excel file' })
  async exportCashFlowExcel(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<void> {
    const report = await this.reportsService.getCashFlow(
      req.user.tenantId,
      facilityId,
      new Date(startDate),
      new Date(endDate),
    );

    const buffer = await this.exportService.generateCashFlowExcel(report, 'Instalación');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=flujo-caja-${startDate}-${endDate}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export cash flow report to PDF
   */
  @Get('export/cashflow/pdf')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export cash flow report to PDF' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async exportCashFlowPDF(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<void> {
    const report = await this.reportsService.getCashFlow(
      req.user.tenantId,
      facilityId,
      new Date(startDate),
      new Date(endDate),
    );

    const buffer = await this.exportService.generateCashFlowPDF(report, 'Instalación');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=flujo-caja-${startDate}-${endDate}.pdf`);
    res.send(buffer);
  }

  /**
   * Export client debts to Excel
   */
  @Get('export/debts/excel')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export client debts to Excel' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({ status: 200, description: 'Excel file' })
  async exportDebtsExcel(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
  ): Promise<void> {
    const report = await this.reportsService.getClientDebts(req.user.tenantId, facilityId);

    const buffer = await this.exportService.generateClientDebtsExcel(report, 'Instalación');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=deudas-clientes-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export payment history to Excel
   */
  @Get('export/payments/excel')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export payment history to Excel' })
  @ApiQuery({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', description: 'Page size', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Excel file' })
  async exportPaymentsExcel(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('facilityId') facilityId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<void> {
    const report = await this.reportsService.getPaymentHistory(
      req.user.tenantId,
      facilityId,
      page ? parseInt(page.toString(), 10) : 1,
      pageSize ? parseInt(pageSize.toString(), 10) : 1000, // Export more records
    );

    const buffer = await this.exportService.generatePaymentHistoryExcel(report, 'Instalación');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=historial-pagos-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  }
}
