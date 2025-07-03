// lib/faceitBracketParser.ts
import { BracketMatch } from '@g-loot/react-tournament-brackets/dist/types';

type FaceitMatch = {
  id: string;
  name?: string;
  status: string;
  scheduled_at: string;
  bracket?: {
    round?: number;
    next_match_id?: string;
  };
  teams: {
    faction1: {
      team_id: string;
      nickname: string;
    };
    faction2: {
      team_id: string;
      nickname: string;
    };
  };
  results?: {
    winner?: string;
    score: {
      [teamId: string]: number;
    };
  };
};

export function mapFaceitToMatches(faceitMatches: FaceitMatch[]): BracketMatch[] {
  return faceitMatches.map((match) => {
    const faction1 = match.teams.faction1;
    const faction2 = match.teams.faction2;
    const score = match.results?.score || {};
    const winnerId = match.results?.winner;

    return {
      id: match.id,
      name: match.name || `Match ${match.bracket?.round ?? ''}`,
      nextMatchId: match.bracket?.next_match_id ?? null,
      tournamentRoundText: `Round of ${roundLabel(match.bracket?.round)}`,
      startTime: match.scheduled_at,
      state: match.status.toUpperCase(), // "DONE", "SCHEDULED", etc.
      participants: [
        {
          id: faction1.team_id,
          name: faction1.nickname,
          isWinner: faction1.team_id === winnerId,
          resultText: score[faction1.team_id]?.toString() ?? ''
        },
        {
          id: faction2.team_id,
          name: faction2.nickname,
          isWinner: faction2.team_id === winnerId,
          resultText: score[faction2.team_id]?.toString() ?? ''
        }
      ]
    };
  });
}

function roundLabel(round?: number): string {
  switch (round) {
    case 1: return '16';
    case 2: return '8';
    case 3: return '4';
    case 4: return '2';
    case 5: return 'Final';
    default: return '?';
  }
}