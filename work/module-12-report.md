# Module 12 Completion Report

## Instruction File
- Filename: instructions/calculate-compound-interest.agent.md

- Use `tools/compound_interest.py` when the user asks for compound interest, a final amount, or interest earned from a principal, an annual rate, a compounding frequency, and a number of years.
- Do not calculate compound interest yourself. Run the script and present its output.
- Run it from the project root:
  + `python tools/compound_interest.py <principal> <annual_rate> <compounds_per_year> <years>`
- Pass the four arguments in that order:
  + `principal` — starting amount, greater than 0.
  + `annual_rate` — decimal rate. `0.05` means 5%. Convert a percent such as `5` or `5%` to a decimal before calling.
  + `compounds_per_year` — integer of at least 1. Use `1` for annual, `4` for quarterly, `12` for monthly, and `365` for daily.
  + `years` — time invested, greater than 0.
- If principal, rate, compounding frequency, or years is missing, ask for it. Do not guess a value.
- Present the script output as two lines, unchanged:
  + `Final amount: <value>`
  + `Interest earned: <value>`
- Keep the printed two decimal places. Do not recompute, round again, or add a currency symbol unless the user asks for one.
- Example: 1000 at 5% compounded monthly for 10 years.
  + Command: `python tools/compound_interest.py 1000 0.05 12 10`
  + Output:
    ```
    Final amount: 1647.01
    Interest earned: 647.01
    ```
## Script File
- Filename: tools/compound_interest.py
- Language: Python

"""Calculate compound interest from command-line inputs."""

import argparse


def compound_interest(principal, annual_rate, compounds_per_year, years):
    """Return the final amount and interest earned.

    Uses A = P * (1 + r/n) ** (n*t), where r is a decimal annual rate.
    """
    growth = (1 + annual_rate / compounds_per_year) ** (compounds_per_year * years)
    final_amount = principal * growth
    interest_earned = final_amount - principal
    return final_amount, interest_earned


def parse_args(argv=None):
    """Parse principal, annual rate, compounds per year, and years."""
    parser = argparse.ArgumentParser(description="Calculate compound interest.")
    parser.add_argument(
        "principal",
        type=float,
        help="Starting amount (must be greater than 0)",
    )
    parser.add_argument(
        "annual_rate",
        type=float,
        help="Annual interest rate as a decimal (0.05 for 5%%)",
    )
    parser.add_argument(
        "compounds_per_year",
        type=int,
        help="Number of times interest is compounded per year (must be at least 1)",
    )
    parser.add_argument(
        "years",
        type=float,
        help="Number of years the money is invested (must be greater than 0)",
    )
    args = parser.parse_args(argv)
    if args.principal <= 0:
        parser.error("principal must be greater than 0")
    if args.annual_rate < 0:
        parser.error("annual_rate must be 0 or greater")
    if args.compounds_per_year < 1:
        parser.error("compounds_per_year must be at least 1")
    if args.years <= 0:
        parser.error("years must be greater than 0")
    return args


def main(argv=None):
    args = parse_args(argv)
    final_amount, interest_earned = compound_interest(
        args.principal,
        args.annual_rate,
        args.compounds_per_year,
        args.years,
    )
    print(f"Final amount: {final_amount:.2f}")
    print(f"Interest earned: {interest_earned:.2f}")


if __name__ == "__main__":
    main()
## Script Execution Output

```
python tools/compound_interest.py --help

usage: compound_interest.py [-h]
                            principal annual_rate compounds_per_year years

Calculate compound interest.

positional arguments:
  principal           Starting amount (must be greater than 0)
  annual_rate         Annual interest rate as a decimal (0.05 for 5%)
  compounds_per_year  Number of times interest is compounded per year (must be
                      at least 1)
  years               Number of years the money is invested (must be greater
                      than 0)

options:
  -h, --help          show this help message and exit
```

## Instruction File
- Filename: instructions/use-normalize_story_points.agent.md

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
## Script File
- Filename: tools/normalize_story_points.py
- Language: Python

"""Normalize story points from command-line inputs and print their sum."""

import argparse
import math
import sys
from decimal import Decimal, InvalidOperation

_MISSING = {"", "null", "none", "missing", "nan"}


def normalize_story_point(value):
    """Return a story-point value that can be summed.

    Null, missing, non-numeric, and negative values become zero.
    A stored zero stays zero. Fractional values such as 0.5 stay fractional.
    """
    if value is None or isinstance(value, bool):
        return Decimal(0)

    if isinstance(value, Decimal):
        number = value
    elif isinstance(value, int):
        number = Decimal(value)
    elif isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return Decimal(0)
        number = Decimal(str(value))
    else:
        text = str(value).strip()
        if text.lower() in _MISSING:
            return Decimal(0)
        try:
            number = Decimal(text)
        except InvalidOperation:
            return Decimal(0)

    if not number.is_finite() or number < 0:
        return Decimal(0)
    return number


