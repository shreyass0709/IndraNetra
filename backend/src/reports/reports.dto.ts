import { IsLatitude, IsLongitude, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description: string;

  // Strings when sent as multipart (with evidence), numbers when sent as JSON.
  @IsLatitude()
  latitude: number | string;

  @IsLongitude()
  longitude: number | string;
}
