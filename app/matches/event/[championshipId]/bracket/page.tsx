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

function toESTTimestamp(isoDate?: string): number {
  if (!isoDate) return 0;
  const utcDate = new Date(isoDate);
  return utcDate.getTime() - 5 * 60 * 60 * 1000; // EST = UTC-5
}

// Build a minimal game object with only id, name, scheduled (no nested games)
function buildGame(m: RawMatch): Model.Game {
  const faction1Name = m.teams.faction1?.name || "TBD";
  const faction2Name = m.teams.faction2?.name || "TBD";
  const winner = m.winner;

  // Embed winner label into string
  const name = `${faction1Name}${winner === m.teams.faction1?.id ? " (W)" : ""} vs ${faction2Name}${winner === m.teams.faction2?.id ? " (W)" : ""}`;

  return {
    id: m.match_id,
    name,
    scheduled: toESTTimestamp(m.start_date),
    // no previousGames, no participants, no home/away
  } as Model.Game; // cast because your Game type might be incomplete
}

export default async function Page({ params }: { params: Params }) {
  const { championshipId } = await params;

  let error: string | null = null;
  let rootGame: Model.Game | null = null;

  try {
    const matches = await fetchMatches(championshipId);
    if (matches.length) {
      // Just use the first match as the root to satisfy component for now
      rootGame = buildGame(matches[0]);
    }
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
