// Reminder Service
// Sends follow-up reminders if no response to morning confirmation

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_NAMES.OUTGOING_WHATSAPP) private outgoingQueue: Queue,
  ) {}

  /**
   * Cron job that runs every hour to check for reminders needed
   * Sends follow-up if no response 5 hours before booking
   */
  @Cron('0 * * * *', {
    name: 'check-reminders',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async checkReminders() {
    this.logger.log('⏰ Checking for reminders needed...');

    try {
      // Get bookings that need reminders (5 hours before)
      const now = new Date();
      const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);

      // Get bookings in the next 5-6 hour window that haven't been confirmed
      const bookingsNeedingReminder = await this.prisma.booking.findMany({
        where: {
          date: {
            gte: now,
            lt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
          },
          status: 'RESERVED', // Not confirmed yet
        },
        include: {
          court: true,
          facility: true,
        },
      });

      this.logger.log(
        `Found ${bookingsNeedingReminder.length} bookings needing reminders`,
      );

      for (const booking of bookingsNeedingReminder) {
        await this.sendReminderIfNeeded(booking);
      }
    } catch (error) {
      this.logger.error('❌ Error checking reminders:', error);
    }
  }

  /**
   * Send reminder if needed (checks if already sent)
   */
  private async sendReminderIfNeeded(booking: any) {
    try {
      // Check if reminder already sent
      const reminderKey = `reminder:${booking.id}:${new Date().toDateString()}`;
      const reminderSent = await this.redis.get(reminderKey);

      if (reminderSent) {
        return;
      }

      // Check if booking time is exactly 5 hours away (within 30min window)
      const now = new Date();
      const bookingDateTime = this.getBookingDateTime(booking);
      const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send if between 4.5 and 5.5 hours away
      if (hoursUntil < 4.5 || hoursUntil > 5.5) {
        return;
      }

      // Generate reminder message
      const message = this.generateReminderMessage(booking);

      // Queue message
      await this.outgoingQueue.add(
        'send-whatsapp-message',
        {
          facilityId: booking.facilityId,
          to: booking.customerPhone,
          message,
          bookingId: booking.id,
          messageType: 'REMINDER',
        },
        {
          priority: 2,
          attempts: 3,
        },
      );

      // Mark as sent
      await this.redis.set(reminderKey, 'sent', 86400);

      // Alert owner that customer hasn't confirmed
      await this.alertOwner(booking);

      this.logger.log(`Sent reminder for booking ${booking.id}`);
    } catch (error) {
      this.logger.error(
        `Error sending reminder for booking ${booking.id}:`,
        error,
      );
    }
  }

  /**
   * Generate reminder message
   */
  private generateReminderMessage(booking: any): string {
    const customerName = booking.customerName.split(' ')[0];
    const time = booking.startTime;
    const courtName = booking.court.name;

    return `Hola ${customerName},

No recibimos tu confirmación para hoy a las ${time}hs en ${courtName}.

¿Podés confirmar si venís? Respondé SI o NO.

Gracias! 🙏`;
  }

  /**
   * Alert owner that customer hasn't confirmed
   */
  private async alertOwner(booking: any) {
    try {
      const facility = booking.facility;

      if (!facility.ownerWhatsApp) {
        return;
      }

      const message = `⚠️ ALERTA: Sin confirmación

Cliente: ${booking.customerName}
Reserva: Hoy ${booking.startTime}hs - ${booking.court.name}
Estado: SIN CONFIRMAR

Se envió recordatorio. Por favor seguir manualmente si es necesario.`;

      await this.outgoingQueue.add(
        'send-whatsapp-message',
        {
          facilityId: booking.facilityId,
          to: facility.ownerWhatsApp,
          message,
          bookingId: booking.id,
          messageType: 'OWNER_ALERT',
        },
        {
          priority: 3, // Very high priority
          attempts: 3,
        },
      );
    } catch (error) {
      this.logger.error('Error alerting owner:', error);
    }
  }

  /**
   * Helper: Get booking date/time
   */
  private getBookingDateTime(booking: any): Date {
    const date = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualReminder(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: true,
        facility: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    await this.sendReminderIfNeeded(booking);
    return { success: true, message: 'Reminder sent if needed' };
  }
}
