import * as jwt from 'jsonwebtoken';
import { CrowdGateway } from './crowd.gateway';

/**
 * The socket carries SOS locations, incident reports and per-user notifications,
 * so who may connect and who receives what is a trust boundary. These drive the
 * real gateway against stub sockets/server.
 */
describe('CrowdGateway access control', () => {
  const secret = 'test-secret';
  const sign = (user: object) => jwt.sign(user, secret);

  const socket = (cookie?: string) => ({
    id: 's1',
    data: {} as any,
    handshake: { headers: cookie ? { cookie } : {} },
    join: jest.fn(),
    disconnect: jest.fn(),
  });

  let gateway: CrowdGateway;
  let emitted: { rooms: any; event: string; payload: any }[];

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    gateway = new CrowdGateway();
    emitted = [];
    const to = (rooms: any) => ({ emit: (event: string, payload: any) => emitted.push({ rooms, event, payload }) });
    gateway.server = { to, emit: (event: string, payload: any) => emitted.push({ rooms: '*', event, payload }) } as any;
  });

  it('drops a socket with no session', () => {
    const s = socket();
    gateway.handleConnection(s as any);
    expect(s.disconnect).toHaveBeenCalledWith(true);
    expect(s.join).not.toHaveBeenCalled();
  });

  it('drops a socket with a forged session', () => {
    const s = socket(`indranetra_session=${jwt.sign({ id: 'u1', role: 'ADMIN' }, 'wrong-secret')}`);
    gateway.handleConnection(s as any);
    expect(s.disconnect).toHaveBeenCalledWith(true);
  });

  it('admits a valid session into its user and role rooms', () => {
    const s = socket(`other=1; indranetra_session=${sign({ id: 'u1', role: 'PUBLIC' })}`);
    gateway.handleConnection(s as any);
    expect(s.disconnect).not.toHaveBeenCalled();
    expect(s.join).toHaveBeenCalledWith(['user_u1', 'role_PUBLIC']);
  });

  it('sends SOS, reports and volunteer locations only to staff roles', () => {
    gateway.broadcastSOS({ id: 'sos1' });
    gateway.broadcastReport({ id: 'r1' });
    gateway.broadcastVolunteerUpdate({ id: 'v1' });
    for (const e of emitted) {
      expect(e.rooms).toEqual(['role_ADMIN', 'role_ORGANIZER', 'role_VOLUNTEER']);
    }
  });

  it("sends a notification only to its owner's room", () => {
    gateway.broadcastNotification('u42', { title: 'hi' });
    expect(emitted).toEqual([{ rooms: 'user_u42', event: 'notification', payload: { userId: 'u42', title: 'hi' } }]);
  });
});
