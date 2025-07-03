"use client";

import React from "react";
import Link from "next/link";
import { TournamentBracket, Match, MatchProps, Tournament } from "react-tournament-bracket";

type Team = {
  name: string;
  avatar: string;
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
};

// Convert your raw matches into the tree structure needed by react-tournament-bracket

function buildTournament(matches: RawMatch[]): Tournament {
  // For simplicity, assume matches are sorted by round and then order

  // Example for 8 first round matches, then 4 quarterfinals, etc.
  // This builds a binary tree from matches by pairing winners

  const matchMap = new Map<string, MatchProps>();

  // Create leaf nodes
  matches.forEach((m) => {
    matchMap.set(m.match_id, {
      id: m.match_id,
      name: `Match ${m.match_id}`,
      scheduledTime: m.start_time ? new Date(m.start_time) : undefined,
      participants: [
        {
          id: m.teams.faction1.name,
          name: m.teams.faction1.name,
          abbreviation: "",
          resultText: m.winner === m.teams.faction1.name ? "W" : "",
          isWinner: m.winner === m.teams.faction1.name,
        },
        {
          id: m.teams.faction2.name,
          name: m.teams.faction2.name,
          abbreviation: "",
          resultText: m.winner === m.teams.faction2.name ? "W" : "",
          isWinner: m.winner === m.teams.faction2.name,
        },
      ],
      state:
        m.status === "finished"
          ? "complete"
          : m.status === "running"
          ? "inProgress"
          : "pending",
      nextMatchId: undefined,
      nextMatchSide: undefined,
    });
  });

  // You’ll need to set nextMatchId and nextMatchSide to link matches in bracket

  // For demo: naive approach — no nextMatchId, only a flat array
  // This will just render them as disconnected matches (not connected tree)

  return {
    matches: Array.from(matchMap.values()),
    tournamentName: "Championship Bracket",
  };
}

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
      faction1: m.teams?.faction1 || { name: "TBD", avatar: "" },
      faction2: m.teams?.faction2 || { name: "TBD", avatar: "" },
    },
    winner: m.winner,
    start_time: m.start_date ? new Date(m.start_date).getTime() : 0,
    status: m.status,
  }));
}

export default function Page({ params }: { params: { championshipId: string } }) {
  const { championshipId } = params;
  const [tournament, setTournament] = React.useState<Tournament | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchMatches(championshipId)
      .then((matches) => setTournament(buildTournament(matches)))
      .catch((e) => setError(e.message));
  }, [championshipId]);

  if (error)
    return (
      <main style={{ padding: 20 }}>
        <p>Error loading bracket: {error}</p>
        <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
      </main>
    );

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

      <TournamentBracket
        tournament={tournament}
        matchComponent={({ match }) => {
          // Custom match rendering with clickable link
          return (
            <Link href={`/matches/${match.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  backgroundColor: match.state === "complete" ? "#e0ffe0" : "#fff",
                  cursor: "pointer",
                }}
              >
                {match.participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: p.isWinner ? "bold" : "normal",
                      color: p.isWinner ? "green" : "inherit",
                      marginBottom: 6,
                    }}
                  >
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        }}
      />
    </main>
  );
}
