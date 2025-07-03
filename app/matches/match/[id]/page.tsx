'use client';

import { useState } from 'react';

interface PlayerStats {
  player_id: string;
  nickname: string;
  player_stats: {
    Kills: number;
    Deaths: number;
    Assists: number;
    "Headshots %": number;
  };
}

interface Team {
  team_name: string;
  team_stats: { FinalScore: number };
  players: PlayerStats[];
}

interface Round {
  round_stats: { Map: string };
  teams: Team[];
}

interface MatchStats {
  rounds: Round[];
  overall?: Team[]; // add overall if your API provides it or you can compute it
}

export default function MatchStatsDisplay({ matchStats }: { matchStats: MatchStats }) {
  const [selectedMapIndex, setSelectedMapIndex] = useState<number | 'overall'>('overall');

  // Helper to get overall stats by aggregating all rounds
  const computeOverallStats = () => {
    if (!matchStats.rounds || matchStats.rounds.length === 0) return null;

    // naive aggregation (you can improve this)
    const overallTeams = matchStats.rounds[0].teams.map(team => ({
      team_name: team.team_name,
      players: [] as PlayerStats[],
      team_stats: { FinalScore: 0 },
    }));

    // Aggregate scores and player stats
    matchStats.rounds.forEach(round => {
      round.teams.forEach((team, teamIdx) => {
        overallTeams[teamIdx].team_stats.FinalScore += team.team_stats.FinalScore;

        // Aggregate player stats (simple merge)
        team.players.forEach(player => {
          const existing = overallTeams[teamIdx].players.find(p => p.player_id === player.player_id);
          if (existing) {
            existing.player_stats.Kills += player.player_stats.Kills;
            existing.player_stats.Deaths += player.player_stats.Deaths;
            existing.player_stats.Assists += player.player_stats.Assists;
            existing.player_stats["Headshots %"] = Math.max(existing.player_stats["Headshots %"], player.player_stats["Headshots %"]);
          } else {
            overallTeams[teamIdx].players.push({ ...player, player_stats: { ...player.player_stats } });
          }
        });
      });
    });

    return overallTeams;
  };

  const overallTeams = computeOverallStats();

  const rounds = matchStats.rounds || [];

  const displayTeams = selectedMapIndex === 'overall' ? overallTeams : rounds[selectedMapIndex]?.teams;

  return (
    <div>
      <h2>Maps & Scores</h2>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setSelectedMapIndex('overall')}
          style={{ fontWeight: selectedMapIndex === 'overall' ? 'bold' : 'normal', marginRight: 10 }}
        >
          Overall Stats
        </button>
        {rounds.map((round, i) => (
          <button
            key={i}
            onClick={() => setSelectedMapIndex(i)}
            style={{ fontWeight: selectedMapIndex === i ? 'bold' : 'normal', marginRight: 10 }}
          >
            {round.round_stats.Map} ({round.teams[0].team_stats.FinalScore} - {round.teams[1].team_stats.FinalScore})
          </button>
        ))}
      </div>

      {displayTeams ? (
        displayTeams.map((team, teamIdx) => (
          <div key={teamIdx} style={{ marginBottom: 30 }}>
            <h3>{team.team_name} — {team.team_stats?.FinalScore ?? 'N/A'}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Player</th>
                  <th>Kills</th>
                  <th>Deaths</th>
                  <th>Assists</th>
                  <th>Headshots %</th>
                </tr>
              </thead>
              <tbody>
                {team.players.map(player => (
                  <tr key={player.player_id}>
                    <td>{player.nickname}</td>
                    <td>{player.player_stats.Kills}</td>
                    <td>{player.player_stats.Deaths}</td>
                    <td>{player.player_stats.Assists}</td>
                    <td>{player.player_stats["Headshots %"]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p>No stats available for this selection.</p>
      )}
    </div>
  );
}
