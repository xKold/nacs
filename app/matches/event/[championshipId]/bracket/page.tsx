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

// Fetch matches from Faceit API
async function fetchMatches(championshipId: string): Promise<RawMatch[]> {
  const headers = {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_FACEIT_API_KEY}`,
    Accept: "application/json",
  };

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    { headers, cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  const data = await res.json();
  return data.items as RawMatch[];
}

// Convert ISO date to EST timestamp (milliseconds)
function toESTTimestamp(isoDate?: string): number {
  if (!isoDate) return 0;
  const utcDate = new Date(isoDate);
  // EST = UTC-5 hours (no DST adjustment)
  return utcDate.getTime() - 5 * 60 * 60 * 1000;
}

function buildParticipant(team: Team, winner?: string) {
  return {
    id: team.id,
    name: team.name,
    abbreviation: "",
    isWinner: winner === team.id,
    resultText: winner === team.id ? "W" : "",
  };
}

function buildBracketTree(matches: RawMatch[]): Model.Game | null {
  if (!matches.length) return null;

  const matchMap = new Map<string, Model.Game>();

  matches.forEach((m) => {
    const game: Model.Game = {
      id: m.match_id,
      name: `Match ${m.match_id}`,
      scheduled: toESTTimestamp(m.start_date),
      home: buildParticipant(m.teams.faction1, m.winner),
      away: buildParticipant(m.teams.faction2, m.winner),
      nextMatchId: m.next_match_id,
      nextMatchSide: m.next_match_side,
      previousGames: [],
    };
    matchMap.set(m.match_id, game);
  });

  // Link previous games to next games
  matchMap.forEach((game) => {
    if (game.nextMatchId) {
      const nextGame = matchMap.get(game.nextMatchId);
      if (nextGame) {
        nextGame.previousGames = nextGame.previousGames || [];
        nextGame.previousGames.push(game);
      }
    }
  });

  // Find root game (the one no other games point to)
  const nextIds = new Set(
    Array.from(matchMap.values())
      .map((g) => g.nextMatchId)
      .filter(Boolean) as string[]
  );

  for (const game of matchMap.values()) {
    if (!nextIds.has(game.id)) {
      return game;
    }
  }

  return null;
}

export default async function Page({ params }: { params: Params }) {
  const { championshipId } = await params;

  let rootMatch: Model.Game | null = null;
  let error: string | null = null;

  try {
    const rawMatches = await fetchMatches(championshipId);
    rootMatch = buildBracketTree(rawMatches);
  } catch (e: any) {
    error = e.message || "Unknown error";
  }

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <p>Error loading bracket: {error}</p>
        <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
      </main>
    );
  }

  if (!rootMatch) {
    return <p style={{ padding: 20 }}>No matches available or still loading...</p>;
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

      <Bracket game={rootMatch} GameComponent={BracketGame} homeOnTop={true} />
    </main>
  );
}
