import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (!active) return;
        setLeaderboard(data.leaderboard ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load leaderboard');
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
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={leaderboard.length === 0}
      emptyMessage="No leaderboard"
    >
      <ol className="mb-0">
        {leaderboard.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`}>
            {entry.teamName ?? 'Unknown team'} — {entry.totalPoints ?? 0} pts (#{entry.rank ?? index + 1})
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
