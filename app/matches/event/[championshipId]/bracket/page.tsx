"use client";

import React from "react";
import Link from "next/link";
import { Bracket, BracketGame } from "react-tournament-bracket";

export default function Page({ params }: { params: { championshipId: string } }) {
  const { championshipId } = params;
  const [rootMatch, setRootMatch] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchMatches(championshipId)
      .then((matches) => setRootMatch(buildMatchTree(matches)))
      .catch((e) => setError(e.message));
  }, [championshipId]);

  if (error) return <p>Error loading bracket: {error}</p>;
  if (!rootMatch) return <p>Loading...</p>;

  return (
    <>
      <h1>Bracket</h1>
      <Bracket game={rootMatch} GameComponent={BracketGame} homeOnTop={true} />
    </>
  );
}
