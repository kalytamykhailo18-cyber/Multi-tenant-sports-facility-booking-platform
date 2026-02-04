// Reports Export Service
// Generate PDF and Excel exports for financial reports

import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import type {
  RevenueReportDto,
  CashFlowDto,
  ClientDebtsResponseDto,
  RevenueProjectionDto,
  PaymentHistoryResponseDto,
} from './dto/report-response.dto';

@Injectable()
export class ReportsExportService {
  private readonly logger = new Logger(ReportsExportService.name);

  /**
   * Generate Excel workbook for revenue report
   */
  async generateRevenueExcel(
    data: RevenueReportDto,
    facilityName: string,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Ingresos');

    // Set column widths
    worksheet.columns = [
      { width: 30 },
      { width: 20 },
    ];

    // Title
    worksheet.addRow(['Reporte de Ingresos']);
    worksheet.addRow(['Instalación:', facilityName]);
    worksheet.addRow(['Período:', data.period]);
    worksheet.addRow([]);

    // Style title
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('A3').font = { bold: true };

    // Revenue breakdown
    worksheet.addRow(['Resumen de Ingresos']);
    worksheet.getCell('A5').font = { bold: true, size: 14 };
    worksheet.addRow([]);

    const revenueData = [
      ['Señas cobradas', `$${data.deposits.toLocaleString()}`],
      ['Saldos cobrados', `$${data.balancePayments.toLocaleString()}`],
      ['Ingresos totales', `$${data.totalRevenue.toLocaleString()}`],
      ['Reembolsos', `-$${data.refunds.toLocaleString()}`],
      ['Ingresos netos', `$${data.netRevenue.toLocaleString()}`],
    ];

    revenueData.forEach((row) => {
      const addedRow = worksheet.addRow(row);
      addedRow.getCell(1).font = { bold: true };
      if (row[0] === 'Ingresos netos') {
        addedRow.getCell(1).font = { bold: true, size: 12 };
        addedRow.getCell(2).font = { bold: true, size: 12 };
      }
    });

    worksheet.addRow([]);

    // Booking statistics
    worksheet.addRow(['Estadísticas de Reservas']);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
    worksheet.addRow([]);

    const statsData = [
      ['Total de reservas', data.bookingCount],
      ['Sesiones completadas', data.completedSessions],
      ['Cancelaciones', data.cancellations],
    ];

    statsData.forEach((row) => {
      const addedRow = worksheet.addRow(row);
      addedRow.getCell(1).font = { bold: true };
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generate Excel workbook for cash flow report
   */
  async generateCashFlowExcel(
    data: CashFlowDto,
    facilityName: string,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Flujo de Caja');

    worksheet.columns = [
      { width: 30 },
      { width: 20 },
    ];

    // Title
    worksheet.addRow(['Reporte de Flujo de Caja']);
    worksheet.addRow(['Instalación:', facilityName]);
    worksheet.addRow(['Período:', `${data.dateRange.startDate} a ${data.dateRange.endDate}`]);
    worksheet.addRow([]);

    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('A3').font = { bold: true };

    // Money In
    worksheet.addRow(['Dinero Entrante']);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, color: { argb: 'FF008000' } };
    worksheet.addRow([]);

    const moneyInData = [
      ['Señas', `$${data.moneyIn.deposits.toLocaleString()}`],
      ['Saldos', `$${data.moneyIn.balancePayments.toLocaleString()}`],
      ['Total Entrante', `$${data.moneyIn.total.toLocaleString()}`],
    ];

    moneyInData.forEach((row) => {
      const addedRow = worksheet.addRow(row);
      addedRow.getCell(1).font = { bold: true };
      if (row[0] === 'Total Entrante') {
        addedRow.getCell(2).font = { bold: true };
      }
    });

    worksheet.addRow([]);

    // Money Out
    worksheet.addRow(['Dinero Saliente']);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, color: { argb: 'FFFF0000' } };
    worksheet.addRow([]);

    const moneyOutData = [
      ['Reembolsos', `$${data.moneyOut.refunds.toLocaleString()}`],
      ['Total Saliente', `$${data.moneyOut.total.toLocaleString()}`],
    ];

    moneyOutData.forEach((row) => {
      const addedRow = worksheet.addRow(row);
      addedRow.getCell(1).font = { bold: true };
      if (row[0] === 'Total Saliente') {
        addedRow.getCell(2).font = { bold: true };
      }
    });

    worksheet.addRow([]);

    // Net Cash Flow
    worksheet.addRow(['Flujo de Caja Neto', `$${data.netCashFlow.toLocaleString()}`]);
    const netRow = worksheet.getRow(worksheet.rowCount);
    netRow.getCell(1).font = { bold: true, size: 14 };
    netRow.getCell(2).font = { bold: true, size: 14 };

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generate Excel workbook for client debts
   */
  async generateClientDebtsExcel(
    data: ClientDebtsResponseDto,
    facilityName: string,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deudas de Clientes');

    // Title
    worksheet.addRow(['Reporte de Deudas de Clientes']);
    worksheet.addRow(['Instalación:', facilityName]);
    worksheet.addRow(['Fecha:', new Date().toLocaleDateString('es-AR')]);
    worksheet.addRow([]);

    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('A3').font = { bold: true };

    // Summary
    worksheet.addRow(['Resumen']);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
    worksheet.addRow(['Total adeudado:', `$${data.totalDebt.toLocaleString()}`]);
    worksheet.addRow(['Clientes con deuda:', data.clientCount]);
    worksheet.addRow([]);

    // Table header
    worksheet.addRow(['Cliente', 'Teléfono', 'Monto Adeudado', 'Reservas Pendientes', 'Fecha Más Antigua']);
    const headerRow = worksheet.getRow(worksheet.rowCount);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Set column widths
    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    // Data rows
    data.debts.forEach((debt) => {
      worksheet.addRow([
        debt.customerName,
        debt.customerPhone,
        `$${debt.debtAmount.toLocaleString()}`,
        debt.pendingBookings,
        new Date(debt.oldestBookingDate).toLocaleDateString('es-AR'),
      ]);
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generate Excel workbook for payment history
   */
  async generatePaymentHistoryExcel(
    data: PaymentHistoryResponseDto,
    facilityName: string,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Pagos');

    // Title
    worksheet.addRow(['Historial de Pagos']);
    worksheet.addRow(['Instalación:', facilityName]);
    worksheet.addRow(['Fecha:', new Date().toLocaleDateString('es-AR')]);
    worksheet.addRow([]);

    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('A3').font = { bold: true };

    // Table header
    worksheet.addRow(['Fecha', 'Cliente', 'Tipo', 'Monto', 'Estado', 'Pagado en']);
    const headerRow = worksheet.getRow(worksheet.rowCount);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    // Data rows
    data.payments.forEach((payment) => {
      const row = worksheet.addRow([
        payment.date,
        payment.customerName,
        payment.type,
        `$${payment.amount.toLocaleString()}`,
        payment.status,
        payment.paidAt ? new Date(payment.paidAt).toLocaleString('es-AR') : 'N/A',
      ]);

      // Color code by type
      if (payment.type === 'REFUND') {
        row.getCell(4).font = { color: { argb: 'FFFF0000' } };
      }
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generate PDF for revenue report
   */
  async generateRevenuePDF(
    data: RevenueReportDto,
    facilityName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('Reporte de Ingresos', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Instalación: ${facilityName}`);
      doc.text(`Período: ${data.period}`);
      doc.moveDown(2);

      // Revenue breakdown
      doc.fontSize(16).text('Resumen de Ingresos');
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Señas cobradas: $${data.deposits.toLocaleString()}`);
      doc.text(`Saldos cobrados: $${data.balancePayments.toLocaleString()}`);
      doc.text(`Ingresos totales: $${data.totalRevenue.toLocaleString()}`);
      doc.text(`Reembolsos: -$${data.refunds.toLocaleString()}`);
      doc.moveDown();
      doc.fontSize(14).text(`Ingresos netos: $${data.netRevenue.toLocaleString()}`, { underline: true });
      doc.moveDown(2);

      // Statistics
      doc.fontSize(16).text('Estadísticas de Reservas');
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Total de reservas: ${data.bookingCount}`);
      doc.text(`Sesiones completadas: ${data.completedSessions}`);
      doc.text(`Cancelaciones: ${data.cancellations}`);
      doc.moveDown();

      const cancellationRate = data.bookingCount > 0
        ? ((data.cancellations / data.bookingCount) * 100).toFixed(1)
        : '0.0';
      doc.text(`Tasa de cancelación: ${cancellationRate}%`);

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).text(`Generado el ${new Date().toLocaleString('es-AR')}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate PDF for cash flow report
   */
  async generateCashFlowPDF(
    data: CashFlowDto,
    facilityName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('Reporte de Flujo de Caja', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Instalación: ${facilityName}`);
      doc.text(`Período: ${data.dateRange.startDate} a ${data.dateRange.endDate}`);
      doc.moveDown(2);

      // Money In
      doc.fontSize(16).fillColor('green').text('Dinero Entrante');
      doc.fillColor('black').moveDown();

      doc.fontSize(12);
      doc.text(`Señas: $${data.moneyIn.deposits.toLocaleString()}`);
      doc.text(`Saldos: $${data.moneyIn.balancePayments.toLocaleString()}`);
      doc.fontSize(14).text(`Total Entrante: $${data.moneyIn.total.toLocaleString()}`, { underline: true });
      doc.moveDown(2);

      // Money Out
      doc.fontSize(16).fillColor('red').text('Dinero Saliente');
      doc.fillColor('black').moveDown();

      doc.fontSize(12);
      doc.text(`Reembolsos: $${data.moneyOut.refunds.toLocaleString()}`);
      doc.fontSize(14).text(`Total Saliente: $${data.moneyOut.total.toLocaleString()}`, { underline: true });
      doc.moveDown(2);

      // Net Cash Flow
      const isPositive = data.netCashFlow >= 0;
      doc.fontSize(18)
        .fillColor(isPositive ? 'green' : 'red')
        .text(`Flujo de Caja Neto: ${isPositive ? '+' : ''}$${data.netCashFlow.toLocaleString()}`, {
          align: 'center',
          underline: true,
        });

      // Footer
      doc.fillColor('black').moveDown(3);
      doc.fontSize(10).text(`Generado el ${new Date().toLocaleString('es-AR')}`, { align: 'center' });

      doc.end();
    });
  }
}
