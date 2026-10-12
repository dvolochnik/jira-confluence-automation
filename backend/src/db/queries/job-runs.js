const INSERT_JOB_RUN = `
  INSERT INTO job_runs (
    started_at,
    finished_at,
    source,
    page_state,
    sprint_name,
    as_of_date,
    points_label,
    committed_points,
    done_points,
    blocked_count,
    overdue_count,
    unassigned_count,
    overloaded_count,
    error_code,
    http_status
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13,
    $14, $15
  )
`;

module.exports = {
  INSERT_JOB_RUN,
};
