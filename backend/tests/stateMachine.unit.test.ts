import { canTransition, VALID_TRANSITIONS } from '../src/services/stateMachine';
import { Status } from '@prisma/client';

describe('stateMachine unit tests', () => {
  it('defines the expected valid transitions', () => {
    expect(VALID_TRANSITIONS.open).toEqual([Status.in_progress, Status.cancelled]);
    expect(VALID_TRANSITIONS.in_progress).toEqual([Status.resolved, Status.cancelled]);
    expect(VALID_TRANSITIONS.resolved).toEqual([Status.closed]);
    expect(VALID_TRANSITIONS.closed).toEqual([]);
    expect(VALID_TRANSITIONS.cancelled).toEqual([]);
  });

  it('returns true only for valid transitions', () => {
    expect(canTransition(Status.open, Status.in_progress)).toBe(true);
    expect(canTransition(Status.open, Status.resolved)).toBe(false);
    expect(canTransition(Status.open, Status.open)).toBe(false);
  });
});
