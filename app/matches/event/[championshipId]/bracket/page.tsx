"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  start_time?: number;
  status: string;
  next_match_id?: string;
  next_match_side?: "home" | "away";
};

// Your fetch function (client side)
async function fetchMatches(championshipId: string): Promise<RawMatch[]> {
  const headers = {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_FACEIT_API_KEY}`,
    Accept: "application/json",
  };

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    { headers }
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

function buildBracketTree(matches: RawMatch[]): Model.Game | null {
  if (!matches.length) return null;

  const matchMap = new Map<string, Model.Game>();

  const buildParticipant = (team: Team, winner?: string): Model.Participant => ({
    id: team.id,
    name: team.name,
    abbreviation: "",
    resultText: winner === team.id ? "W" : "",
    isWinner: winner === team.id,
  });

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

  matchMap.forEach((game) => {
    if (game.nextMatchId) {
      const nextGame = matchMap.get(game.nextMatchId);
      if (nextGame) {
        if (!nextGame.previousGames) nextGame.previousGames = [];
        nextGame.previousGames.push(game);
      }
    }
  });

  const nextIds = new Set(
    Array.from(matchMap.values())
      .map((m) => m.nextMatchId)
      .filter(Boolean) as string[]
  );

  for (const game of matchMap.values()) {
    if (!nextIds.has(game.id)) {
      return game; // root
    }
  }

  return null;
}

export default function Page() {
  const { championshipId } = useParams();

  const [tournament, setTournament] = React.useState<Model.Game | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!championshipId) return;
    fetchMatches(championshipId)
      .then((matches) => setTournament(buildBracketTree(matches)))
      .catch((e) => setError(String(e)));
  }, [championshipId]);

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <p>Error loading bracket: {error}</p>
        <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
      </main>
    );
  }

  if (!tournament) return <p>Loading bracket...</p>;

  return (
    <main>
      <nav style={{ padding: 20 }}>
        <Link href={`/matches/event/${championshipId}`} style={{ marginRight: 20 }}>
          Matches
        </Link>
        <strong>Bracket</strong>
      </nav>

      <h1 style={{ textAlign: "center" }}>Bracket</h1>

      <Bracket game={tournament} GameComponent={BracketGame} homeOnTop={true} />
    </main>
  );
}
