import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  vi.clearAllMocks();
});
