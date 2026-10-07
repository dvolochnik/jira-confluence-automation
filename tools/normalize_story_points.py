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
