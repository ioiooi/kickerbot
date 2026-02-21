/**
 * Assigns 4 players into 2 teams using a Fisher-Yates shuffle.
 * Does NOT mutate the input array.
 *
 * @param {string[]} players - Array of exactly 4 Slack user IDs
 * @returns {{ team1: { attack: string, defense: string }, team2: { attack: string, defense: string } }}
 */
export function assignTeams(players) {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    team1: { attack: shuffled[0], defense: shuffled[1] },
    team2: { attack: shuffled[2], defense: shuffled[3] },
  };
}
