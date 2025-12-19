// Just confirms that Vitest is working --> nothing is tested here (true == true?)
import { describe, it, expect } from 'vitest';

describe('dummy test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
