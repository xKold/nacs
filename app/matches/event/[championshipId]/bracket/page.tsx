import React from 'react';
import Link from 'next/link';

type Team = {
  name: string;
  avatar: string;
};

type Match = {
  match_id: string;
  teams: {
    faction1: Team;
    faction2: Team;
  };
  winner?: string;
  start_time?: number;
  status: string;
};

type Round = {
  roundNumber: number;
  matches: Match[];
};

async function fetchMatches(championshipId: string): Promise<Match[]> {
  const headers = {
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
    Accept: 'application/json',
  };

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    { headers, cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }

  const data = await res.json();

  return data.items.map((m: any) => ({
    match_id: m.match_id,
    teams: {
      faction1: m.teams?.faction1 || { name: 'TBD', avatar: '' },
      faction2: m.teams?.faction2 || { name: 'TBD', avatar: '' },
    },
    winner: m.winner,
    start_time: m.start_date ? new Date(m.start_date).getTime() : 0,
    status: m.status,
  }));
}

function groupMatchesByRound(matches: Match[]): Round[] {
  const numRounds = 3;
  const chunkSize = Math.max(Math.ceil(matches.length / numRounds), 1);

  const rounds: Round[] = [];
  for (let i = 0; i < matches.length; i += chunkSize) {
    rounds.push({
      roundNumber: rounds.length + 1,
      matches: matches.slice(i, i + chunkSize),
    });
  }
  return rounds;
}

function Bracket({ rounds }: { rounds: Round[] }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
        overflowX: 'auto',
        padding: 20,
      }}
    >
      {rounds.map((round) => (
        <div key={round.roundNumber} style={{ minWidth: 250 }}>
          <h3 style={{ textAlign: 'center', marginBottom: 20 }}>
            Round {round.roundNumber}
          </h3>
          {round.matches.map((match) => (
            <div
              key={match.match_id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                backgroundColor:
                  match.status === 'finished' ? '#e0ffe0' : '#fff',
              }}
            >
              {[match.teams.faction1, match.teams.faction2].map(
                (team, idx) => {
                  const isWinner = match.winner === team.name;
                  return (
                    <div
                      key={team.name + match.match_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: isWinner ? 'bold' : 'normal',
                        color: isWinner ? 'green' : 'inherit',
                        marginBottom: idx === 0 ? 6 : 0,
                      }}
                    >
                      {team.avatar ? (
                        <img
                          src={team.avatar}
                          alt={team.name}
                          width={32}
                          height={32}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#ccc',
                          }}
                        />
                      )}
                      <span>{team.name}</span>
                    </div>
                  );
                }
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: { championshipId: string };
}) {
  const { championshipId } = params;

  let matches: Match[] = [];
  try {
    matches = await fetchMatches(championshipId);
  } catch (err: any) {
    return (
      <main style={{ padding: 20 }}>
        <p>Error loading bracket: {err.message}</p>
        <Link href={`/matches/event/${championshipId}`}>
          Back to Matches
        </Link>
      </main>
    );
  }

  if (matches.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <p>No matches found for this championship.</p>
        <Link href={`/matches/event/${championshipId}`}>
          Back to Matches
        </Link>
      </main>
    );
  }

  const rounds = groupMatchesByRound(matches);

  return (
    <main>
      <nav style={{ padding: 20 }}>
        <Link href={`/matches/event/${championshipId}`} style={{ marginRight: 20 }}>
          Matches
        </Link>
        <strong>Bracket</strong>
      </nav>
      <h1 style={{ textAlign: 'center' }}>Bracket</h1>
      <Bracket rounds={rounds} />
    </main>
  );
}
