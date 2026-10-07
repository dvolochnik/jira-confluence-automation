- Use `tools/elapsed_percent_and_health gap.py` when the user asks for elapsed percent, the points-versus-time gap, or the health band (On track, At risk, Off track) from sprint dates and a completed percent.
- Do not calculate elapsed percent, the gap, or the band yourself. Run the script and present its output.
- Run it from the project root. Quote the script path because the filename contains a space:
  + `python "tools/elapsed_percent_and_health gap.py" <start> <end> <today> <completed_percent>`
- Pass the four arguments in that order:
  + `start` — sprint start date as `YYYY-MM-DD`.
  + `end` — sprint end date as `YYYY-MM-DD`. Must be on or after `start`.
  + `today` — calendar date as `YYYY-MM-DD`. If the user means the current day, pass that local calendar date. Do not pass a time of day.
  + `completed_percent` — a number where `55` or `55.0` means 55 percent. Do not convert it to a decimal such as `0.55`.
- If start, end, or completed percent is missing, ask for it. Do not guess a date or a percent.
- If the user has issues and no completed percent yet, follow `./instructions/use-compute_committed_done_points_completed percent.agent.md` first, then pass the printed completed percent. Do not recompute it.
- Elapsed percent is calendar days from the sprint start to today, divided by the start-to-end day count, times 100. The script returns 0 before the start date and 100 on or after the end date. A sprint that starts and ends on the same day is 100 on or after that day and 0 before it.
- The gap is elapsed percent minus completed percent. The band uses that unrounded gap: On track when the gap is 0 or negative, At risk when the gap is greater than 0 and at most 15, Off track when the gap is greater than 15.
- A printed gap of `15.0` can still be Off track. Do not replace the printed band with a band you compute from the rounded lines.
- If the script reports that the end date is before the start date, ask for corrected dates. Do not swap them.
- Present the script output as four lines, unchanged:
  + `Elapsed percent: <value>`
  + `Completed percent: <value>`
  + `Gap: <value>`
  + `Band: <value>`
- Keep the printed one decimal place. Do not recompute, round again, or drop a trailing zero.
- Example: start `2026-10-01`, end `2026-10-11`, today `2026-10-06`, completed percent `35`.
  + Command: `python "tools/elapsed_percent_and_health gap.py" 2026-10-01 2026-10-11 2026-10-06 35`
  + Output:
    ```
    Elapsed percent: 50.0
    Completed percent: 35.0
    Gap: 15.0
    Band: At risk
    ```
- Example where the displayed gap is `15.0` and the band is Off track: start `2026-10-01`, end `2026-10-04`, today `2026-10-02`, completed percent `18.3`.
  + Command: `python "tools/elapsed_percent_and_health gap.py" 2026-10-01 2026-10-04 2026-10-02 18.3`
  + Output:
    ```
    Elapsed percent: 33.3
    Completed percent: 18.3
    Gap: 15.0
    Band: Off track
    ```
