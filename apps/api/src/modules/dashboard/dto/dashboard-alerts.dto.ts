// Dashboard Alerts DTO
// Response DTO for dashboard alerts

import { ApiProperty } from '@nestjs/swagger';

export enum AlertType {
  UNCONFIRMED_BOOKING = 'UNCONFIRMED_BOOKING',
  PENDING_ESCALATION = 'PENDING_ESCALATION',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  SUBSCRIPTION_REMINDER = 'SUBSCRIPTION_REMINDER',
  NO_SHOW_RISK = 'NO_SHOW_RISK',
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class DashboardAlertDto {
  @ApiProperty({ description: 'Alert unique identifier' })
  id: string;

  @ApiProperty({ description: 'Alert type', enum: AlertType })
  type: AlertType;

  @ApiProperty({ description: 'Alert priority', enum: AlertPriority })
  priority: AlertPriority;

  @ApiProperty({ description: 'Alert title' })
  title: string;

  @ApiProperty({ description: 'Alert description' })
  description: string;

  @ApiProperty({ description: 'Related entity ID (booking, customer, etc.)' })
  entityId: string;

  @ApiProperty({ description: 'Related entity type' })
  entityType: string;

  @ApiProperty({ description: 'When the alert was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Action link or route', nullable: true })
  actionLink: string | null;
}

export class DashboardAlertsResponseDto {
  @ApiProperty({ type: [DashboardAlertDto] })
  alerts: DashboardAlertDto[];

  @ApiProperty({ description: 'Total number of alerts' })
  total: number;
}
