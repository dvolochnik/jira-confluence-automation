"""Entry point that demonstrates the calculator."""

from calculator import add, subtract, multiply


def main():
    x, y = 10, 4
    print(f"{x} + {y} = {add(x, y)}")
    print(f"{x} - {y} = {subtract(x, y)}")
    print(f"{x} * {y} = {multiply(x, y)}")


if __name__ == "__main__":
    main()
