import React from "react";
import Link from "next/link";
import {
  MatchProps,
  Tournament,
  TournamentBracket,
} from "react-tournament-bracket";

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

// Build tournament tree with bye handling
function buildTournament(matches: RawMatch[]): Tournament {
  const matchMap = new Map<string, MatchProps>();

  matches.forEach((m) => {
    const team1 = m.teams.faction1;
    const team2 = m.teams.faction2;

    // Bye handling: if one team is TBD, other auto-wins
    let winner = m.winner;
    if (
      (!team1.name || team1.name === "TBD") &&
      team2.name &&
      team2.name !== "TBD"
    ) {
      winner = team2.name;
    } else if (
      (!team2.name || team2.name === "TBD") &&
      team1.name &&
      team1.name !== "TBD"
    ) {
      winner = team1.name;
    }

    matchMap.set(m.match_id, {
      id: m.match_id,
      name: `Match ${m.match_id}`,
      scheduledTime: m.start_time ? new Date(m.start_time) : undefined,
      participants: [
        {
          id: team1.name,
          name: team1.name,
          abbreviation: "",
          resultText: winner === team1.name ? "W" : "",
          isWinner: winner === team1.name,
        },
        {
          id: team2.name,
          name: team2.name,
          abbreviation: "",
          resultText: winner === team2.name ? "W" : "",
          isWinner: winner === team2.name,
        },
      ],
      state:
        m.status === "finished" || (winner && winner !== "")
          ? "complete"
          : m.status === "running"
          ? "inProgress"
          : "pending",
      nextMatchId: undefined,
      nextMatchSide: undefined,
    });
  });

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

// @ts-ignore
export default async function Page({ params }: { params: { championshipId: string } }) {
  const { championshipId } = params;
  let matches: RawMatch[] = [];
  let error: string | null = null;

  try {
    matches = await fetchMatches(championshipId);
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

  if (matches.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <p>No matches found for this championship.</p>
        <Link href={`/matches/event/${championshipId}`}>Back to Matches</Link>
      </main>
    );
  }

  const tournament = buildTournament(matches);

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
          return (
            <Link
              href={`/matches/${match.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
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
