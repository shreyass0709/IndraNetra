import { VolunteerStatus } from '@prisma/client';
import { IsEnum, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSOSDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  issueType: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

// IDs are plain strings, not @IsUUID: seeded rows use readable ids like 'cam-1'.
export class AssignVolunteerDto {
  @IsString()
  @MaxLength(100)
  eventId: string;
}

export class LocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}

export class VolunteerStatusDto {
  @IsEnum(VolunteerStatus)
  status: VolunteerStatus;
}

export class DispatchDto {
  @IsString()
  @MaxLength(100)
  volunteerId: string;

  @IsString()
  @MaxLength(100)
  incidentId: string;

  @IsIn(['SOS', 'REPORT'])
  incidentType: 'SOS' | 'REPORT';
}

export class UpdateVolunteerDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  assignedArea?: string;

  @IsOptional()
  @IsEnum(VolunteerStatus)
  status?: VolunteerStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  skills?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  availability?: string;
}
