import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignTeams } from '../../src/domain/TeamAssigner.js';

describe('assignTeams', () => {
  const players = ['U001', 'U002', 'U003', 'U004'];

  it('returns exactly 4 unique players across both teams', () => {
    const { team1, team2 } = assignTeams(players);
    const all = [team1.attack, team1.defense, team2.attack, team2.defense];
    assert.equal(all.length, 4);
    assert.equal(new Set(all).size, 4, 'all 4 slots must be unique players');
  });

  it('all returned players are from the input array', () => {
    const { team1, team2 } = assignTeams(players);
    const all = [team1.attack, team1.defense, team2.attack, team2.defense];
    for (const p of all) {
      assert.ok(players.includes(p), `${p} should be in input`);
    }
  });

  it('does not mutate the input array', () => {
    const input = [...players];
    assignTeams(input);
    assert.deepEqual(input, players);
  });

  it('team1 and team2 each have attack and defense roles', () => {
    const { team1, team2 } = assignTeams(players);
    assert.ok(team1.attack, 'team1.attack should be set');
    assert.ok(team1.defense, 'team1.defense should be set');
    assert.ok(team2.attack, 'team2.attack should be set');
    assert.ok(team2.defense, 'team2.defense should be set');
  });

  it('produces different assignments on repeated calls (probabilistic)', () => {
    // Run 20 times; at least one permutation should differ
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      const { team1, team2 } = assignTeams(players);
      results.add(JSON.stringify([team1.attack, team1.defense, team2.attack, team2.defense]));
    }
    assert.ok(results.size > 1, 'shuffle should produce varied results');
  });
});
