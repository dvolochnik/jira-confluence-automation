export function GoalStatusFieldset({ value = 'on_track', disabled = false, onChange = () => {} }) {
  return (
    <fieldset className="goal-status-fieldset">
      <legend>Sprint goal status</legend>

      <label className="goal-status-option">
        <input type="radio" name="goal-status" value="on_track" checked={value === 'on_track'} disabled={disabled} onChange={() => onChange('on_track')} />
        <span>On track</span>
      </label>

      <label className="goal-status-option">
        <input type="radio" name="goal-status" value="at_risk" checked={value === 'at_risk'} disabled={disabled} onChange={() => onChange('at_risk')} />
        <span>At risk</span>
      </label>

      <label className="goal-status-option">
        <input type="radio" name="goal-status" value="off_track" checked={value === 'off_track'} disabled={disabled} onChange={() => onChange('off_track')} />
        <span>Off track</span>
      </label>
    </fieldset>
  );
}

export default GoalStatusFieldset;
