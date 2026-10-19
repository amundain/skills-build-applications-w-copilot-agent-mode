import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then((data) => {
        if (!active) return;
        setTeams(data.teams ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load teams');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0}
      emptyMessage="No teams"
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Team'}</strong> · {team.members?.length ?? 0} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
