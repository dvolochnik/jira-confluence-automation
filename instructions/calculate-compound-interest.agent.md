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
