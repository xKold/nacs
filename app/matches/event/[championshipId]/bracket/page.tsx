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
  const sortedMatches = matches.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

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

// Individual match component
function MatchCard({ match, roundIndex }: { match: Match; roundIndex: number }) {
  const isFinished = match.status === "finished";
  const winner = match.results?.winner;
  
  return (
    <div className="match-card">
      <div className="match-info">
        <span className="match-format">
          BO{match.best_of || (roundIndex === 3 ? 5 : 3)}
        </span>
      </div>
      
      <div className="match-teams">
        <div className={`team ${winner === match.teams.faction1.id ? 'winner' : ''}`}>
          <span className="team-name">{match.teams.faction1.name}</span>
          {isFinished && (
            <span className="team-score">
              {match.results?.score.faction1 || 0}
            </span>
          )}
        </div>
        
        <div className={`team ${winner === match.teams.faction2.id ? 'winner' : ''}`}>
          <span className="team-name">{match.teams.faction2.name}</span>
          {isFinished && (
            <span className="team-score">
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

// Main bracket component with proper bracket layout
function TournamentBracket({ rounds }: { rounds: Match[][] }) {
  const getRoundTitle = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return "Finals";
    if (roundIndex === totalRounds - 2) return "Semifinals";
    if (roundIndex === totalRounds - 3) return "Quarterfinals";
    return `Round ${roundIndex + 1}`;
  };

  return (
    <div className="tournament-bracket">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="bracket-round">
          <div className="round-header">
            <h3>{getRoundTitle(roundIndex, rounds.length)}</h3>
          </div>
          
          <div className="round-matches">
            {round.map((match, matchIndex) => (
              <div key={match.match_id} className="match-container">
                <MatchCard match={match} roundIndex={roundIndex} />
                
                {/* Connector lines */}
                {roundIndex < rounds.length - 1 && (
                  <div className="match-connector">
                    <div className="connector-line horizontal"></div>
                    {matchIndex % 2 === 0 && round.length > 1 && (
                      <>
                        <div className="connector-line vertical"></div>
                        <div className="connector-line horizontal-to-next"></div>
                      </>
                    )}
                  </div>
                )}
              </div>
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
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tournament bracket...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bracket-page">
        <div className="error-state">
          <h2>Unable to load bracket</h2>
          <p>{error}</p>
          <Link href={`/matches/event/${championshipId}`} className="back-link">
            ← Back to Matches
          </Link>
        </div>
      </main>
    );
  }

  if (!bracketData || bracketData.rounds.length === 0) {
    return (
      <main className="bracket-page">
        <div className="no-data">
          <h2>No bracket data available</h2>
          <p>This tournament may not have started yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bracket-page">
      <header className="bracket-header">
        <Link href={`/matches/event/${championshipId}`} className="back-link">
          ← Back to Matches
        </Link>
        <h1>Tournament Bracket</h1>
        <div className="tournament-info">
          <span>Single Elimination • {bracketData.teams.length} Teams</span>
        </div>
      </header>

      <div className="bracket-wrapper">
        <TournamentBracket rounds={bracketData.rounds} />
      </div>

      <style jsx>{`
        .bracket-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .bracket-header {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .back-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .back-link:hover {
          background: #f8f9ff;
          transform: translateX(-2px);
        }

        .bracket-header h1 {
          margin: 0;
          color: #2d3748;
          font-size: 1.8em;
        }

        .tournament-info {
          color: #718096;
          font-size: 0.9em;
          font-weight: 500;
        }

        .bracket-wrapper {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .tournament-bracket {
          display: flex;
          gap: 60px;
          min-width: fit-content;
          align-items: flex-start;
        }

        .bracket-round {
          display: flex;
          flex-direction: column;
          min-width: 220px;
        }

        .round-header {
          margin-bottom: 20px;
          text-align: center;
        }

        .round-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1em;
          font-weight: 600;
          padding: 8px 16px;
          background: #f7fafc;
          border-radius: 20px;
          border: 2px solid #e2e8f0;
        }

        .round-matches {
          display: flex;
          flex-direction: column;
          gap: 40px;
          flex: 1;
        }

        .match-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .match-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          width: 200px;
          position: relative;
        }

        .match-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .match-info {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .match-format {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75em;
          font-weight: 600;
        }

        .match-teams {
          margin-bottom: 8px;
        }

        .team {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          margin-bottom: 2px;
          transition: all 0.2s;
        }

        .team:hover {
          background: #f7fafc;
        }

        .team.winner {
          background: #c6f6d5;
          border: 1px solid #38a169;
          font-weight: 600;
          color: #2f855a;
        }

        .team-name {
          font-size: 0.85em;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        .team-score {
          font-weight: 700;
          font-size: 0.9em;
          min-width: 20px;
          text-align: center;
        }

        .match-status {
          text-align: center;
          font-size: 0.75em;
          color: #718096;
          font-weight: 500;
          padding: 4px;
          background: #f7fafc;
          border-radius: 4px;
        }

        .match-connector {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .connector-line {
          background: #cbd5e0;
          position: absolute;
        }

        .connector-line.horizontal {
          width: 30px;
          height: 2px;
          left: 0;
          top: -1px;
        }

        .connector-line.vertical {
          width: 2px;
          height: 40px;
          left: 29px;
          top: -20px;
        }

        .connector-line.horizontal-to-next {
          width: 30px;
          height: 2px;
          left: 29px;
          top: -1px;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state, .no-data {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .error-state h2, .no-data h2 {
          color: #e53e3e;
          margin-bottom: 10px;
        }

        .error-state p, .no-data p {
          color: #718096;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .bracket-page {
            padding: 10px;
          }
          
          .bracket-header {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
          
          .tournament-bracket {
            gap: 40px;
          }
          
          .bracket-round {
            min-width: 180px;
          }
          
          .match-card {
            width: 160px;
          }
          
          .team-name {
            max-width: 100px;
          }
        }
      `}</style>
    </main>
  );
}