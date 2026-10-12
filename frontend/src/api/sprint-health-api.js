export async function getSprintHealth() {
  const response = await fetch('/api/sprint-health');

  if (!response.ok) {
    throw new Error('The sprint could not be loaded.');
  }

  return response.json();
}

export async function saveGoalStatus(status) {
  const response = await fetch('/api/goal-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('The goal status was not saved.');
  }

  return response.json();
}

export default {
  getSprintHealth,
  saveGoalStatus,
};
