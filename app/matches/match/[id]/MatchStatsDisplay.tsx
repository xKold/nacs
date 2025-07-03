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
}

export default function MatchStatsDisplay({ matchStats }: { matchStats: MatchStats }) {
  const [selectedMapIndex, setSelectedMapIndex] = useState<number | 'overall'>('overall');

  // Compute overall stats by aggregating all rounds properly
  const computeOverallStats = () => {
    if (!matchStats.rounds || matchStats.rounds.length === 0) return null;

    // Initialize overall teams structure with empty players & 0 scores
    const overallTeams = matchStats.rounds[0].teams.map(team => ({
      team_name: team.team_name,
      players: [] as PlayerStats[],
      team_stats: { FinalScore: 0 },
    }));

    // Aggregate all rounds data correctly
    matchStats.rounds.forEach(round => {
      round.teams.forEach((team, teamIdx) => {
        overallTeams[teamIdx].team_stats.FinalScore += team.team_stats.FinalScore;

        team.players.forEach(player => {
          let existing = overallTeams[teamIdx].players.find(p => p.player_id === player.player_id);
          if (!existing) {
            // Clone the player object with zeroed stats for aggregation
            existing = {
              ...player,
              player_stats: {
                Kills: 0,
                Deaths: 0,
                Assists: 0,
                "Headshots %": 0,
              },
            };
            overallTeams[teamIdx].players.push(existing);
          }

          // Before updating, store old kills and headshot count
          const oldKills = existing.player_stats.Kills;
          const oldHSCount = oldKills * (existing.player_stats["Headshots %"] / 100);

          // Add kills, deaths, assists numerically
          existing.player_stats.Kills += player.player_stats.Kills;
          existing.player_stats.Deaths += player.player_stats.Deaths;
          existing.player_stats.Assists += player.player_stats.Assists;

          // Calculate new headshot count for current round
          const currentHSCount = player.player_stats.Kills * (player.player_stats["Headshots %"] / 100);

          // Calculate weighted headshots total
          const totalKills = existing.player_stats.Kills;
          const totalHSCount = oldHSCount + currentHSCount;

          // Update weighted Headshots %
          existing.player_stats["Headshots %"] = totalKills > 0 ? (totalHSCount / totalKills) * 100 : 0;
        });
      });
    });

    return overallTeams;
  };

  const overallTeams = computeOverallStats();
  const rounds = matchStats.rounds || [];
  const displayTeams = selectedMapIndex === 'overall' ? overallTeams : rounds[selectedMapIndex]?.teams;

  return (
    <section>
      <h2 style={{ textAlign: 'center' }}>Maps & Scores</h2>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button
          onClick={() => setSelectedMapIndex('overall')}
          style={{
            fontWeight: selectedMapIndex === 'overall' ? 'bold' : 'normal',
            marginRight: 10,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Overall Stats
        </button>
        {rounds.map((round, i) => (
          <button
            key={i}
            onClick={() => setSelectedMapIndex(i)}
            style={{
              fontWeight: selectedMapIndex === i ? 'bold' : 'normal',
              marginRight: 10,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            {round.round_stats.Map} ({round.teams[0].team_stats.FinalScore} - {round.teams[1].team_stats.FinalScore})
          </button>
        ))}
      </div>

      {displayTeams ? (
        displayTeams.map((team, teamIdx) => (
          <div key={teamIdx} style={{ marginBottom: 30 }}>
            <h3 style={{ textAlign: 'center' }}>
              {team.team_name} — {team.team_stats?.FinalScore ?? 'N/A'}
            </h3>
            <table
              style={{
                width: '80%',
                margin: '0 auto',
                borderCollapse: 'collapse',
                border: '1px solid #ccc',
                textAlign: 'center',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Player</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Kills</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Deaths</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Assists</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Headshots %</th>
                </tr>
              </thead>
              <tbody>
                {team.players.map(player => (
                  <tr key={player.player_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{player.nickname}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{player.player_stats.Kills}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{player.player_stats.Deaths}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{player.player_stats.Assists}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      {player.player_stats["Headshots %"].toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p style={{ textAlign: 'center' }}>No stats available for this selection.</p>
      )}
    </section>
  );
}
