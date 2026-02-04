// Morning Message Service
// Sends daily confirmation messages for today's bookings

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

@Injectable()
export class MorningMessageService {
  private readonly logger = new Logger(MorningMessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_NAMES.OUTGOING_WHATSAPP) private outgoingQueue: Queue,
  ) {}

  /**
   * Cron job that runs every day at 9 AM
   * Sends confirmation messages for today's bookings
   */
  @Cron('0 9 * * *', {
    name: 'morning-confirmations',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async sendMorningConfirmations() {
    this.logger.log('🌅 Starting morning confirmation messages...');

    try {
      // Get all active facilities
      const facilities = await this.prisma.facility.findMany({
        include: {
          tenant: true,
        },
      });

      this.logger.log(`Found ${facilities.length} active facilities`);

      for (const facility of facilities) {
        await this.sendFacilityConfirmations(facility.id, facility.tenantId);
      }

      this.logger.log('✅ Morning confirmation messages completed');
    } catch (error) {
      this.logger.error('❌ Error sending morning confirmations:', error);
    }
  }

  /**
   * Send confirmation messages for a specific facility
   */
  async sendFacilityConfirmations(facilityId: string, tenantId: string) {
    try {
      // Get today's bookings for this facility
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookings = await this.prisma.booking.findMany({
        where: {
          facilityId,
          tenantId,
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['RESERVED', 'CONFIRMED'],
          },
        },
        include: {
          court: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      this.logger.log(
        `Facility ${facilityId}: ${bookings.length} bookings for today`,
      );

      for (const booking of bookings) {
        await this.sendConfirmationMessage(booking, facilityId);
      }
    } catch (error) {
      this.logger.error(
        `Error sending confirmations for facility ${facilityId}:`,
        error,
      );
    }
  }

  /**
   * Send individual confirmation message
   */
  private async sendConfirmationMessage(booking: any, facilityId: string) {
    try {
      // Check if already sent today
      const cacheKey = `morning-confirmation:${booking.id}:${new Date().toDateString()}`;
      const alreadySent = await this.redis.get(cacheKey);

      if (alreadySent) {
        this.logger.debug(
          `Already sent confirmation for booking ${booking.id}`,
        );
        return;
      }

      // Generate confirmation message in Rioplatense Spanish
      const message = this.generateConfirmationMessage(booking);

      // Queue message for sending
      await this.outgoingQueue.add(
        'send-whatsapp-message',
        {
          facilityId,
          to: booking.customerPhone,
          message,
          bookingId: booking.id,
          messageType: 'MORNING_CONFIRMATION',
        },
        {
          priority: 2, // High priority
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      // Mark as sent (cache for 24 hours)
      await this.redis.set(cacheKey, 'sent', 86400);

      this.logger.log(
        `Queued morning confirmation for booking ${booking.id} to ${booking.customerPhone}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending confirmation for booking ${booking.id}:`,
        error,
      );
    }
  }

  /**
   * Generate confirmation message in Rioplatense Spanish
   */
  private generateConfirmationMessage(booking: any): string {
    const customerName = booking.customerName.split(' ')[0]; // First name only
    const time = booking.startTime; // Format: "14:00"
    const courtName = booking.court.name;

    return `¡Hola ${customerName}! 🎾

Te recordamos que hoy tenés reservada la ${courtName} a las ${time}hs.

¿Venís? Respondé:
• SI para confirmar
• NO si no podés venir

Gracias! 💚`;
  }

  /**
   * Process customer response to confirmation
   */
  async processConfirmationResponse(
    bookingId: string,
    response: string,
  ): Promise<{ action: string; message: string }> {
    const normalizedResponse = response.trim().toUpperCase();

    if (normalizedResponse === 'SI' || normalizedResponse === 'SÍ') {
      // Mark as confirmed
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      return {
        action: 'CONFIRMED',
        message: '¡Perfecto! Tu reserva está confirmada. Te esperamos! 😊',
      };
    } else if (normalizedResponse === 'NO') {
      return {
        action: 'DECLINED',
        message:
          'Entendido. ¿Querés cancelar o reprogramar la reserva? Respondé CANCELAR o REPROGRAMAR.',
      };
    } else {
      return {
        action: 'UNCLEAR',
        message:
          'No entendí tu respuesta. Por favor respondé SI si venís o NO si no podés venir.',
      };
    }
  }

  /**
   * Manual trigger for testing (can be called from controller)
   */
  async triggerManualConfirmations(facilityId: string, tenantId: string) {
    this.logger.log(`Manual trigger for facility ${facilityId}`);
    await this.sendFacilityConfirmations(facilityId, tenantId);
    return { success: true, message: 'Confirmations sent' };
  }
}
