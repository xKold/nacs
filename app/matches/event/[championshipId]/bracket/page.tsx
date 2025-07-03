"use client";

import React from "react";
import Link from "next/link";
import { Bracket, BracketGame, Model } from "react-tournament-bracket";

type Team = {
  id: string;
  name: string;
};

type RawMatch = {
  match_id: string;
  teams: {
    faction1: Team;
    faction2: Team;
  };
  winner?: string;
  start_date?: string;
  status: string;
  next_match_id?: string;
  next_match_side?: "home" | "away";
};

type Params = Promise<{ championshipId: string }>;

// Fetch matches for a tournament (championship)
async function fetchMatches(championshipId: string): Promise<RawMatch[]> {
  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_FACEIT_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  const data = await res.json();
  return data.items as RawMatch[];
}

// Convert ISO date string to EST timestamp (milliseconds)
function toESTTimestamp(isoDate?: string): number {
  if (!isoDate) return 0;
  const utcDate = new Date(isoDate);
  // EST is UTC-5 without DST adjustments
  const estOffsetMs = 5 * 60 * 60 * 1000;
  return utcDate.getTime() - estOffsetMs;
}

// Build participant object used by react-tournament-bracket
function buildParticipant(team: Team, winnerId?: string) {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.name.slice(0, 3).toUpperCase(),
    resultText: winnerId === team.id ? "W" : "",
    isWinner: winnerId === team.id,
  };
}

// Build Game object for react-tournament-bracket from RawMatch
function buildGame(match: RawMatch): Model.Game {
  return {
    id: match.match_id,
    name: `Match ${match.match_id}`,
    scheduled: toESTTimestamp(match.start_date) || 0,
    state:
      match.status === "finished"
        ? "complete"
        : match.status === "running"
        ? "inProgress"
        : "pending",
    nextMatchId: match.next_match_id,
    nextMatchSide: match.next_match_side,
    home: buildParticipant(match.teams.faction1, match.winner),
    away: buildParticipant(match.teams.faction2, match.winner),
  };
}

// Build bracket tree from flat matches list
function buildBracketTree(matches: RawMatch[]): Model.Game | null {
  if (matches.length === 0) return null;

  // Map of match_id => Game
  const gamesMap = new Map<string, Model.Game>();

  matches.forEach((match) => {
    gamesMap.set(match.match_id, buildGame(match));
  });

  // Link previousGames (optional, some bracket libs use this)
  gamesMap.forEach((game) => {
    if (game.nextMatchId) {
      const nextGame = gamesMap.get(game.nextMatchId);
      if (nextGame) {
        // react-tournament-bracket expects previousGames as a tuple
        // but if your version doesn't support it, remove or ignore
        if (!("previousGames" in nextGame)) {
          // @ts-ignore
          nextGame.previousGames = [];
        }
        // @ts-ignore
        nextGame.previousGames.push(game);
      }
    }
  });

  // Find root game (one without nextMatchId pointing to it)
  const nextIds = new Set(
    Array.from(gamesMap.values())
      .map((g) => g.nextMatchId)
      .filter((id): id is string => !!id)
  );

  for (const game of gamesMap.values()) {
    if (!nextIds.has(game.id)) {
      return game;
    }
  }

  return null;
}

export default async function Page({ params }: { params: Params }) {
  const { championshipId } = await params;

  let rootGame: Model.Game | null = null;
  let error: string | null = null;

  try {
    const matches = await fetchMatches(championshipId);
    rootGame = buildBracketTree(matches);
  } catch (e: any) {
    error = e.message;
  }

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <p>Error loading bracket: {error}</p>
        <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
      </main>
    );
  }

  if (!rootGame) {
    return <p style={{ padding: 20 }}>No matches available or loading...</p>;
  }

  return (
    <main style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href={`/matches/event/${championshipId}`} style={{ marginRight: 20 }}>
          Matches
        </Link>
        <strong>Bracket</strong>
      </nav>

      <h1 style={{ textAlign: "center" }}>Bracket</h1>

      <Bracket game={rootGame} GameComponent={BracketGame} homeOnTop />
    </main>
  );
}
