// Takeover Controller - Dashboard API for human takeover controls
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TakeoverService } from './takeover.service';
import {
  ActivateTakeoverDto,
  ExtendTakeoverDto,
  ResumeBotDto,
} from './dto/activate-takeover.dto';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { WsGateway } from '../../common/gateway/ws.gateway';

@ApiTags('Takeover')
@ApiBearerAuth()
@Controller('takeover')
export class TakeoverController {
  constructor(
    private readonly takeoverService: TakeoverService,
    private readonly wsGateway: WsGateway
  ) {}

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate human takeover (silence bot)' })
  @ApiResponse({ status: 200, description: 'Takeover activated successfully' })
  async activate(
    @TenantId() tenantId: string,
    @Body() dto: ActivateTakeoverDto
  ) {
    // Note: We use tenantId as facilityId for now (1:1 mapping in MVP)
    const state = await this.takeoverService.activate(tenantId, dto);

    // Emit WebSocket event to dashboard
    this.wsGateway.emitToTenant(tenantId, 'takeover:activated', {
      customerPhone: dto.customerPhone,
      silenceDurationMinutes: state.silenceDurationMinutes,
      expiresAt: state.expiresAt,
    });

    return {
      success: true,
      data: state,
    };
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume bot (end takeover)' })
  @ApiResponse({ status: 200, description: 'Bot resumed successfully' })
  async resume(@TenantId() tenantId: string, @Body() dto: ResumeBotDto) {
    await this.takeoverService.resume(tenantId, dto);

    // Emit WebSocket event to dashboard
    this.wsGateway.emitToTenant(tenantId, 'takeover:resumed', {
      customerPhone: dto.customerPhone,
    });

    return {
      success: true,
      message: 'Bot resumed successfully',
    };
  }

  @Post('extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extend takeover duration' })
  @ApiResponse({ status: 200, description: 'Takeover extended successfully' })
  async extend(@TenantId() tenantId: string, @Body() dto: ExtendTakeoverDto) {
    const state = await this.takeoverService.extend(tenantId, dto);

    if (!state) {
      return {
        success: false,
        message: 'No active takeover found to extend',
      };
    }

    // Emit WebSocket event to dashboard
    this.wsGateway.emitToTenant(tenantId, 'takeover:extended', {
      customerPhone: dto.customerPhone,
      newExpiresAt: state.expiresAt,
    });

    return {
      success: true,
      data: state,
    };
  }

  @Get('status/:customerPhone')
  @ApiOperation({ summary: 'Get takeover status for a customer' })
  @ApiResponse({ status: 200, description: 'Takeover status retrieved' })
  async getStatus(
    @TenantId() tenantId: string,
    @Param('customerPhone') customerPhone: string
  ) {
    const status = await this.takeoverService.getStatus(tenantId, customerPhone);

    return {
      success: true,
      data: status,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active takeovers for facility' })
  @ApiResponse({ status: 200, description: 'Active takeovers retrieved' })
  async getActiveTakeovers(@TenantId() tenantId: string) {
    const takeovers = await this.takeoverService.getActiveTakeovers(tenantId);

    return {
      success: true,
      data: takeovers,
    };
  }
}
