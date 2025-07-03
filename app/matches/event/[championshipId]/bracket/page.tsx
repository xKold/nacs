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

function toESTTimestamp(isoDate?: string): number | undefined {
  if (!isoDate) return undefined;
  const utcDate = new Date(isoDate);
  return utcDate.getTime() - 5 * 60 * 60 * 1000;
}

// Here, since `participants`/`home`/`away` not allowed, we embed team names in `name` property
function buildGame(m: RawMatch): Model.Game {
  const faction1Name = m.teams.faction1?.name || "TBD";
  const faction2Name = m.teams.faction2?.name || "TBD";
  const winner = m.winner;

  // Mark winner in name
  const matchName = `${faction1Name}${winner === m.teams.faction1?.id ? " (W)" : ""} vs ${faction2Name}${winner === m.teams.faction2?.id ? " (W)" : ""}`;

  return {
    id: m.match_id,
    name: matchName,
    scheduled: toESTTimestamp(m.start_date) || 0,
    previousGames: [],
    nextMatchId: m.next_match_id,
    nextMatchSide: m.next_match_side,
  };
}

function buildBracketTree(matches: RawMatch[]): Model.Game | null {
  if (!matches.length) return null;

  const map = new Map<string, Model.Game>();

  // Create game objects without links yet
  matches.forEach((m) => {
    map.set(m.match_id, buildGame(m));
  });

  // Link previousGames (children)
  map.forEach((game) => {
    if (game.nextMatchId) {
      const nextGame = map.get(game.nextMatchId);
      if (nextGame) {
        nextGame.previousGames = nextGame.previousGames || [];
        nextGame.previousGames.push(game);
      }
    }
  });

  // Find root (game with no one pointing to it)
  const nextIds = new Set(
    Array.from(map.values())
      .map((g) => g.nextMatchId)
      .filter(Boolean) as string[]
  );

  for (const game of map.values()) {
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
    const rawMatches = await fetchMatches(championshipId);
    rootGame = buildBracketTree(rawMatches);
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

  if (!rootGame) {
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

      <Bracket game={rootGame} GameComponent={BracketGame} homeOnTop={true} />
    </main>
  );
}