def sum_story_points(values):
    """Normalize each value, then sum without rounding first."""
    normalized = [normalize_story_point(value) for value in values]
    total = sum(normalized, Decimal(0))
    return normalized, total


def format_points(value):
    """Format a point value without changing the number that was summed."""
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def parse_args(argv=None):
    """Parse story-point values from the command line.

    Every argument is a point value, including negatives such as -1.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Normalize story points and print their sum. "
            "Null, missing, non-numeric, and negative values count as zero."
        )
    )
    parser.add_argument(
        "points",
        nargs="*",
        help=(
            "Story point values. null, missing, non-numeric, and negative "
            "values count as zero. A stored zero stays zero. "
            "Fractional values such as 0.5 are summed as numbers."
        ),
    )
    if argv is None:
        argv = sys.argv[1:]
    if argv[:1] == ["--"]:
        argv = argv[1:]
    if argv and argv[0] in ("-h", "--help"):
        parser.parse_args(argv)
    return argparse.Namespace(points=list(argv))


def main(argv=None):
    args = parse_args(argv)
    normalized, total = sum_story_points(args.points)
    rendered = " ".join(format_points(value) for value in normalized)
    print(f"Normalized: {rendered}")
    print(f"Total: {format_points(total)}")


if __name__ == "__main__":
    main()
## Script Execution Output

```
python tools/normalize_story_points.py --help

usage: normalize_story_points.py [-h] [points ...]

Normalize story points and print their sum. Null, missing, non-numeric, and
negative values count as zero.

positional arguments:
  points      Story point values. null, missing, non-numeric, and negative
              values count as zero. A stored zero stays zero. Fractional
              values such as 0.5 are summed as numbers.

options:
  -h, --help  show this help message and exit
```

## Instruction File
- Filename: instructions/use-compute_committed_done_points_completed percent.agent.md

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
## Script File
- Filename: tools/compute_committed_done_points_completed percent.py
- Language: Python

"""Compute committed points, done points, and completed percent."""

import argparse
import importlib.util
import sys
from decimal import Decimal
from pathlib import Path

_NORMALIZE_PATH = Path(__file__).resolve().parent / "normalize_story_points.py"
_spec = importlib.util.spec_from_file_location("normalize_story_points", _NORMALIZE_PATH)
_normalize = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_normalize)

normalize_story_point = _normalize.normalize_story_point
format_points = _normalize.format_points

_COUNTED_TYPES = {"story", "bug", "task"}
_DONE_CATEGORY = "Done"


def is_counted(issue_type):
    """Stories, bugs, and tasks count. Match the type name, case-insensitive."""
    return str(issue_type).strip().lower() in _COUNTED_TYPES


def is_done(status_category):
    """Done means status category Done, not a status name."""
    return str(status_category).strip() == _DONE_CATEGORY


def compute_completed(issues):
    """Return committed points, done points, and completed percent.

    Committed points are the sum of normalized points on counted issues.
    Done points are that sum for issues whose status category is Done.
    When committed points are zero, completed percent is 100.
    """
    committed = Decimal(0)
    done = Decimal(0)
    for issue_type, status_category, points in issues:
        if not is_counted(issue_type):
            continue
        normalized = normalize_story_point(points)
        committed += normalized
        if is_done(status_category):
            done += normalized
    if committed == 0:
        completed_percent = Decimal(100)
    else:
        completed_percent = (done / committed) * Decimal(100)
    return committed, done, completed_percent


def parse_args(argv=None):
    """Parse issues as repeating triples: type, status category, story points.

    Every remaining argument is data, including negative point values such as -1.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Compute committed points, done points, and completed percent. "
            "Counted issues are Story, Bug, and Task. "
            "When committed points are zero, completed percent is 100."
        )
    )
    parser.add_argument(
        "issues",
        nargs="*",
        help=(
            "Issues as repeating triples: type, status category, story points. "
            'Example: Story Done 3 Bug "In Progress" 5'
        ),
    )
    if argv is None:
        argv = sys.argv[1:]
    if argv[:1] == ["--"]:
        argv = argv[1:]
    if argv and argv[0] in ("-h", "--help"):
        parser.parse_args(argv)
    if len(argv) % 3 != 0:
        parser.error(
            "issues must be triples: <type> <status_category> <story_points>"
        )
    issues = [
        (argv[index], argv[index + 1], argv[index + 2])
        for index in range(0, len(argv), 3)
    ]
    return argparse.Namespace(issues=issues)


