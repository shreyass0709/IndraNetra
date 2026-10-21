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
  ValidateIf,
} from 'class-validator';

// Like @IsOptional() but null is still validated (and rejected): the service
// would otherwise turn a null count into 0.
const SkipIfUndefined = () => ValidateIf((_obj, value) => value !== undefined);

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
  @SkipIfUndefined()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @SkipIfUndefined()
  @IsString()
  @MaxLength(50)
  eventType?: string;

  @SkipIfUndefined()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @SkipIfUndefined()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  location?: string;

  @SkipIfUndefined()
  @IsLatitude()
  latitude?: number;

  @SkipIfUndefined()
  @IsLongitude()
  longitude?: number;

  @SkipIfUndefined()
  @IsInt()
  @Min(0)
  expectedCrowd?: number;

  @SkipIfUndefined()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @SkipIfUndefined()
  @IsPositive()
  areaSqMeters?: number;

  @SkipIfUndefined()
  @IsIn(EVENT_STATUSES)
  status?: string;

  @SkipIfUndefined()
  @IsISO8601()
  startTime?: string;

  @SkipIfUndefined()
  @IsISO8601()
  endTime?: string;

  @SkipIfUndefined()
  @IsInt()
  @Min(1)
  entryGates?: number;

  @SkipIfUndefined()
  @IsInt()
  @Min(1)
  exitGates?: number;

  @SkipIfUndefined()
  @IsInt()
  @Min(0)
  cameraCount?: number;

  @SkipIfUndefined()
  @IsInt()
  @Min(0)
  volunteerCount?: number;
}
