import { useEffect, useMemo, useState } from 'react';
import GoalStatusFieldset from '../components/GoalStatusFieldset';
import AttentionList from '../components/AttentionList';
import { getSprintHealth, saveGoalStatus } from '../api/sprint-health-api';

const attentionLabels = {
  blocked: 'Blocked',
  overdue: 'Overdue',
  unassigned: 'Unassigned',
  overloaded: 'Overloaded',
};

export function SprintHealth() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState(false);

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

  const attention = data?.attention ?? {};

  const goalStatus = data?.goalStatus?.status ?? 'on_track';

  async function handleGoalStatusChange(status) {
    if (status === goalStatus || savingStatus) return;
    setSavingStatus(true);
    setGoalSaveError(false);
    try {
      const saved = await saveGoalStatus(status);
      setData((current) => current
        ? { ...current, goalStatus: { status: saved.status, label: saved.label } }
        : current);
    } catch {
      setGoalSaveError(true);
    } finally {
      setSavingStatus(false);
    }
  }

  const identityText = useMemo(() => {
    if (!data) {
      return error || 'Loading the sprint.';
    }
    if (data.error) {
      return `${data.error.message}${data.error.httpStatus === 404 ? ' HTTP 404.' : ''}`;
    }

    const name = data.sprint?.name ?? 'Sprint';
    const startDate = data.sprint?.startDate;
    const endDate = data.sprint?.endDate;
    const asOfDate = data.asOfDate;

    if (startDate && endDate) {
      return `${name} • ${startDate} to ${endDate} • as of ${asOfDate ?? 'unknown'}`;
    }

    return `${name} • Sprint dates are unavailable.`;
  }, [data, error]);

  const pointsText = useMemo(() => {
    if (!data) {
      return 'Points versus time data will appear here.';
    }

    if (data.pageState === 'dates_unavailable') {
      return 'Sprint dates are unavailable.';
    }
    if (data.error) return '';

    const points = data.pointsVersusTime ?? {};
    const label = points.label ?? 'On track';
    const elapsedPercent = points.elapsedPercent ?? 0;
    const completedPercent = points.completedPercent ?? 0;
    const gapDisplay = points.gapDisplay ?? '0.0';

    return `${label} — ${elapsedPercent}% elapsed, ${completedPercent}% complete, gap ${gapDisplay}`;
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
        <GoalStatusFieldset
          value={goalStatus}
          disabled={savingStatus}
          onChange={handleGoalStatusChange}
        />
        {goalSaveError ? <p className="error-message">The goal status was not saved.</p> : null}
        <p className="placeholder">{goalText}</p>
      </section>

      {!data || data.attention ? Object.entries(attentionLabels).map(([key, title]) => (
        <AttentionList
          key={key}
          title={title}
          count={attention[key]?.count ?? 0}
          rows={attention[key]?.rows ?? []}
          placeholder={data || error ? 'Nothing needs attention.' : 'Loading the sprint.'}
        />
      )) : null}
    </main>
  );
}

export default SprintHealth;
