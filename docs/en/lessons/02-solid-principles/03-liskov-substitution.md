---
title: Liskov Substitution Principle
description: "Use the rectangle and square example to see when a subtype can stand in for its base type."
---

# Liskov Substitution Principle

::: tip What you'll learn
- What **substitutable** means and which bugs the principle prevents
- Why `Square(Rectangle)` breaks code that used to work
- How to fix the hierarchy so adding `Square` changes no existing code
- How it applies to **duck typing, signatures and immutable classes** in Python
- When you do not need a shared base class at all
:::

## Why it matters

When a function accepts a `Rectangle`, it can rely on the documented operations of that type. If it can set width and height independently, a subclass has to honor that behavior. A square with linked setters shows what happens when the subclass changes the contract.

## The principle

> Subtypes must be **substitutable** for their base types without altering program correctness.

A subtype must keep the promises callers rely on. It accepts at least the inputs the base type accepts, gives the guarantees the base type gives, and preserves its invariants and allowed state changes. The idea applies to duck-typed objects too, even where the classes share no parent.

## The violation

<SolidLspViolation />

`Rectangle` lets you set the width and the height independently. `Square` inherits from it and overrides both setters to keep its sides equal:

```python
class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self._width = width
        self._height = height

    def set_width(self, width: float) -> None:
        self._width = width

    def set_height(self, height: float) -> None:
        self._height = height

    def area(self) -> float:
        return self._width * self._height

class Square(Rectangle):
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

    def set_width(self, width: float) -> None:
        self._width = width
        self._height = width  # side effect: breaks Rectangle's contract

    def set_height(self, height: float) -> None:
        self._width = height  # side effect: breaks Rectangle's contract
        self._height = height

def resize_rectangle(rect: Rectangle, width: float, height: float) -> float:
    rect.set_width(width)
    rect.set_height(height)
    expected = width * height
    actual = rect.area()
    assert actual == expected, f"LSP violation! Expected {expected}, got {actual}"
    return actual

print(f"Rectangle: {resize_rectangle(Rectangle(2, 3), 5, 10)}")
try:
    print(f"Square: {resize_rectangle(Square(5), 5, 10)}")
except AssertionError as error:
    print(f"Square: {error}")
```

```text
Rectangle: 50
Square: LSP violation! Expected 50, got 100
```

**Change request:** the drawing app needs squares, and `resize_rectangle` already exists, tested with rectangles. Geometry says a square is a rectangle, so `Square(Rectangle)` looks natural. Yet `set_height(10)` also changed the width: the area is 100, not 50. A square should keep its sides equal; the class is wrong only *as a* `Rectangle`, which promises that `set_height` leaves the width alone. Inside this design every fix is bad: an `isinstance(rect, Square)` check in each function that resizes, or a `Rectangle` that promises nothing.

## The fix

<SolidLspFix />

Both classes inherit from a common `Shape`, which promises only what both can keep: an `area()`.

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side**2

def print_area(shape: Shape) -> None:
    print(f"{type(shape).__name__}: area = {shape.area():.2f}")

shapes: list[Shape] = [Rectangle(5, 10), Square(7)]
for s in shapes:
    print_area(s)
```

```text
Rectangle: area = 50.00
Square: area = 49.00
```

`Shape` only promises `area()`, which both subclasses can provide. Code that resizes rectangles still accepts `Rectangle`. A static type checker can flag a call that passes the independent `Square` to that function.

## In everyday Python

**Duck typing follows the same rule.** A function that expects "a file" accepts any object with the right methods, so substitution still has to hold. `io.StringIO` behaves like a text file in everything `json.dump` or `print(..., file=...)` needs, so tests pass it instead of a real file, as in exercise 1.

**Signatures are part of the contract.** An override can accept extra optional arguments or return a more specific compatible type. Requiring an argument that the base method does not need breaks existing calls. Static checkers can find signature mismatches. Test the documented behavior separately.

**Returning a new object can avoid the conflict.** Here `resized()` returns a `Rectangle` and leaves the original dimensions alone. A `Square` can honor that contract.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Rectangle:
    width: float
    height: float

    def area(self) -> float:
        return self.width * self.height

    def resized(self, width: float, height: float) -> "Rectangle":
        return Rectangle(width, height)

class Square(Rectangle):
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

for shape in [Rectangle(2, 3), Square(5)]:
    print(shape, "->", shape.resized(5, 10).area())
```

```text
Rectangle(width=2, height=3) -> 50
Square(width=5, height=5) -> 50
```

