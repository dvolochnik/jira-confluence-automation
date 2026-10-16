export function AttentionList({ title, rows = [], count, placeholder = 'No issues yet.' }) {
  const items = Array.isArray(rows) && rows.length ? rows : [];

  function formatPoints(value) {
    if (value === null || value === undefined || value === '') return '—';
    return String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  return (
    <section className="region attention-list-region" aria-label={title}>
      <h2 className="region-title">{title}{count !== undefined ? ` (${count})` : ''}</h2>
      <ul className="attention-list">
        {items.length ? (
          items.map((item, index) => (
            <li key={`${title}-${index}`} className="attention-list-item">
              {typeof item === 'string' ? item : (
                item.key ? (
                  <article className="issue-row">
                    <p className="issue-summary">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">{item.key}</a>
                      ) : item.key}
                      {item.summary ? ` — ${item.summary}` : ''}
                    </p>
                    <p className="issue-details">
                      {item.assignee || 'Unassigned'} · {formatPoints(item.storyPoints)} points
                    </p>
                    {item.signals?.length ? (
                      <p className="issue-signals">{item.signals.join(' · ')}</p>
                    ) : null}
                    {item.dueDate ? <p className="issue-due-date">Due {item.dueDate}</p> : null}
                  </article>
                ) : (
                  <article className="issue-row">
                    <p className="issue-summary">{item.assignee}</p>
                    <p className="issue-details">{formatPoints(item.openPointsDisplay ?? item.openPoints)} points</p>
                  </article>
                )
              )}
            </li>
          ))
        ) : (
          <li className="attention-list-item attention-list-placeholder">{placeholder}</li>
        )}
      </ul>
    </section>
  );
}

export default AttentionList;
