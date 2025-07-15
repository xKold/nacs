// ./static/events.ts
export type Event = {
  id: string;
  name: string;
  region: string;
  startDate: string;
  type: 'championship' | 'league';
  leagueId?: string;
  seasonId?: string;
};

export const events: Event[] = [
  {
    id: 'f56331e8-131a-4c50-b7db-eec8b010ff98',
    name: 'Off Season Shenanigans S8',
    region: 'North America',
    startDate: '2025-06-01',
    type: 'championship',
  },
  {
    id: '81e36970-81ec-4e53-b2af-c0a1c0b52938',
    name: 'Off Season Shenanigans S8 Playoffs',
    region: 'North America',
    startDate: '2025-07-01',
    type: 'championship',
  },
  {
    id: 'S54',
    name: 'ESEA Season 54',
    region: 'North America',
    startDate: '2025-07-10',
    type: 'league',
    leagueId: 'a14b8616-45b9-4581-8637-4dfd0b5f6af8',
    seasonId: '3de05c27-da01-4ede-9319-f5b3f16dfb1f',
  }
];

export function getEventById(id: string): Event | undefined {
  return events.find(event => event.id === id);
}

export function getEventByLeagueAndSeason(leagueId: string, seasonId: string): Event | undefined {
  return events.find(event => 
    event.type === 'league' && 
    event.leagueId === leagueId && 
    event.seasonId === seasonId
  );
}