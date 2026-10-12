export function AttentionList({ title, rows = [], count, placeholder = 'No issues yet.' }) {
  const items = Array.isArray(rows) && rows.length ? rows : [];

  return (
    <section className="region attention-list-region" aria-label={title}>
      <h2 className="region-title">{title}{count !== undefined ? ` (${count})` : ''}</h2>
      <ul className="attention-list">
        {items.length ? (
          items.map((item, index) => (
            <li key={`${title}-${index}`} className="attention-list-item">
              {typeof item === 'string' ? item : item.label ?? item.key ?? 'Issue'}
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
