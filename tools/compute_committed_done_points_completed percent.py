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
