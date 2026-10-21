import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CompleteProfileDto } from '../auth/auth.dto';
import { CreateCameraDto, UpdateCameraDto } from '../cameras/cameras.dto';
import { CreateEventDto, UpdateEventDto } from '../events/events.dto';
import { CreateReportDto } from '../reports/reports.dto';
import { DispatchDto } from '../volunteers/volunteers.dto';

// Same pipe main.ts installs globally.
const pipe = new ValidationPipe({ whitelist: true });
const run = (metatype: any, value: any) => pipe.transform(value, { type: 'body', metatype });
const rejects = (metatype: any, value: any) => expect(run(metatype, value)).rejects.toBeInstanceOf(BadRequestException);

const event = {
  name: 'Fest', eventType: 'FESTIVAL', location: 'Stadium', latitude: 13.08, longitude: 80.27,
  expectedCrowd: 800, maxCapacity: 1000, entryGates: 4, exitGates: 4, cameraCount: 12, volunteerCount: 40,
  startTime: '2026-10-21T10:00:00.000Z', endTime: '2026-10-22T10:00:00.000Z',
};

describe('request DTOs', () => {
  it('keeps every event field the service reads, including start/end time', async () => {
    expect(await run(CreateEventDto, event)).toEqual(event);
  });

  it('rejects impossible events', async () => {
    await rejects(CreateEventDto, { ...event, latitude: 123 });
    await rejects(CreateEventDto, { ...event, maxCapacity: 0 });
    await rejects(CreateEventDto, { ...event, startTime: 'tomorrow' });
    await rejects(UpdateEventDto, { status: 'Hacked' });
    await rejects(UpdateEventDto, { maxCapacity: null });
    expect(await run(UpdateEventDto, { name: 'Renamed' })).toEqual({ name: 'Renamed' });
  });

  it('allows an unplaced camera (null coordinates) but not a bad status', async () => {
    const cam = { name: 'Gate 1', location: 'North', cameraSource: 'RTSP Camera', rtspUrl: 'rtsp://x', latitude: null, longitude: null };
    expect(await run(CreateCameraDto, cam)).toEqual(cam);
    await rejects(UpdateCameraDto, { status: 'Broken' });
  });

  it('accepts report coordinates as multipart strings or JSON numbers', async () => {
    const report = { title: 'Crush', description: 'Near gate 3' };
    await run(CreateReportDto, { ...report, latitude: '13.08', longitude: '80.27' });
    await run(CreateReportDto, { ...report, latitude: 13.08, longitude: 80.27 });
    await rejects(CreateReportDto, { ...report, latitude: 'abc', longitude: '80.27' });
  });

  it('validates nested profile data and drops unknown keys', async () => {
    const out = await run(CompleteProfileDto, { profileData: { phoneNumber: '123', role: 'ADMIN' } });
    expect(out.profileData).toEqual({ phoneNumber: '123' });
    await rejects(CompleteProfileDto, { profileData: { phoneNumber: { $gt: '' } } });
  });

  it('accepts seeded non-UUID ids and only known incident types', async () => {
    await run(DispatchDto, { volunteerId: 'vol-1', incidentId: 'cam-1', incidentType: 'SOS' });
    await rejects(DispatchDto, { volunteerId: 'vol-1', incidentId: 'x', incidentType: 'FIRE' });
  });
});
