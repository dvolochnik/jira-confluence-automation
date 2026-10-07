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
