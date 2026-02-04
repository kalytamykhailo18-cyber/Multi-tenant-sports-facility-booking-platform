// Waiting List Service
// Manages waiting list for fully booked time slots

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { WaitingListStatus } from '@prisma/client';

@Injectable()
export class WaitingListService {
  private readonly logger = new Logger(WaitingListService.name);
  private readonly NOTIFICATION_EXPIRY_MINUTES = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_NAMES.OUTGOING_WHATSAPP) private outgoingQueue: Queue,
  ) {}

  /**
   * Add customer to waiting list for a specific time slot
   */
  async addToWaitingList(
    tenantId: string,
    facilityId: string,
    customerId: string,
    requestedDate: Date,
    requestedTime: string,
    courtId?: string,
  ) {
    try {
      // Check if customer already in waiting list for this slot
      const existing = await this.prisma.waitingList.findFirst({
        where: {
          tenantId,
          facilityId,
          customerId,
          requestedDate,
          requestedTime,
          courtId: courtId || undefined,
          status: {
            in: ['WAITING', 'NOTIFIED'],
          },
        },
      });

      if (existing) {
        this.logger.log(
          `Customer ${customerId} already in waiting list for this slot`,
        );
        return existing;
      }

      // Add to waiting list
      const waitingListEntry = await this.prisma.waitingList.create({
        data: {
          tenantId,
          facilityId,
          customerId,
          requestedDate,
          requestedTime,
          courtId,
          status: WaitingListStatus.WAITING,
        },
        include: {
          court: true,
        },
      });

      this.logger.log(
        `Added customer ${customerId} to waiting list (position: ${waitingListEntry.position})`,
      );

      // Send confirmation message
      await this.sendWaitingListConfirmation(waitingListEntry);

      return waitingListEntry;
    } catch (error) {
      this.logger.error('Error adding to waiting list:', error);
      throw error;
    }
  }

  /**
   * Process cancellation - notify next person in waiting list
   */
  async processCancellation(
    tenantId: string,
    facilityId: string,
    date: Date,
    time: string,
    courtId: string,
  ) {
    try {
      // Find next person in waiting list
      const nextInLine = await this.prisma.waitingList.findFirst({
        where: {
          tenantId,
          facilityId,
          requestedDate: date,
          requestedTime: time,
          courtId,
          status: WaitingListStatus.WAITING,
        },
        orderBy: {
          position: 'asc',
        },
        include: {
          court: true,
          facility: true,
        },
      });

      if (!nextInLine) {
        this.logger.log('No one in waiting list for this slot');
        return null;
      }

      // Calculate expiry time (15 minutes from now)
      const expiresAt = new Date(Date.now() + this.NOTIFICATION_EXPIRY_MINUTES * 60 * 1000);

      // Update status to NOTIFIED
      const updated = await this.prisma.waitingList.update({
        where: { id: nextInLine.id },
        data: {
          status: WaitingListStatus.NOTIFIED,
          notifiedAt: new Date(),
          expiresAt,
        },
        include: {
          court: true,
          facility: true,
        },
      });

      // Send notification
      await this.sendAvailabilityNotification(updated);

      this.logger.log(`Notified customer ${updated.customerId} about available slot`);

      return updated;
    } catch (error) {
      this.logger.error('Error processing cancellation:', error);
      throw error;
    }
  }

  /**
   * Cron job to check expired notifications (runs every 5 minutes)
   */
  @Cron('*/5 * * * *', {
    name: 'check-expired-waitlist-notifications',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async checkExpiredNotifications() {
    this.logger.log('⏰ Checking for expired waiting list notifications...');

    try {
      const now = new Date();

      // Find all notified entries that have expired
      const expiredEntries = await this.prisma.waitingList.findMany({
        where: {
          status: WaitingListStatus.NOTIFIED,
          expiresAt: {
            lte: now,
          },
        },
      });

      this.logger.log(`Found ${expiredEntries.length} expired notifications`);

      for (const entry of expiredEntries) {
        // Mark as expired
        await this.prisma.waitingList.update({
          where: { id: entry.id },
          data: {
            status: WaitingListStatus.EXPIRED,
          },
        });

        // Try next person in line
        await this.processCancellation(
          entry.tenantId,
          entry.facilityId,
          entry.requestedDate,
          entry.requestedTime,
          entry.courtId!,
        );
      }
    } catch (error) {
      this.logger.error('❌ Error checking expired notifications:', error);
    }
  }

  /**
   * Customer responds to availability notification
   */
  async respondToNotification(
    waitingListId: string,
    accepted: boolean,
  ): Promise<{ success: boolean; bookingId?: string; message: string }> {
    try {
      const entry = await this.prisma.waitingList.findUnique({
        where: { id: waitingListId },
        include: {
          court: true,
          facility: true,
        },
      });

      if (!entry) {
        throw new Error('Waiting list entry not found');
      }

      if (entry.status !== WaitingListStatus.NOTIFIED) {
        return {
          success: false,
          message: 'Esta notificación ya no está activa.',
        };
      }

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        await this.prisma.waitingList.update({
          where: { id: waitingListId },
          data: { status: WaitingListStatus.EXPIRED },
        });

        return {
          success: false,
          message: 'Lo sentimos, el tiempo para responder expiró. El turno se ofreció a otra persona.',
        };
      }

      if (accepted) {
        // Create booking
        const booking = await this.createBookingFromWaitingList(entry);

        // Update waiting list entry
        await this.prisma.waitingList.update({
          where: { id: waitingListId },
          data: {
            status: WaitingListStatus.BOOKED,
            bookingId: booking.id,
            respondedAt: new Date(),
          },
        });

        return {
          success: true,
          bookingId: booking.id,
          message: '¡Perfecto! Tu reserva está confirmada. Te esperamos! 😊',
        };
      } else {
        // Customer declined
        await this.prisma.waitingList.update({
          where: { id: waitingListId },
          data: {
            status: WaitingListStatus.CANCELLED,
            respondedAt: new Date(),
            cancellationNote: 'Customer declined offer',
          },
        });

        // Try next person in line
        await this.processCancellation(
          entry.tenantId,
          entry.facilityId,
          entry.requestedDate,
          entry.requestedTime,
          entry.courtId!,
        );

        return {
          success: true,
          message: 'Entendido. Quedás fuera de la lista de espera para este horario.',
        };
      }
    } catch (error) {
      this.logger.error('Error responding to notification:', error);
      throw error;
    }
  }

  /**
   * Create booking from waiting list entry
   */
  private async createBookingFromWaitingList(entry: any) {
    // Get default duration and price from facility/court
    const court = await this.prisma.court.findUnique({
      where: { id: entry.courtId },
      include: { facility: true },
    });

    if (!court) {
      throw new Error('Court not found');
    }

    // Get customer details
    const customer = await this.prisma.customer.findUnique({
      where: { id: entry.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate end time
    const [hours, minutes] = entry.requestedTime.split(':').map(Number);
    const startDate = new Date(entry.requestedDate);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 60 minutes
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        tenantId: entry.tenantId,
        facilityId: entry.facilityId,
        courtId: entry.courtId,
        date: entry.requestedDate,
        startTime: entry.requestedTime,
        endTime: endTime,
        durationMinutes: 60, // Default 1 hour
        totalPrice: Number(court.basePricePerHour),
        depositAmount: Number(court.basePricePerHour) * (court.facility.depositPercentage / 100),
        balanceAmount: 0,
        status: 'RESERVED',
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
      },
    });

    return booking;
  }

  /**
   * Send confirmation that customer was added to waiting list
   */
  private async sendWaitingListConfirmation(entry: any) {
    // Get customer details
    const customer = await this.prisma.customer.findUnique({
      where: { id: entry.customerId },
    });

    if (!customer) {
      this.logger.error(`Customer ${entry.customerId} not found for waiting list entry`);
      return;
    }

    const message = this.generateWaitingListMessage(entry, customer);

    await this.outgoingQueue.add(
      'send-whatsapp-message',
      {
        facilityId: entry.facilityId,
        to: customer.phone,
        message,
        waitingListId: entry.id,
        messageType: 'WAITING_LIST_CONFIRMATION',
      },
      {
        priority: 2,
        attempts: 3,
      },
    );
  }

  /**
   * Send notification that a slot is available
   */
  private async sendAvailabilityNotification(entry: any) {
    // Get customer details
    const customer = await this.prisma.customer.findUnique({
      where: { id: entry.customerId },
    });

    if (!customer) {
      this.logger.error(`Customer ${entry.customerId} not found for waiting list entry`);
      return;
    }

    const message = this.generateAvailabilityMessage(entry, customer);

    await this.outgoingQueue.add(
      'send-whatsapp-message',
      {
        facilityId: entry.facilityId,
        to: customer.phone,
        message,
        waitingListId: entry.id,
        messageType: 'SLOT_AVAILABLE',
      },
      {
        priority: 3, // Very high priority
        attempts: 3,
      },
    );
  }

  /**
   * Generate waiting list confirmation message
   */
  private generateWaitingListMessage(entry: any, customer: any): string {
    const customerName = customer.name.split(' ')[0];
    const date = new Date(entry.requestedDate).toLocaleDateString('es-AR');
    const time = entry.requestedTime;
    const courtName = entry.court?.name || 'cancha';

    return `Hola ${customerName}! 👋

El horario que pediste (${date} a las ${time}hs en ${courtName}) está completo.

Te agregamos a la lista de espera (posición ${entry.position}).

Si se libera, te avisamos al toque! ⚡`;
  }

  /**
   * Generate availability notification message
   */
  private generateAvailabilityMessage(entry: any, customer: any): string {
    const customerName = customer.name.split(' ')[0];
    const date = new Date(entry.requestedDate).toLocaleDateString('es-AR');
    const time = entry.requestedTime;
    const courtName = entry.court?.name || 'cancha';

    return `🎉 ¡Buenas noticias ${customerName}!

Se liberó un turno para ${date} a las ${time}hs en ${courtName}.

¿Lo querés? Respondé rápido:
• SI para reservar
• NO si no te sirve

⏰ Tenés ${this.NOTIFICATION_EXPIRY_MINUTES} minutos para responder.`;
  }

  /**
   * Remove customer from waiting list
   */
  async removeFromWaitingList(waitingListId: string, reason?: string) {
    await this.prisma.waitingList.update({
      where: { id: waitingListId },
      data: {
        status: WaitingListStatus.CANCELLED,
        cancellationNote: reason || 'Removed by user',
      },
    });

    this.logger.log(`Removed entry ${waitingListId} from waiting list`);
  }

  /**
   * Get customer's waiting list entries
   */
  async getCustomerWaitingList(tenantId: string, customerId: string) {
    return this.prisma.waitingList.findMany({
      where: {
        tenantId,
        customerId,
        status: {
          in: ['WAITING', 'NOTIFIED'],
        },
      },
      include: {
        court: true,
        facility: true,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  /**
   * Get waiting list for a specific time slot
   */
  async getSlotWaitingList(
    tenantId: string,
    facilityId: string,
    date: Date,
    time: string,
    courtId?: string,
  ) {
    return this.prisma.waitingList.findMany({
      where: {
        tenantId,
        facilityId,
        requestedDate: date,
        requestedTime: time,
        courtId: courtId || undefined,
        status: WaitingListStatus.WAITING,
      },
      include: {
        court: true,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }
}
