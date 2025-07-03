"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bracket, BracketGame, Model } from "react-tournament-bracket";

type Team = {
  id: string;
  name: string;
  avatar?: string;
};

type RawMatch = {
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

type Params = Promise<{ championshipId: string }>;

// Fetch matches for a tournament
async function fetchMatches(championshipId: string): Promise<RawMatch[]> {
  const res = await fetch(
    `/api/matches?championshipId=${championshipId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  const data = await res.json();
  return data.items as RawMatch[];
}

// Convert timestamp to readable date
function formatMatchTime(timestamp?: number): string {
  if (!timestamp) return "";
  
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

// Build participant for react-tournament-bracket
function buildParticipant(team: Team, score?: number, isWinner?: boolean): Model.Participant {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.name.substring(0, 3).toUpperCase(),
    resultText: score !== undefined ? score.toString() : "",
    isWinner: isWinner || false,
    status: isWinner ? "won" : undefined,
  };
}

// Build Game for react-tournament-bracket
function buildGame(match: RawMatch): Model.Game {
  const isFinished = match.status === "finished";
  const winner = match.results?.winner;
  
  const homeScore = match.results?.score.faction1;
  const awayScore = match.results?.score.faction2;
  
  const homeWins = winner === match.teams.faction1.id;
  const awayWins = winner === match.teams.faction2.id;

  return {
    id: match.match_id,
    name: `${match.teams.faction1.name} vs ${match.teams.faction2.name}`,
    scheduled: match.started_at ? match.started_at * 1000 : Date.now(),
    sides: {
      home: buildParticipant(match.teams.faction1, homeScore, homeWins),
      visitor: buildParticipant(match.teams.faction2, awayScore, awayWins),
    },
    state: isFinished ? "complete" : match.status === "ongoing" ? "inProgress" : "scheduled",
  };
}

// Create bracket structure for single elimination
function createBracketStructure(matches: RawMatch[]): Model.Game | null {
  if (matches.length === 0) return null;

  // Sort matches by round and position
  const sortedMatches = matches.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

  // Group matches by round
  const rounds: RawMatch[][] = [];
  let currentRound = -1;
  
  sortedMatches.forEach((match) => {
    if (match.round !== currentRound) {
      currentRound = match.round;
      rounds.push([]);
    }
    rounds[rounds.length - 1].push(match);
  });

  if (rounds.length === 0) return null;

  // Build the bracket tree recursively
  function buildRound(roundIndex: number, matchIndex: number): Model.Game | null {
    if (roundIndex >= rounds.length) return null;
    
    const match = rounds[roundIndex][matchIndex];
    if (!match) return null;

    const game = buildGame(match);
    
    // For single elimination, each game connects to the next round
    if (roundIndex < rounds.length - 1) {
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const nextRoundGame = buildRound(roundIndex + 1, nextMatchIndex);
      
      if (nextRoundGame) {
        // Connect this game to the next round
        game.nextMatchId = nextRoundGame.id;
        
        // Add previous games to the next round game
        if (!nextRoundGame.previousGames) {
          nextRoundGame.previousGames = [];
        }
        nextRoundGame.previousGames.push(game);
      }
    }

    return game;
  }

  // Start building from the first round, first match
  const bracket = buildRound(0, 0);
  
  // If we have multiple matches in the first round, we need to build them all
  if (rounds[0].length > 1) {
    // For single elimination, we need to find the final match
    const finalRound = rounds[rounds.length - 1];
    if (finalRound.length > 0) {
      return buildGame(finalRound[0]);
    }
  }

  return bracket;
}

// Custom Game Component with better styling
function CustomBracketGame({ game, ...props }: { game: Model.Game; [key: string]: any }) {
  const isComplete = game.state === "complete";
  const isInProgress = game.state === "inProgress";
  
  return (
    <div className="custom-bracket-game">
      <div className="game-header">
        <span className="game-time">
          {game.scheduled ? formatMatchTime(game.scheduled / 1000) : "TBD"}
        </span>
        <span className={`game-status ${game.state}`}>
          {isComplete ? "Final" : isInProgress ? "Live" : "Scheduled"}
        </span>
      </div>
      
      <div className="game-teams">
        <div className={`team ${game.sides.home.isWinner ? 'winner' : ''}`}>
          <span className="team-name">{game.sides.home.name}</span>
          <span className="team-score">{game.sides.home.resultText}</span>
        </div>
        
        <div className={`team ${game.sides.visitor.isWinner ? 'winner' : ''}`}>
          <span className="team-name">{game.sides.visitor.name}</span>
          <span className="team-score">{game.sides.visitor.resultText}</span>
        </div>
      </div>
      
      <style jsx>{`
        .custom-bracket-game {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.75em;
        }
        
        .game-time {
          color: #718096;
          font-weight: 500;
        }
        
        .game-status {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.7em;
        }
        
        .game-status.complete {
          background: #c6f6d5;
          color: #2f855a;
        }
        
        .game-status.inProgress {
          background: #fed7d7;
          color: #c53030;
        }
        
        .game-status.scheduled {
          background: #e2e8f0;
          color: #4a5568;
        }
        
        .game-teams {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .team {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
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
      `}</style>
    </div>
  );
}

export default function BracketPage({ params }: { params: Params }) {
  const [championshipId, setChampionshipId] = useState<string>("");
  const [bracketGame, setBracketGame] = useState<Model.Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const resolvedParams = await params;
        setChampionshipId(resolvedParams.championshipId);
        
        const matches = await fetchMatches(resolvedParams.championshipId);
        const bracket = createBracketStructure(matches);
        setBracketGame(bracket);
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

  if (!bracketGame) {
    return (
      <main className="bracket-page">
        <div className="no-data">
          <h2>No bracket data available</h2>
          <p>This tournament may not have started yet.</p>
          <Link href={`/matches/event/${championshipId}`} className="back-link">
            ← Back to Matches
          </Link>
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
          <span>Single Elimination Tournament</span>
        </div>
      </header>

      <div className="bracket-container">
        <Bracket 
          game={bracketGame} 
          GameComponent={CustomBracketGame}
          homeOnTop={true}
        />
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

        .bracket-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
          min-height: 400px;
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
          
          .bracket-container {
            padding: 15px;
          }
        }
      `}</style>
    </main>
  );
}