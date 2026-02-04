// Opponent Match Service
// Business logic for opponent matching system

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OpponentMatchGateway } from './opponent-match.gateway';
import {
  CreateOpponentMatchDto,
  JoinOpponentMatchDto,
  GetOpponentMatchesQueryDto,
  OpponentMatchResponseDto,
  OpponentMatchListResponseDto,
} from './dto';

@Injectable()
export class OpponentMatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OpponentMatchGateway,
  ) {}

  /**
   * Create a new opponent match request
   */
  async create(
    tenantId: string,
    customerId: string,
    dto: CreateOpponentMatchDto,
  ): Promise<OpponentMatchResponseDto> {
    // Validate date is in the future
    const requestedDateTime = new Date(`${dto.requestedDate}T${dto.requestedTime}`);
    if (requestedDateTime <= new Date()) {
      throw new BadRequestException('Requested date and time must be in the future');
    }

    // Set expiration: 24 hours from now or when match time passes, whichever comes first
    const expiresIn24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiresAt = requestedDateTime < expiresIn24Hours ? requestedDateTime : expiresIn24Hours;

    // Create opponent match
    const opponentMatch = await this.prisma.opponentMatch.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        customerId,
        requestedDate: new Date(dto.requestedDate),
        requestedTime: dto.requestedTime,
        courtId: dto.courtId,
        sportType: dto.sportType as any,
        playersNeeded: dto.playersNeeded,
        currentPlayers: 1, // Creator counts as first player
        skillLevel: (dto.skillLevel || 'ANY') as any,
        notes: dto.notes,
        status: 'OPEN',
        expiresAt,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
        joinedPlayers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const response = this.mapToResponseDto(opponentMatch);

    // Emit real-time event
    this.gateway.emitMatchCreated(tenantId, response);

    return response;
  }

  /**
   * Get all opponent matches with filters
   */
  async findAll(
    tenantId: string,
    query: GetOpponentMatchesQueryDto,
  ): Promise<OpponentMatchListResponseDto> {
    const where: any = { tenantId };

    if (query.facilityId) {
      where.facilityId = query.facilityId;
    }

    if (query.date) {
      where.requestedDate = new Date(query.date);
    }

    if (query.sportType) {
      where.sportType = query.sportType;
    }

    if (query.skillLevel) {
      where.skillLevel = query.skillLevel;
    }

    if (query.status) {
      where.status = query.status;
    } else {
      // Default: only show OPEN matches
      where.status = 'OPEN';
    }

    // Exclude expired matches unless explicitly requested
    if (!query.status || query.status === 'OPEN') {
      where.expiresAt = {
        gt: new Date(),
      };
    }

    const [matches, total] = await Promise.all([
      this.prisma.opponentMatch.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          facility: {
            select: {
              name: true,
            },
          },
          court: {
            select: {
              name: true,
            },
          },
          joinedPlayers: {
            where: {
              status: 'JOINED',
            },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: [
          { requestedDate: 'asc' },
          { requestedTime: 'asc' },
        ],
      }),
      this.prisma.opponentMatch.count({ where }),
    ]);

    return {
      matches: matches.map((match) => this.mapToResponseDto(match)),
      total,
    };
  }

  /**
   * Get opponent match by ID
   */
  async findOne(tenantId: string, id: string): Promise<OpponentMatchResponseDto> {
    const match = await this.prisma.opponentMatch.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
        joinedPlayers: {
          where: {
            status: 'JOINED',
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Opponent match not found');
    }

    return this.mapToResponseDto(match);
  }

  /**
   * Join an opponent match
   */
  async join(
    tenantId: string,
    customerId: string,
    matchId: string,
    dto: JoinOpponentMatchDto,
  ): Promise<OpponentMatchResponseDto> {
    // Find match
    const match = await this.prisma.opponentMatch.findFirst({
      where: { id: matchId, tenantId },
      include: {
        joinedPlayers: {
          where: {
            status: 'JOINED',
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Opponent match not found');
    }

    // Validate match is OPEN
    if (match.status !== 'OPEN') {
      throw new BadRequestException('Match is not open for joining');
    }

    // Validate not expired
    if (match.expiresAt <= new Date()) {
      throw new BadRequestException('Match has expired');
    }

    // Validate customer is not the creator
    if (match.customerId === customerId) {
      throw new BadRequestException('Cannot join your own match');
    }

    // Check if already joined
    const existingPlayer = await this.prisma.opponentMatchPlayer.findFirst({
      where: {
        opponentMatchId: matchId,
        customerId,
        status: 'JOINED',
      },
    });

    if (existingPlayer) {
      throw new ConflictException('Already joined this match');
    }

    // Check if match is full
    const spotsRemaining = match.playersNeeded - match.currentPlayers;
    if (spotsRemaining <= 0) {
      throw new BadRequestException('Match is already full');
    }

    // Use transaction to join match
    const updatedMatch = await this.prisma.$transaction(async (tx) => {
      // Add player
      await tx.opponentMatchPlayer.create({
        data: {
          tenantId,
          opponentMatchId: matchId,
          customerId,
          notes: dto.notes,
          status: 'JOINED',
        },
      });

      // Update current players count
      const newCurrentPlayers = match.currentPlayers + 1;
      const newStatus = newCurrentPlayers >= match.playersNeeded ? 'MATCHED' : 'OPEN';

      return tx.opponentMatch.update({
        where: { id: matchId },
        data: {
          currentPlayers: newCurrentPlayers,
          status: newStatus,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          facility: {
            select: {
              name: true,
            },
          },
          court: {
            select: {
              name: true,
            },
          },
          joinedPlayers: {
            where: {
              status: 'JOINED',
            },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
    });

    const response = this.mapToResponseDto(updatedMatch);

    // Emit real-time event
    this.gateway.emitPlayerJoined(tenantId, response);

    return response;
  }

  /**
   * Leave an opponent match
   */
  async leave(
    tenantId: string,
    customerId: string,
    matchId: string,
  ): Promise<OpponentMatchResponseDto> {
    // Find player in match
    const player = await this.prisma.opponentMatchPlayer.findFirst({
      where: {
        opponentMatchId: matchId,
        customerId,
        status: 'JOINED',
      },
      include: {
        opponentMatch: true,
      },
    });

    if (!player) {
      throw new NotFoundException('Not a member of this match');
    }

    // Validate match is not MATCHED
    if (player.opponentMatch.status === 'MATCHED') {
      throw new BadRequestException('Cannot leave a completed match');
    }

    // Use transaction to leave match
    const updatedMatch = await this.prisma.$transaction(async (tx) => {
      // Update player status
      await tx.opponentMatchPlayer.update({
        where: { id: player.id },
        data: {
          status: 'LEFT',
          leftAt: new Date(),
        },
      });

      // Decrease current players count
      return tx.opponentMatch.update({
        where: { id: matchId },
        data: {
          currentPlayers: {
            decrement: 1,
          },
          status: 'OPEN', // Reopen if it was matched
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          facility: {
            select: {
              name: true,
            },
          },
          court: {
            select: {
              name: true,
            },
          },
          joinedPlayers: {
            where: {
              status: 'JOINED',
            },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
    });

    const response = this.mapToResponseDto(updatedMatch);

    // Emit real-time event
    this.gateway.emitPlayerLeft(tenantId, response);

    return response;
  }

  /**
   * Cancel an opponent match (creator only)
   */
  async cancel(
    tenantId: string,
    customerId: string,
    matchId: string,
  ): Promise<OpponentMatchResponseDto> {
    // Find match
    const match = await this.prisma.opponentMatch.findFirst({
      where: { id: matchId, tenantId, customerId },
    });

    if (!match) {
      throw new NotFoundException('Opponent match not found or you are not the creator');
    }

    // Update status
    const updatedMatch = await this.prisma.opponentMatch.update({
      where: { id: matchId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
        joinedPlayers: {
          where: {
            status: 'JOINED',
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const response = this.mapToResponseDto(updatedMatch);

    // Emit real-time event
    this.gateway.emitMatchCancelled(tenantId, response);

    return response;
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(match: any): OpponentMatchResponseDto {
    const spotsRemaining = match.playersNeeded - match.currentPlayers;

    return {
      id: match.id,
      facilityId: match.facilityId,
      facilityName: match.facility.name,
      customerId: match.customerId,
      customerName: match.customer.name,
      customerPhone: match.customer.phone,
      requestedDate: match.requestedDate.toISOString().split('T')[0],
      requestedTime: match.requestedTime,
      courtId: match.courtId,
      courtName: match.court?.name,
      sportType: match.sportType,
      playersNeeded: match.playersNeeded,
      currentPlayers: match.currentPlayers,
      spotsRemaining,
      skillLevel: match.skillLevel,
      status: match.status,
      notes: match.notes,
      expiresAt: match.expiresAt,
      bookingId: match.bookingId,
      joinedPlayers: match.joinedPlayers.map((player: any) => ({
        id: player.customer.id,
        name: player.customer.name,
        phone: player.customer.phone,
        notes: player.notes,
        joinedAt: player.joinedAt,
      })),
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }
}
