"use client";

import React from "react";
import Link from "next/link";
import * as JSOG from "jsog";
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
  winner?: string;
  start_time?: number;
  status: string;
  next_match_id?: string;
  next_match_side?: "home" | "away";
};

// Fetch raw matches from Faceit API
async function fetchMatches(championshipId: string): Promise<RawMatch[]> {
  const headers = {
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
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

  return data.items.map((m: any) => ({
    match_id: m.match_id,
    teams: {
      faction1: m.teams?.faction1 || { id: "tbd1", name: "TBD" },
      faction2: m.teams?.faction2 || { id: "tbd2", name: "TBD" },
    },
    winner: m.winner,
    start_time: m.start_date ? new Date(m.start_date).getTime() : undefined,
    status: m.status,
    next_match_id: m.next_match_id,
    next_match_side: m.next_match_side,
  }));
}

// Convert raw matches into the structure expected by react-tournament-bracket
function buildBracketTree(matches: RawMatch[]): Model.Game | null {
  if (!matches.length) return null;

  // Map matches by ID for quick lookup
  const matchMap = new Map<string, Model.Game>();

  // Helper to build a Model.Participant
  const buildParticipant = (team: Team, winner: string | undefined): Model.Participant => ({
    id: team.id,
    name: team.name,
    abbreviation: "",
    resultText: winner === team.id ? "W" : "",
    isWinner: winner === team.id,
  });

  // Create Model.Game objects
  matches.forEach((m) => {
    matchMap.set(m.match_id, {
      id: m.match_id,
      name: `Match ${m.match_id}`,
      scheduledTime: m.start_time ? new Date(m.start_time) : undefined,
      participants: [
        buildParticipant(m.teams.faction1, m.winner),
        buildParticipant(m.teams.faction2, m.winner),
      ],
      state:
        m.status === "finished"
          ? "complete"
          : m.status === "running"
          ? "inProgress"
          : "pending",
      nextMatchId: m.next_match_id,
      nextMatchSide: m.next_match_side,
    });
  });

  // Link matches by nextMatchId
  matchMap.forEach((game) => {
    if (game.nextMatchId) {
      const nextGame = matchMap.get(game.nextMatchId);
      if (nextGame) {
        if (!nextGame.previousGames) nextGame.previousGames = [];
        nextGame.previousGames.push(game);
      }
    }
  });

  // Find root match (has no nextMatchId or isn't anyone's nextMatchId)
  const nextIds = new Set(
    Array.from(matchMap.values())
      .map((m) => m.nextMatchId)
      .filter(Boolean) as string[]
  );

  for (const game of matchMap.values()) {
    if (!nextIds.has(game.id)) {
      return game; // root match found
    }
  }

  return null;
}

type PageProps = {
  params: { championshipId: string };
};

export default async function Page({ params }: PageProps) {
  const { championshipId } = params;

  let rootMatch: Model.Game | null = null;
  let error: string | null = null;

  try {
    const rawMatches = await fetchMatches(championshipId);
    rootMatch = buildBracketTree(rawMatches);
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

  if (!rootMatch) {
    return <p>Loading bracket or no matches available...</p>;
  }

  return (
    <main>
      <nav style={{ padding: 20 }}>
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
