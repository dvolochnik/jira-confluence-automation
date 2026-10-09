# Module 15 Completion Report

## Script Metadata
- Filename: tools/bulk_process_files.py
- Language: Python
- Purpose: Reads every file in a directory that matches a glob, then either counts lines and characters or writes an uppercase or lowercase copy of each file.

## Script Contents
```python
"""Process every matching file in a directory."""

import argparse
import fnmatch
import sys
from pathlib import Path


OPERATIONS = ("line-count", "uppercase", "lowercase")


def transform(text, operation):
    """Return a summary line and optional replacement text."""
    if operation == "line-count":
        line_count = len(text.splitlines())
        return f"{line_count} lines, {len(text)} characters", None
    if operation == "uppercase":
        updated = text.upper()
        return f"{len(updated)} characters written in uppercase", updated
    if operation == "lowercase":
        updated = text.lower()
        return f"{len(updated)} characters written in lowercase", updated
    raise ValueError(f"Unknown operation: {operation}")


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description=(
            "Process every matching file in a directory. "
            "line-count prints a summary. uppercase and lowercase "
            "write transformed copies."
        )
    )
    parser.add_argument(
        "input_dir",
        help="Directory that holds the files to process.",
    )
    parser.add_argument(
        "--pattern",
        default="*.txt",
        help="Glob matched against each file name. Default: *.txt",
    )
    parser.add_argument(
        "--operation",
        default="line-count",
        choices=OPERATIONS,
        help="Transformation to apply. Default: line-count",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help=(
            "Directory for transformed copies. "
            "Required for uppercase and lowercase. "
            "Ignored by line-count."
        ),
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    source = Path(args.input_dir)
    if not source.is_dir():
        print(f"Input directory not found: {source}", file=sys.stderr)
        return 1

    needs_output = args.operation in ("uppercase", "lowercase")
    if needs_output and not args.output_dir:
        print(
            f"--output-dir is required for {args.operation}",
            file=sys.stderr,
        )
        return 1

    output_dir = Path(args.output_dir) if args.output_dir else None
    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        path
        for path in source.iterdir()
        if path.is_file() and fnmatch.fnmatch(path.name, args.pattern)
    )

    processed = 0
    failed = 0
    for path in files:
        try:
            text = path.read_text(encoding="utf-8")
            summary, updated = transform(text, args.operation)
        except (OSError, UnicodeError) as error:
            print(f"{path.name}: ERROR {error}")
            failed += 1
            continue
        if updated is not None:
            destination = output_dir / path.name
            destination.write_text(updated, encoding="utf-8", newline="\n")
            print(f"{path.name}: {summary} -> {destination}")
        else:
            print(f"{path.name}: {summary}")
        processed += 1

    print(f"Processed {processed} files")
    if failed:
        print(f"Failed {failed} files")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| input_dir | Directory that holds the files to process | (required) |
| --pattern | Glob matched against each file name | *.txt |
| --operation | Transformation: line-count, uppercase, or lowercase | line-count |
| --output-dir | Directory for transformed copies. Required for uppercase and lowercase | none |

## Test Run Output
Command:

```
python tools/bulk_process_files.py work/module-15-fixtures --pattern "*.txt" --operation line-count
```

Output:

```
alpha.txt: 2 lines, 26 characters
beta.txt: 3 lines, 27 characters
gamma.txt: 1 lines, 22 characters
Processed 3 files
```
