import { AuthSessionService } from "./auth-session.service";
import { TraceIdService } from "../trace-id.service";
import { createRedisClient } from "../utils/redis.util";

jest.mock("../utils/redis.util", () => ({
  createRedisClient: jest.fn(),
}));

class FakeRedis {
  public status = "ready";
  public store = new Map<string, string>();

  async watch(_key: string) {
    return "OK";
  }

  async unwatch() {
    return "OK";
  }

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.store.set(key, value);
    return "OK";
  }

  async del(key: string) {
    this.store.delete(key);
    return 1;
  }

  multi() {
    const commands: Array<() => void> = [];
    const multiRef = {
      set: (key: string, value: string) => {
        commands.push(() => {
          this.store.set(key, value);
        });
        return multiRef;
      },
      del: (key: string) => {
        commands.push(() => {
          this.store.delete(key);
        });
        return multiRef;
      },
      exec: async () => {
        commands.forEach((cmd) => cmd());
        return commands.map(() => [null, "OK"]);
      },
    };
    return multiRef;
  }
}

describe("AuthSessionService", () => {
  let service: AuthSessionService;
  let fakeRedis: FakeRedis;

  beforeEach(() => {
    process.env.STORAGE_TYPE = "valkey";
    process.env.IWORK_SINGLE_SESSION = "true";
    fakeRedis = new FakeRedis();
    (createRedisClient as jest.Mock).mockReturnValue(fakeRedis);
    service = new AuthSessionService(new TraceIdService());
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.STORAGE_TYPE;
    delete process.env.IWORK_SINGLE_SESSION;
  });

  it("establishes and validates a session", async () => {
    const result = await service.establishSession(1, "scope-1");
    const validation = await service.validateSession(1, result.sessionId);

    expect(result.sessionId).toBeDefined();
    expect(validation.valid).toBe(true);
  });

  it("revokes prior session when logging in from a different scope", async () => {
    const first = await service.establishSession(1, "scope-1");
    const second = await service.establishSession(1, "scope-2");

    expect(second.blockedByActiveSession).toBe(true);
    expect(second.sessionId).toEqual(first.sessionId);

    const stillActive = await service.validateSession(1, first.sessionId);
    expect(stillActive.valid).toBe(true);
  });

  it("logout only clears active session when session matches", async () => {
    const first = await service.establishSession(1, "scope-1");
    await service.logoutSession(1, "other-session");

    const stillValid = await service.validateSession(1, first.sessionId);
    expect(stillValid.valid).toBe(true);

    await service.logoutSession(1, first.sessionId);
    const loggedOut = await service.validateSession(1, first.sessionId);
    expect(loggedOut.valid).toBe(false);
  });

  it("allows requests when redis is unavailable", async () => {
    fakeRedis.status = "connecting";
    const result = await service.validateSession(1, "session-1");
    expect(result.valid).toBe(true);
    expect(result.checksSkipped).toBe(true);
  });
});
