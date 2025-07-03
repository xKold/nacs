"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  avatar?: string;
};

type Match = {
  match_id: string;
  teams: {
    faction1: Team;
    faction2: Team;
  };
  results?: {
    winner: string;
    score: {
      faction1: number;
      faction2: number;
    };
  };
  status: string;
  started_at?: number;
  finished_at?: number;
  round: number;
  position: number;
  best_of: number;
};

type BracketData = {
  rounds: Match[][];
  teams: Team[];
};

type Params = Promise<{ championshipId: string }>;

// Fetch tournament data from FACEIT API
async function fetchTournamentData(championshipId: string): Promise<BracketData> {
  try {
    // Fetch matches from the tournament using query parameter
    const matchesRes = await fetch(
      `/api/matches?championshipId=${championshipId}`,
      {
        cache: "no-store",
      }
    );

    if (!matchesRes.ok) {
      throw new Error(`Failed to fetch matches: ${matchesRes.status}`);
    }

    const matchesData = await matchesRes.json();
    
    // Process and organize matches by rounds
    const matches = matchesData.items || [];
    const rounds = organizeBracketRounds(matches);
    
    // Extract unique teams
    const teams = extractTeams(matches);
    
    return { rounds, teams };
  } catch (error) {
    console.error("Error fetching tournament data:", error);
    throw error;
  }
}

// Organize matches into bracket rounds
function organizeBracketRounds(matches: Match[]): Match[][] {
  // Sort matches by round and position
  const sortedMatches = matches.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

  // Group by rounds
  const rounds: Match[][] = [];
  let currentRound = -1;
  
  sortedMatches.forEach((match) => {
    if (match.round !== currentRound) {
      currentRound = match.round;
      rounds.push([]);
    }
    rounds[rounds.length - 1].push(match);
  });

  return rounds;
}

// Extract unique teams from matches
function extractTeams(matches: Match[]): Team[] {
  const teamsMap = new Map<string, Team>();
  
  matches.forEach((match) => {
    if (match.teams.faction1) {
      teamsMap.set(match.teams.faction1.id, match.teams.faction1);
    }
    if (match.teams.faction2) {
      teamsMap.set(match.teams.faction2.id, match.teams.faction2);
    }
  });

  return Array.from(teamsMap.values());
}

// Format match time
function formatMatchTime(timestamp?: number): string {
  if (!timestamp) return "TBD";
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Get match status display
function getMatchStatus(match: Match): string {
  switch (match.status) {
    case "finished":
      return "Finished";
    case "ongoing":
      return "Live";
    case "ready":
      return "Ready";
    case "scheduled":
      return formatMatchTime(match.started_at);
    default:
      return "Pending";
  }
}

// Match component
function MatchComponent({ match }: { match: Match }) {
  const isFinished = match.status === "finished";
  const winner = match.results?.winner;
  
  return (
    <div className="match-card">
      <div className="match-header">
        <span className="match-round">
          {match.round === 4 ? "Finals" : `Round ${match.round}`}
        </span>
        <span className="match-format">
          BO{match.best_of || (match.round === 4 ? 5 : 3)}
        </span>
      </div>
      
      <div className="teams">
        <div className={`team ${winner === match.teams.faction1.id ? 'winner' : ''}`}>
          <span className="team-name">{match.teams.faction1.name}</span>
          {isFinished && (
            <span className="score">
              {match.results?.score.faction1 || 0}
            </span>
          )}
        </div>
        
        <div className="vs">vs</div>
        
        <div className={`team ${winner === match.teams.faction2.id ? 'winner' : ''}`}>
          <span className="team-name">{match.teams.faction2.name}</span>
          {isFinished && (
            <span className="score">
              {match.results?.score.faction2 || 0}
            </span>
          )}
        </div>
      </div>
      
      <div className="match-status">
        {getMatchStatus(match)}
      </div>
    </div>
  );
}

// Bracket component
function BracketComponent({ rounds }: { rounds: Match[][] }) {
  return (
    <div className="bracket-container">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="bracket-round">
          <h3 className="round-title">
            {roundIndex === rounds.length - 1 ? "Finals" : `Round ${roundIndex + 1}`}
          </h3>
          <div className="round-matches">
            {round.map((match) => (
              <MatchComponent key={match.match_id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BracketPage({ params }: { params: Params }) {
  const [championshipId, setChampionshipId] = useState<string>("");
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const resolvedParams = await params;
        setChampionshipId(resolvedParams.championshipId);
        
        const data = await fetchTournamentData(resolvedParams.championshipId);
        setBracketData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [params]);

  if (loading) {
    return (
      <main className="bracket-page">
        <div className="loading">Loading bracket...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bracket-page">
        <div className="error">
          <p>Error loading bracket: {error}</p>
          <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
        </div>
      </main>
    );
  }

  if (!bracketData || bracketData.rounds.length === 0) {
    return (
      <main className="bracket-page">
        <div className="no-data">No bracket data available</div>
      </main>
    );
  }

  return (
    <main className="bracket-page">
      <nav className="bracket-nav">
        <Link href={`/matches/event/${championshipId}`}>
          ← Back to Matches
        </Link>
        <h1>Tournament Bracket</h1>
      </nav>

      <BracketComponent rounds={bracketData.rounds} />

      <style jsx>{`
        .bracket-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .bracket-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .bracket-nav a {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }

        .bracket-nav a:hover {
          text-decoration: underline;
        }

        .bracket-nav h1 {
          margin: 0;
          color: #333;
        }

        .bracket-container {
          display: flex;
          gap: 40px;
          overflow-x: auto;
          padding: 20px 0;
        }

        .bracket-round {
          min-width: 300px;
          flex-shrink: 0;
        }

        .round-title {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
          font-size: 1.2em;
        }

        .round-matches {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .match-card {
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .match-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .match-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 0.9em;
          color: #666;
        }

        .match-format {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .teams {
          margin-bottom: 10px;
        }

        .team {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .team:last-child {
          border-bottom: none;
        }

        .team.winner {
          background: #e8f5e8;
          font-weight: bold;
          color: #2e7d32;
        }

        .team-name {
          flex: 1;
        }

        .score {
          font-weight: bold;
          font-size: 1.1em;
          min-width: 20px;
          text-align: center;
        }

        .vs {
          text-align: center;
          font-size: 0.9em;
          color: #666;
          margin: 5px 0;
        }

        .match-status {
          text-align: center;
          font-size: 0.9em;
          color: #666;
          font-weight: 500;
        }

        .loading, .error, .no-data {
          text-align: center;
          padding: 40px;
          font-size: 1.1em;
        }

        .error {
          color: #d32f2f;
        }

        .loading {
          color: #666;
        }

        @media (max-width: 768px) {
          .bracket-container {
            gap: 20px;
          }
          
          .bracket-round {
            min-width: 280px;
          }
          
          .bracket-nav {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
