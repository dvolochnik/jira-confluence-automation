function getSprintHealthStub() {
  return {
    pageState: 'ready',
    source: 'sample',
    goalStatus: {
      status: 'on_track',
      label: 'On track',
    },
    attention: [
      { name: 'blocked', count: 0, rows: [] },
      { name: 'overdue', count: 0, rows: [] },
      { name: 'unassigned', count: 0, rows: [] },
      { name: 'overloaded', count: 0, rows: [] },
    ],
  };
}

module.exports = { getSprintHealthStub };
