import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then((data) => {
        if (!active) return;
        setActivities(data.activities ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load activities');
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
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="No activities"
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            <strong>{activity.type ?? 'Activity'}</strong> — {activity.minutes ?? 0} min · {activity.points ?? 0} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
