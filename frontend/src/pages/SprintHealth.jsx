import { useEffect, useMemo, useState } from 'react';
import GoalStatusFieldset from '../components/GoalStatusFieldset';
import AttentionList from '../components/AttentionList';
import { getSprintHealth } from '../api/sprint-health-api';

const attentionLabels = {
  blocked: 'Blocked',
  overdue: 'Overdue',
  unassigned: 'Unassigned',
  overloaded: 'Overloaded',
};

export function SprintHealth() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    getSprintHealth()
      .then((payload) => {
        if (active) {
          setData(payload);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setData(null);
          setError(loadError.message || 'The sprint could not be loaded.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const attention = useMemo(() => {
    return (data?.attention ?? []).reduce((map, item) => {
      map[item.name] = item;
      return map;
    }, {});
  }, [data]);

  const goalStatus = data?.goalStatus?.status ?? 'on_track';

  const identityText = useMemo(() => {
    if (!data) {
      return 'Sprint identity details will appear here.';
    }

    const name = data.sprint?.name ?? 'Sprint';
    const startDate = data.sprint?.startDate;
    const endDate = data.sprint?.endDate;
    const asOfDate = data.asOfDate;

    if (startDate && endDate) {
      return `${name} • ${startDate} to ${endDate} • as of ${asOfDate ?? 'unknown'}`;
    }

    return `${name} • Sprint dates are unavailable.`;
  }, [data]);

  const pointsText = useMemo(() => {
    if (!data) {
      return 'Points versus time data will appear here.';
    }

    if (data.pageState === 'dates_unavailable') {
      return 'Sprint dates are unavailable.';
    }

    const points = data.pointsVersusTime ?? {};
    const label = points.label ?? 'On track';
    const elapsedPercent = points.elapsedPercent ?? 0;
    const completedPercent = points.completedPercent ?? 0;
    const gapDisplay = points.gapDisplay ?? '0.0';

    return `${label} — ${Number(elapsedPercent).toFixed(1)}% elapsed, ${Number(completedPercent).toFixed(1)}% complete, gap ${gapDisplay}`;
  }, [data]);

  const goalText = useMemo(() => {
    if (!data) {
      return 'Sprint goal details will appear here.';
    }

    return data.sprint?.goalText?.trim() ? data.sprint.goalText : 'The goal is not set.';
  }, [data]);

  return (
    <main className="sprint-health-page">
      <h1 className="page-title">Sprint Health</h1>

      {error ? (
        <p className="error-message">{error}</p>
      ) : null}

      <section className="region" aria-label="Sprint identity">
        <h2 className="region-title">Sprint identity</h2>
        <p className="placeholder">{identityText}</p>
      </section>

      <section className="region" aria-label="Points versus time">
        <h2 className="region-title">Points versus time</h2>
        <p className="placeholder">{pointsText}</p>
      </section>

      <section className="region" aria-label="Sprint goal">
        <h2 className="region-title">Sprint goal</h2>
        <GoalStatusFieldset value={goalStatus} />
        <p className="placeholder">{goalText}</p>
      </section>

      {Object.entries(attentionLabels).map(([key, title]) => (
        <AttentionList
          key={key}
          title={title}
          count={attention[key]?.count ?? 0}
          rows={attention[key]?.rows ?? []}
          placeholder={error ? 'No issues yet.' : `${title} issues will appear here.`}
        />
      ))}
    </main>
  );
}

export default SprintHealth;
