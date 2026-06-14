import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateBoardNotificationSettingDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  muted?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(10, { each: true })
  @Max(10080, { each: true })
  dueReminderMinutes?: number[];
}
