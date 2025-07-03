'use client';

import { useEffect, useState } from 'react';
import {
  SingleEliminationBracket,
  SVGViewer
} from '@g-loot/react-tournament-brackets';
import { BracketMatch } from '@g-loot/react-tournament-brackets/dist/types';
import { mockMatches } from '@/lib/mockMatches'; // fallback for now

export default function BracketPage({
  params
}: {
  params: { championshipId: string };
}) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/matches?championshipId=${params.championshipId}`);
        const data = await res.json();

        // TODO: replace with actual Faceit mapping logic
        setMatches(data?.matches || mockMatches);
      } catch (err) {
        console.error('Failed to fetch bracket:', err);
        setMatches(mockMatches);
      }
    }

    fetchData();
  }, [params.championshipId]);

  return (
    <div style={{ width: '100%', height: '100vh', padding: '1rem' }}>
      <SingleEliminationBracket
        matches={matches}
        svgWrapper={({ children, ...props }) => (
          <SVGViewer width={1200} height={800} {...props}>
            {children}
          </SVGViewer>
        )}
        matchComponent={undefined}
      />
    </div>
  );
}