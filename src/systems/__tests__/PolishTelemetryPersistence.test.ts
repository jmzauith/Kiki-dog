import { describe, expect, it } from 'vitest';
import { PlaythroughLog } from '../HuskyTelemetry';
import { RaceProgressState } from '../RaceProgress';
describe('polish telemetry reload', () => {
  it('restores counts and closes an idle interval after reload', () => {
    let now = 100;
    const first = new PlaythroughLog(() => now);
    first.record('run-started'); now=200; first.record('math-asked');
    now=300; first.markIdle();
    const resumed = new PlaythroughLog(() => now);
    resumed.restore(JSON.parse(first.toJSON()).events);
    now=800; resumed.markActive(); now=1000; resumed.record('run-ended');
    expect(resumed.summarize()).toMatchObject({totalMs:900,idleMs:500,activeMs:400,mathAsked:1});
  });
  it('ignores malformed timestamp entries', () => {
    const log = new PlaythroughLog();
    log.restore([{type:'run-started',atMs:NaN},{type:'run-started',atMs:1},{type:'run-ended',atMs:11}]);
    expect(log.summarize().totalMs).toBe(10);
  });
});
describe('three-turn math plus physical final sprint', () => {
  it.each(['steady','turbo'] as const)('retains %s movement and finishes without extra math', mode => {
    const race = new RaceProgressState(5);
    for(let turn=0;turn<3;turn++) { race.playerMove(mode); race.rivalMove(); }
    expect(race.kiki).toBe(mode === 'steady' ? 3 : 5);
    while(!race.over) race.playerMove('steady');
    expect(race.kiki).toBe(5); expect(race.rival).toBeLessThan(5);
  });
});