The result is a 5 by 10 rectangle. The original square still has two sides of length 5.

## When not to apply it

Use a shared type when callers really need different objects to work through the same contract. The contract covers observable guarantees the caller relies on. It need not prescribe implementation details.

- **Don't invent a base class for things never used interchangeably.** If no function takes "any shape", `Rectangle` and `Square` need no parent.
- **Don't treat every detail as the contract.** A subclass may change *how* it works: a faster algorithm, extra logging, a more specific return type.
- **If you inherit only to reuse code,** prefer holding an object over being one (*Composition vs. Inheritance*).

## Try it

Run the check, then delete both overrides from `Square` and run it again. It passes, but is the object still a square?

<ClientOnly><PythonPlayground :code='"class Rectangle:\n    def __init__(self, width: float, height: float) -> None:\n        self._width = width\n        self._height = height\n\n    def set_width(self, width: float) -> None:\n        self._width = width\n\n    def set_height(self, height: float) -> None:\n        self._height = height\n\n    def area(self) -> float:\n        return self._width * self._height\n\nclass Square(Rectangle):\n    def __init__(self, side: float) -> None:\n        super().__init__(side, side)\n\n    def set_width(self, width: float) -> None:\n        self._width = self._height = width\n\n    def set_height(self, height: float) -> None:\n        self._width = self._height = height\n\ndef check(rect: Rectangle) -> str:\n    rect.set_width(4)\n    rect.set_height(5)\n    return \"ok\" if rect.area() == 20 else f\"broken, area {rect.area()}\"\n\nfor shape in [Rectangle(1, 1), Square(1)]:\n    print(type(shape).__name__, check(shape))"' /></ClientOnly>

## Common mistakes

### 1. A subclass that refuses an inherited method

```py
class Account:
    def withdraw(self, amount: int) -> str:
        return f"withdrew {amount}"

class Deposit(Account):
    def withdraw(self, amount: int) -> str:     # Bad: the parent promised this works
        raise NotImplementedError("a deposit is locked for a year")

for account in [Account(), Deposit()]:
    print(account.withdraw(100))
```

```text
withdrew 100
NotImplementedError: a deposit is locked for a year
```

Code written against `Account` expects it to support withdrawal. Move that operation to a type for accounts that allow withdrawals, as in [Interface Segregation](/en/lessons/interface-segregation).

### 2. An override with a different signature

```py
class Shape:
    def area(self) -> float:
        return 0.0

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius

    def area(self, digits: int) -> float:       # Bad: the parent needs no argument
        return round(3.14159 * self.radius**2, digits)

for shape in [Shape(), Circle(2)]:
    print(shape.area())
```

```text
0.0
TypeError: Circle.area() missing 1 required positional argument: 'digits'
```

**Fix:** give the new parameter a default, `digits: int = 2`, so every call that works on the parent works on the child.

### 3. Returning a different type

```py
class Shape:
    def area(self) -> float:
        return 49.0

class Triangle(Shape):
    def area(self) -> str:  # callers expect a number
        return "24.0 cm2"

print(sum(shape.area() for shape in [Shape(), Triangle()]))
```

```text
TypeError: unsupported operand type(s) for +: 'float' and 'str'
```

`sum()` expects numbers and receives a string for one shape. Return a number from `area()` and add units when presenting it to the reader.

## Practice

### 1. Let the file stand in <Difficulty level="1" />

Write `write_report(lines, file)` that writes each line plus `"\n"` with `file.write`. Pass an `io.StringIO` instead of a real file and print what was written for `["Rectangle 50", "Square 49"]`.

::: details Solution
```python
import io

def write_report(lines: list[str], file: io.TextIOBase) -> None:
    for line in lines:
        file.write(line + "\n")

buffer = io.StringIO()
write_report(["Rectangle 50", "Square 49"], buffer)
print(buffer.getvalue(), end="")
```

```text
Rectangle 50
Square 49
```
:::

### 2. Fix the signature <Difficulty level="1" />

`Notifier.send(message)` returns `log: MESSAGE`. Its subclass `SmsNotifier` has `send(self, message, phone)`, so calling `send(message)` on every notifier crashes. Move `phone` into `SmsNotifier.__init__` and send `Order shipped` through `Notifier()` and `SmsNotifier("+998901234567")`.

