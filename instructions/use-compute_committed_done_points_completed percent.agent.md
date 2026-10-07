- Use `tools/compute_committed_done_points_completed percent.py` when the user asks for committed points, done points, or completed percent from issues.
- Do not compute committed points, done points, or completed percent yourself. Run the script and present its output.
- Run it from the project root. Quote the script path because the filename contains a space:
  + `python "tools/compute_committed_done_points_completed percent.py" <type> <status_category> <story_points> [...]`
- Pass each issue as three arguments, in the order given: type, status category, story points. Do not drop an issue before calling.
  + Counted types are `Story`, `Bug`, and `Task`. Matching is case-insensitive.
  + Pass other types too, including `Sub-task`, `Subtask`, `Epic`, and `User Story`. The script excludes them.
  + The second argument is the status category, not the status name. Only the category `Done` counts as done.
  + Quote a value that contains a space, such as `"In Progress"`, `"To Do"`, `"Sub-task"`, or `"User Story"`.
  + Pass story points as given, including `null`, `missing`, non-numeric values, negatives such as `-1`, and fractions such as `0.5`. The script normalizes them.
- If type, status category, or story points is missing for an issue, ask for it. Do not guess a value or invent a third argument.
- If the user gives no issues, run the script with no arguments. Completed percent is 100.
- When every counted issue normalizes to zero points, completed percent is 100. Do not replace that with 0.
- Present the script output as three lines, unchanged:
  + `Committed points: <value>`
  + `Done points: <value>`
  + `Completed percent: <value>`
- Do not recompute or round the printed values again.
- Example: a done Story of `3`, an in-progress Bug of `5`, a done Sub-task of `8`, and a done Task with `null` points.
  + Command: `python "tools/compute_committed_done_points_completed percent.py" Story Done 3 Bug "In Progress" 5 Sub-task Done 8 Task Done null`
  + Output:
    ```
    Committed points: 8
    Done points: 3
    Completed percent: 37.5
    ```
