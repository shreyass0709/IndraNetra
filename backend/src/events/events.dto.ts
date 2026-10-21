import {
  IsIn,
  IsInt,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const EVENT_STATUSES = ['Upcoming', 'Live', 'Completed', 'Cancelled'];

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(50)
  eventType: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  location: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsInt()
  @Min(0)
  expectedCrowd: number;

  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsOptional()
  @IsPositive()
  areaSqMeters?: number;

  @IsInt()
  @Min(1)
  entryGates: number;

  @IsInt()
  @Min(1)
  exitGates: number;

  @IsInt()
  @Min(0)
  cameraCount: number;

  @IsInt()
  @Min(0)
  volunteerCount: number;

  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: string;

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  eventType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedCrowd?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsPositive()
  areaSqMeters?: number;

  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  entryGates?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  exitGates?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cameraCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  volunteerCount?: number;
}
