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
