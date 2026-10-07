- Use `tools/normalize_story_points.py` when the user asks to normalize story points, treat null, missing, non-numeric, or negative points as zero, or sum points that include fractions such as `0.5`.
- Do not normalize or sum story points yourself. Run the script and present its output.
- Run it from the project root:
  + `python tools/normalize_story_points.py <points> [<points> ...]`
- Pass each value as its own argument, in the order given. Do not drop invalid values before calling.
  + A number such as `3` or `0.5` stays that number.
  + `0` and `0.0` stay zero.
  + `null`, `none`, `missing`, a blank value, and `nan` count as zero.
  + A non-numeric value such as `abc` counts as zero.
  + A negative value such as `-1` counts as zero. Pass it as its own argument.
- The script sums the normalized numbers. Do not round a fraction to a whole point before the total.
- If the user gives no values, run the script with no arguments. The total is zero.
- Present the script output as two lines, unchanged:
  + `Normalized: <values>`
  + `Total: <value>`
- Do not recompute or round the printed values again.
- Example: `3`, `2`, `null`, `missing`, `-1`, `abc`, `0`, and `0.5`.
  + Command: `python tools/normalize_story_points.py 3 2 null missing -1 abc 0 0.5`
  + Output:
    ```
    Normalized: 3 2 0 0 0 0 0 0.5
    Total: 5.5
    ```
