import { ServiceUnavailableException } from '@nestjs/common';
import { CamerasService } from './cameras.service';

/**
 * A failed AI call must record nothing. The old fallback stored a random
 * people count as a real report, which could raise (or hide) real alerts.
 */
describe('CamerasService analysis when the AI service fails', () => {
  const realFetch = global.fetch;
  let prisma: any;
  let service: CamerasService;

  beforeEach(() => {
    prisma = {
      camera: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cam-1',
          name: 'Gate cam',
          rtspUrl: 'rtsp://cam',
          calibration: null,
          event: { id: 'evt-1', maxCapacity: 100, areaSqMeters: 50 },
        }),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({}),
      },
      crowdReport: { create: jest.fn() },
      cameraAnalytics: { create: jest.fn() },
      alert: { create: jest.fn() },
    };
    service = new CamerasService(prisma, {} as any, {} as any, {} as any, {} as any);
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it.each([
    ['unreachable', () => Promise.reject(new Error('ECONNREFUSED'))],
    ['erroring', () => Promise.resolve(new Response('{"detail":"boom"}', { status: 500 }))],
  ])('AI service %s -> 503, camera Offline, nothing stored', async (_label, fetchImpl) => {
    global.fetch = jest.fn(fetchImpl) as any;

    await expect(service.analyzeFrame('cam-1')).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(prisma.camera.update).toHaveBeenCalledWith({ where: { id: 'cam-1' }, data: { status: 'Offline' } });
    expect(prisma.crowdReport.create).not.toHaveBeenCalled();
    expect(prisma.cameraAnalytics.create).not.toHaveBeenCalled();
    expect(prisma.alert.create).not.toHaveBeenCalled();
  });
});