def main(argv=None):
    args = parse_args(argv)
    committed, done, completed_percent = compute_completed(args.issues)
    print(f"Committed points: {format_points(committed)}")
    print(f"Done points: {format_points(done)}")
    print(f"Completed percent: {format_points(completed_percent)}")


if __name__ == "__main__":
    main()
## Script Execution Output

```
python "tools/compute_committed_done_points_completed percent.py" --help

usage: compute_committed_done_points_completed percent.py [-h] [issues ...]

Compute committed points, done points, and completed percent. Counted issues
are Story, Bug, and Task. When committed points are zero, completed percent is
100.

positional arguments:
  issues      Issues as repeating triples: type, status category, story
              points. Example: Story Done 3 Bug "In Progress" 5

options:
  -h, --help  show this help message and exit
```

## Instruction File
- Filename: instructions/elapsed_percent_and_health gap.agent.md

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
## Script File
- Filename: tools/elapsed_percent_and_health gap.py
- Language: Python

"""Calculate elapsed percent, the points-versus-time gap, and the health band."""

import argparse
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def parse_date(value):
    """Parse a calendar date as YYYY-MM-DD."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            f"invalid date {value!r}; use YYYY-MM-DD"
        ) from exc


def parse_percent(value):
    """Parse a percent as a number. 55 and 55.0 both mean 55 percent."""
    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError(
            f"invalid completed percent {value!r}"
        ) from exc
    if not number.is_finite():
        raise argparse.ArgumentTypeError(
            f"invalid completed percent {value!r}"
        )
    return number


def elapsed_percent(start, end, today):
    """Return elapsed percent from calendar days.

    Day count is the end date minus the start date. The portion passed is
    today minus the start date. Elapsed percent is that portion divided by
    the day count, times 100.

    Elapsed percent is 0 before the start date and 100 on or after the end
    date. If the start and end dates are the same day, elapsed percent is
    100 on or after that day and 0 before it.
    """
    if today < start:
        return Decimal(0)
    if today >= end:
        return Decimal(100)
    day_count = Decimal((end - start).days)
    portion_passed = Decimal((today - start).days)
    return (portion_passed / day_count) * Decimal(100)


def health_gap(elapsed, completed):
    """Return elapsed percent minus completed percent, unrounded."""
    return elapsed - completed


def health_band(gap):
    """Band from the unrounded gap.

    On track when the gap is 0 or negative. At risk when the gap is greater
    than 0 and at most 15. Off track when the gap is greater than 15.
    """
    if gap <= 0:
        return "On track"
    if gap <= 15:
        return "At risk"
    return "Off track"


def format_one_decimal(value):
    """Round a percent for display. The band does not use this value."""
    rounded = value.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    return format(rounded, "f")


def parse_args(argv=None):
    """Parse sprint start, sprint end, today, and completed percent."""
    parser = argparse.ArgumentParser(
        description=(
            "Calculate elapsed percent from calendar days, then the gap "
            "and health band. Elapsed percent is days from the sprint start "
            "to today, divided by the start-to-end day count, times 100. "
            "The gap is elapsed percent minus completed percent. "
            "The band uses that unrounded gap."
        )
    )
    parser.add_argument(
        "start",
        type=parse_date,
        help="Sprint start date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "end",
        type=parse_date,
        help="Sprint end date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "today",
        type=parse_date,
        help="Today as a calendar date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "completed_percent",
        type=parse_percent,
        help="Completed percent (55 or 55.0 means 55 percent)",
    )
    args = parser.parse_args(argv)
    if args.end < args.start:
        parser.error("end date must be on or after the start date")
    return args


def main(argv=None):
    args = parse_args(argv)
    elapsed = elapsed_percent(args.start, args.end, args.today)
    gap = health_gap(elapsed, args.completed_percent)
    band = health_band(gap)
    print(f"Elapsed percent: {format_one_decimal(elapsed)}")
    print(f"Completed percent: {format_one_decimal(args.completed_percent)}")
    print(f"Gap: {format_one_decimal(gap)}")
    print(f"Band: {band}")


if __name__ == "__main__":
    main()
## Script Execution Output

```
python "tools/elapsed_percent_and_health gap.py" --help

usage: elapsed_percent_and_health gap.py [-h]
                                         start end today completed_percent

Calculate elapsed percent from calendar days, then the gap and health band.
Elapsed percent is days from the sprint start to today, divided by the start-
to-end day count, times 100. The gap is elapsed percent minus completed
percent. The band uses that unrounded gap.

positional arguments:
  start              Sprint start date (YYYY-MM-DD)
  end                Sprint end date (YYYY-MM-DD)
  today              Today as a calendar date (YYYY-MM-DD)
  completed_percent  Completed percent (55 or 55.0 means 55 percent)

options:
  -h, --help         show this help message and exit
```