::: details Solution
```python
class Notifier:
    def send(self, message: str) -> str:
        return f"log: {message}"

class SmsNotifier(Notifier):
    def __init__(self, phone: str) -> None:
        self.phone = phone

    def send(self, message: str) -> str:
        return f"SMS to {self.phone}: {message}"

for notifier in [Notifier(), SmsNotifier("+998901234567")]:
    print(notifier.send("Order shipped"))
```

```text
log: Order shipped
SMS to +998901234567: Order shipped
```
:::

### 3. Accounts that keep their promise <Difficulty level="2" />

Fix common mistake 1, with balances: `Account` holds only `balance`, `WithdrawableAccount(Account)` adds `withdraw`, and `Deposit` inherits from `Account`. Write `pay_bills(accounts)` that takes 100 from each account. Run it on `WithdrawableAccount(500)`, then print its balance and that of `Deposit(1000)`.

::: details Solution
```python
class Account:
    def __init__(self, balance: int) -> None:
        self.balance = balance

class WithdrawableAccount(Account):
    def withdraw(self, amount: int) -> None:
        self.balance -= amount

class Deposit(Account):
    pass

def pay_bills(accounts: list[WithdrawableAccount]) -> None:
    for account in accounts:
        account.withdraw(100)

current, deposit = WithdrawableAccount(500), Deposit(1000)
pay_bills([current])
print(current.balance, deposit.balance)
```

```text
400 1000
```

A type checker now rejects `pay_bills([deposit])`.
:::

### 4. A contract test for discounts <Difficulty level="2" />

Every `Discount.apply(total)` promises a result between 0 and `total`. Write `check(discount)` that tries totals 0, 50 and 250 and returns `ok` or `broken at TOTAL`. Run it on `FlatFifty` (returns `total - 50`) and `SafeFlatFifty` (never below 0).

::: details Solution
```python
class Discount:
    def apply(self, total: float) -> float:
        return total

class FlatFifty(Discount):
    def apply(self, total: float) -> float:
        return total - 50

class SafeFlatFifty(Discount):
    def apply(self, total: float) -> float:
        return max(total - 50, 0)

def check(discount: Discount) -> str:
    for total in [0, 50, 250]:
        if not 0 <= discount.apply(total) <= total:
            return f"broken at {total}"
    return "ok"

for discount in [FlatFifty(), SafeFlatFifty()]:
    print(type(discount).__name__, check(discount))
```

```text
FlatFifty broken at 0
SafeFlatFifty ok
```
:::

### 5. Make the limit part of the contract <Difficulty level="3" />

`Shipping.cost(weight)` accepts any weight and returns `5 + weight`. `Courier(Shipping)` returns `10 + 2 * weight` but raises `ValueError` above 20 kg, so quoting every option for 25 kg crashes. Add `max_weight` (`math.inf` in `Shipping`, 20 in `Courier`) and write `quotes(options, weight)` returning `NAME: COST` for options that accept the weight. Print quotes for 3 and 25 kg.

::: details Solution
```python
import math

class Shipping:
    max_weight = math.inf

    def cost(self, weight: float) -> float:
        return 5 + weight

class Courier(Shipping):
    max_weight = 20

    def cost(self, weight: float) -> float:
        if weight > self.max_weight:
            raise ValueError("too heavy for a courier")
        return 10 + 2 * weight

def quotes(options: list[Shipping], weight: float) -> list[str]:
    return [f"{type(o).__name__}: {o.cost(weight)}" for o in options if weight <= o.max_weight]

options = [Shipping(), Courier()]
print(quotes(options, 3))
print(quotes(options, 25))
```

```text
['Shipping: 8', 'Courier: 16']
['Shipping: 30']
```

Courier still rejects heavy parcels, but the base class now says a limit may exist, and callers rely on that.
:::

## Recap

- A subclass must be **substitutable**: code written for the parent keeps working with the child.
- `Square(Rectangle)` with linked setters breaks the rectangle's promise.
- Fix the hierarchy: a common `Shape` promises only what all shapes keep, and `Square` stops being a `Rectangle`.
- Keep **signatures and return types** compatible; mypy checks those, tests check behavior.
- Duck typing follows the same rule; immutable classes avoid many violations.

## Further reading

- [Barbara Liskov and Jeannette Wing: A Behavioral Notion of Subtyping](https://dl.acm.org/doi/10.1145/197320.197383)
- [mypy: Overriding statically typed methods](https://mypy.readthedocs.io/en/stable/class_basics.html#overriding-statically-typed-methods)
- [`io.StringIO`](https://docs.python.org/3/library/io.html#io.StringIO)
- [SOLID Principles in Python: the source examples](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/03-lsp)
