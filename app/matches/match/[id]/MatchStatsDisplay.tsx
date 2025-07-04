'use client';

import { useState } from 'react';

interface PlayerStats {
  player_id: string;
  nickname: string;
  player_stats: {
    Kills: string | number;
    Deaths: string | number;
    Assists: string | number;
    "Headshots %": string | number;
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

interface MatchResults {
  score: {
    faction1: number;
    faction2: number;
  };
}

interface DetailedResult {
  factions: {
    faction1: { score: number };
    faction2: { score: number };
  };
}

interface MatchStatsDisplayProps {
  matchStats: MatchStats;
  teams: {
    faction1?: { name: string };
    faction2?: { name: string };
  };
  results?: MatchResults;
  detailedResults?: DetailedResult[];
}

export default function MatchStatsDisplay({
  matchStats,
  teams,
  results,
  detailedResults,
}: MatchStatsDisplayProps) {
  const [selectedMapIndex, setSelectedMapIndex] = useState<number | 'overall'>('overall');

  const faction1Name = teams?.faction1?.name ?? 'Team 1';
  const faction2Name = teams?.faction2?.name ?? 'Team 2';

  // Helper function to safely convert stats to numbers
  const parseStatValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Compute overall stats by aggregating all rounds properly
  const computeOverallStats = () => {
    if (!matchStats.rounds || matchStats.rounds.length === 0) return null;

    const overallTeams = matchStats.rounds[0].teams.map((_, idx) => ({
      team_name: idx === 0 ? faction1Name : faction2Name,
      players: [] as PlayerStats[],
      team_stats: { FinalScore: 0 },
    }));

    matchStats.rounds.forEach(round => {
      round.teams.forEach((team, teamIdx) => {
        overallTeams[teamIdx].team_stats.FinalScore += team.team_stats.FinalScore;

        team.players.forEach(player => {
          let existing = overallTeams[teamIdx].players.find(p => p.player_id === player.player_id);
          if (!existing) {
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

          const currentKills = parseStatValue(player.player_stats.Kills);
          const currentDeaths = parseStatValue(player.player_stats.Deaths);
          const currentAssists = parseStatValue(player.player_stats.Assists);
          const currentHSPercent = parseStatValue(player.player_stats["Headshots %"]);

          const prevKills = parseStatValue(existing.player_stats.Kills);
          const prevDeaths = parseStatValue(existing.player_stats.Deaths);
          const prevAssists = parseStatValue(existing.player_stats.Assists);
          const prevHSPercent = parseStatValue(existing.player_stats["Headshots %"]);

          existing.player_stats.Kills = prevKills + currentKills;
          existing.player_stats.Deaths = prevDeaths + currentDeaths;
          existing.player_stats.Assists = prevAssists + currentAssists;

          const prevHeadshotCount = prevKills * (prevHSPercent / 100);
          const currentHeadshotCount = currentKills * (currentHSPercent / 100);
          const newTotalKills = prevKills + currentKills;
          const newTotalHeadshots = prevHeadshotCount + currentHeadshotCount;

          existing.player_stats["Headshots %"] = newTotalKills > 0
            ? (newTotalHeadshots / newTotalKills) * 100
            : 0;
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
          Overall Stats ({results?.score?.faction1 ?? 0} - {results?.score?.faction2 ?? 0})
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
            {round.round_stats.Map} ({detailedResults?.[i]?.factions?.faction1?.score ?? 0} - {detailedResults?.[i]?.factions?.faction2?.score ?? 0})
          </button>
        ))}
      </div>

      {displayTeams ? (
        displayTeams.map((team, teamIdx) => (
          <div key={teamIdx} style={{ marginBottom: 30 }}>
            <h3
              style={{
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                padding: '10px',
                margin: '0 auto 15px auto',
                borderRadius: '5px',
                width: '80%',
                border: '1px solid #dee2e6',
              }}
            >
              {teamIdx === 0 ? faction1Name : faction2Name}
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
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      {parseStatValue(player.player_stats.Kills)}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      {parseStatValue(player.player_stats.Deaths)}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      {parseStatValue(player.player_stats.Assists)}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      {parseStatValue(player.player_stats["Headshots %"]).toFixed(2)}%
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
