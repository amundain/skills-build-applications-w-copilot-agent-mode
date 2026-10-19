import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((data) => {
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load workout suggestions');
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0}
      emptyMessage="No workout suggestions"
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((workout, index) => (
          <li key={`${workout.title ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{workout.title ?? 'Workout'}</strong>
            {workout.focus ? ` · ${workout.focus}` : ''}
            {workout.reason ? <div>{workout.reason}</div> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
