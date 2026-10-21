import { IsBoolean, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCameraDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  location: string;

  @IsString()
  @MaxLength(50)
  cameraSource: string;

  @IsString()
  @MaxLength(2000)
  rtspUrl: string;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  // null = not placed on the map yet.
  @IsOptional()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsLongitude()
  longitude?: number | null;
}

export class UpdateCameraDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cameraSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rtspUrl?: string;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsIn(['Online', 'Offline'])
  status?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsLongitude()
  longitude?: number | null;
}
