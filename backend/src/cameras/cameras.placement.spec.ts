import { BadRequestException } from '@nestjs/common';
import { CamerasService } from './cameras.service';

/**
 * Camera coordinates come straight from the client, so the bounds check is a
 * trust boundary. These drive it through the real service against a stub
 * Prisma, so a regression in create() or update() fails here.
 */
describe('CamerasService placement validation', () => {
  const camera = { id: 'cam-1', name: 'North Gate' };
  let created: any;
  let updated: any;

  const prisma: any = {
    event: { findUnique: jest.fn().mockResolvedValue({ id: 'evt-1' }) },
    camera: {
      findUnique: jest.fn().mockResolvedValue(camera),
      create: jest.fn().mockImplementation(({ data }) => {
        created = data;
        return Promise.resolve({ ...camera, ...data });
      }),
      update: jest.fn().mockImplementation(({ data }) => {
        updated = data;
        return Promise.resolve({ ...camera, ...data });
      }),
    },
  };

  const service = new CamerasService(prisma, {} as any, {} as any, {} as any, {} as any);
  const base = { name: 'North Gate', location: 'North', cameraSource: 'RTSP Camera', rtspUrl: 'rtsp://x' };

  beforeEach(() => {
    created = undefined;
    updated = undefined;
  });

  it('stores a valid placement', async () => {
    await service.create('evt-1', { ...base, latitude: 12.9716, longitude: 77.5946 });
    expect(created.latitude).toBe(12.9716);
    expect(created.longitude).toBe(77.5946);
  });

  it('leaves an unplaced camera null rather than defaulting to 0,0', async () => {
    await service.create('evt-1', base);
    expect(created.latitude).toBeNull();
    expect(created.longitude).toBeNull();
  });

  it('rejects a half-placed camera', async () => {
    await expect(service.create('evt-1', { ...base, latitude: 12.9 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects out-of-range coordinates', async () => {
    await expect(service.create('evt-1', { ...base, latitude: 91, longitude: 0 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('evt-1', { ...base, latitude: 0, longitude: 181 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-finite coordinates', async () => {
    await expect(service.create('evt-1', { ...base, latitude: NaN, longitude: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not wipe coordinates on an unrelated update', async () => {
    await service.update('cam-1', { name: 'Renamed' });
    expect(updated).toEqual({ name: 'Renamed' });
    expect('latitude' in updated).toBe(false);
  });

  it('validates placement on update when it is sent', async () => {
    await expect(service.update('cam-1', { latitude: 999, longitude: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });
});

/**
 * The map weights its heat layer on `density` and colours markers on
 * `riskLevel`. findAll must surface both from the newest analytics row, or the
 * heatmap silently reads zero everywhere.
 */
describe('CamerasService findAll analytics projection', () => {
  const rows = [
    {
      id: 'cam-1',
      name: 'North Gate',
      latitude: 12.97,
      longitude: 77.59,
      analytics: [{ peopleCount: 120, density: 4.5, riskLevel: 'HIGH', timestamp: new Date('2026-07-17T10:00:00Z') }],
    },
    { id: 'cam-2', name: 'Never scanned', latitude: null, longitude: null, analytics: [] },
  ];

  const prisma: any = { camera: { findMany: jest.fn().mockResolvedValue(rows) } };
  const service = new CamerasService(prisma, {} as any, {} as any, {} as any, {} as any);

  it('projects the latest reading onto each camera', async () => {
    const result: any[] = await service.findAll('evt-1');

    expect(result[0]).toMatchObject({
      id: 'cam-1',
      latitude: 12.97,
      longitude: 77.59,
      peopleCount: 120,
      density: 4.5,
      riskLevel: 'HIGH',
    });
    // The raw relation must not leak through to the client payload.
    expect('analytics' in result[0]).toBe(false);
  });

  it('defaults a never-scanned camera to zero density and LOW risk', async () => {
    const result: any[] = await service.findAll('evt-1');
    expect(result[1]).toMatchObject({ peopleCount: 0, density: 0, riskLevel: 'LOW', lastReadingAt: null });
  });

  it('asks the database for only the newest reading per camera', async () => {
    await service.findAll('evt-1');
    expect(prisma.camera.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { analytics: { orderBy: { timestamp: 'desc' }, take: 1 } },
      }),
    );
  });
});
