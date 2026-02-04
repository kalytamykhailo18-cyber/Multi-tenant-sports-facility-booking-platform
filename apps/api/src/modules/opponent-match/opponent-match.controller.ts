// Opponent Match Controller
// REST API endpoints for opponent matching system

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OpponentMatchService } from './opponent-match.service';
import {
  CreateOpponentMatchDto,
  JoinOpponentMatchDto,
  GetOpponentMatchesQueryDto,
  OpponentMatchResponseDto,
  OpponentMatchListResponseDto,
} from './dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

@ApiTags('Opponent Match')
@ApiBearerAuth()
@Controller('opponent-matches')
@UseGuards(JwtAuthGuard)
export class OpponentMatchController {
  constructor(private readonly opponentMatchService: OpponentMatchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create opponent match request' })
  @ApiResponse({
    status: 201,
    description: 'Opponent match created successfully',
    type: OpponentMatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateOpponentMatchDto,
  ): Promise<OpponentMatchResponseDto> {
    // For demo purposes, using userId as customerId
    // In production, you'd need to link dashboard users to customers
    return this.opponentMatchService.create(
      req.user.tenantId,
      req.user.userId, // This should be customerId
      dto,
    );
  }

  @Get()
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all opponent matches' })
  @ApiResponse({
    status: 200,
    description: 'List of opponent matches',
    type: OpponentMatchListResponseDto,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: GetOpponentMatchesQueryDto,
  ): Promise<OpponentMatchListResponseDto> {
    return this.opponentMatchService.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get opponent match by ID' })
  @ApiResponse({
    status: 200,
    description: 'Opponent match details',
    type: OpponentMatchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Opponent match not found',
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<OpponentMatchResponseDto> {
    return this.opponentMatchService.findOne(req.user.tenantId, id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Join an opponent match' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined match',
    type: OpponentMatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot join match (full, expired, or already joined)',
  })
  @ApiResponse({
    status: 404,
    description: 'Opponent match not found',
  })
  async join(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: JoinOpponentMatchDto,
  ): Promise<OpponentMatchResponseDto> {
    return this.opponentMatchService.join(
      req.user.tenantId,
      req.user.userId, // This should be customerId
      id,
      dto,
    );
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Leave an opponent match' })
  @ApiResponse({
    status: 200,
    description: 'Successfully left match',
    type: OpponentMatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot leave match',
  })
  @ApiResponse({
    status: 404,
    description: 'Not a member of this match',
  })
  async leave(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<OpponentMatchResponseDto> {
    return this.opponentMatchService.leave(
      req.user.tenantId,
      req.user.userId, // This should be customerId
      id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel opponent match (creator only)' })
  @ApiResponse({
    status: 200,
    description: 'Match cancelled successfully',
    type: OpponentMatchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found or you are not the creator',
  })
  async cancel(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<OpponentMatchResponseDto> {
    return this.opponentMatchService.cancel(
      req.user.tenantId,
      req.user.userId, // This should be customerId
      id,
    );
  }
}
