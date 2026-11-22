---
title: Open/Closed Principle
description: "Give callers a way to add shapes and other cases through a shared interface, a function argument, or singledispatch."
---

# Open/Closed Principle

::: tip What you'll learn
- What **open for extension, closed for modification** means
- Why an `isinstance` chain makes you edit working code for every new case
- How **polymorphism** turns a new case into a new class with no edits elsewhere
- Pythonic extension points: **`functools.singledispatch`**, functions as arguments and protocols
- When a plain `if` is the better choice
:::

## Why it matters

An area calculator that names every shape must change when you add a triangle. If it also does the drawing or saving, the same change can reach several parts of the program. This chapter shows how to put the area formula with the shape and have the caller use a shared method.

## The principle

> Software entities should be **open for extension** but **closed for modification**.

**Open for extension** means callers have a way to supply new behavior. **Closed for modification** means adding that kind of behavior leaves existing code in place. Choose the extension point for the kind of change you expect. A design that makes new shapes easy to add may still require edits to support a new operation on every shape.

## The violation

<SolidOcpViolation />

`AreaCalculator` asks each shape what type it is:

```python
import math

class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

class AreaCalculator:
    @staticmethod
    def calculate(shape: object) -> float:
        if isinstance(shape, Rectangle):
            return shape.width * shape.height
        if isinstance(shape, Circle):
            return math.pi * shape.radius**2
        raise TypeError(f"Unknown shape: {type(shape).__name__}")

shapes: list[object] = [Rectangle(5, 10), Circle(7)]
for s in shapes:
    print(f"{type(s).__name__}: {AreaCalculator.calculate(s):.2f}")

# Change request: support triangles
class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

try:
    AreaCalculator.calculate(Triangle(6, 8))
except TypeError as error:
    print("Error:", error)
```

```text
Rectangle: 50.00
Circle: 153.94
Error: Unknown shape: Triangle
```

**Change request:** the drawing app needs triangles. Writing `Triangle` is not enough, because the calculator only knows the types in its chain. You must open `AreaCalculator`, add a third branch and test the first two again. If `perimeter()` and `draw()` switch on type the same way, every new shape edits all three, and each of them depends on every shape's fields.

## The fix

<SolidOcpFix />

A `Shape` abstract base class states the contract, `area()`, and each shape implements it:

```python
import math
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

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius

    def area(self) -> float:
        return math.pi * self.radius**2

class Triangle(Shape):
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

    def area(self) -> float:
        return 0.5 * self.base * self.height

def total_area(shapes: list[Shape]) -> float:
    return sum(s.area() for s in shapes)

shapes: list[Shape] = [Rectangle(5, 10), Circle(7), Triangle(6, 8)]
for s in shapes:
    print(f"{type(s).__name__}: {s.area():.2f}")
print(f"Total area: {total_area(shapes):.2f}")
```

```text
Rectangle: 50.00
Circle: 153.94
Triangle: 24.00
Total area: 227.94
```

`Triangle` supplies its own formula and `total_area` still calls `area()` on each shape. An abstract base class lets you define a subclass that leaves `area()` abstract, but Python prevents you from creating an instance of that subclass.

## In everyday Python

`sorted(items, key=...)` is a familiar extension point. The caller supplies a function that chooses the sort key. The sorting implementation can use any key function with the expected signature.

If you cannot change a class to add `area()`, use `functools.singledispatch`. Register an implementation for each supported type. The dispatcher chooses based on the first argument's type.

```python
import math
from functools import singledispatch

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

@singledispatch
def area(shape: object) -> float:
    raise TypeError(f"Unknown shape: {type(shape).__name__}")

@area.register
def _(shape: Circle) -> float:
    return math.pi * shape.radius**2

# Later, in another module: triangles, without editing area()
@area.register
def _(shape: Triangle) -> float:
    return 0.5 * shape.base * shape.height

print(f"{area(Circle(7)):.2f} {area(Triangle(6, 8)):.2f}")
```

```text
153.94 24.00
```

`register` reads the type from the first parameter's annotation. Thanks to duck typing, `total_area` works with any object that has `area()`, base class or not. A `typing.Protocol` states that expectation for type checkers without inheritance; see [Interface Segregation](/en/lessons/interface-segregation).

## When not to apply it

- **The cases are few and stable.** A short conditional may be easier to follow. Add an extension point when callers need to supply new cases independently.
- **You can only close against the changes you expect.** The `Shape` design makes new shapes cheap, but a new operation such as `perimeter()` edits every shape class; the `isinstance` design is the reverse. Close the axis that actually varies.
- **Code you own, all in one place.** OCP pays off most where other people extend your code: libraries, plugins, shared modules. In a small app, editing a function and its test is often simplest.

## Try it

Add a `Square` or an `Ellipse` to `shapes`. Nothing else should need an edit.

<ClientOnly><PythonPlayground :code='"import math\nfrom abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self) -> float: ...\n\nclass Rectangle(Shape):\n    def __init__(self, width: float, height: float) -> None:\n        self.width = width\n        self.height = height\n\n    def area(self) -> float:\n        return self.width * self.height\n\nclass Circle(Shape):\n    def __init__(self, radius: float) -> None:\n        self.radius = radius\n\n    def area(self) -> float:\n        return math.pi * self.radius**2\n\nshapes: list[Shape] = [Rectangle(5, 10), Circle(7)]\nfor s in shapes:\n    print(f\"{type(s).__name__}: {s.area():.2f}\")"' /></ClientOnly>

## Common mistakes

### 1. Swapping `isinstance` for a type string

```py
class Shape:
    def __init__(self, kind: str, size: float) -> None:
        self.kind = kind
        self.size = size

def area(shape: Shape) -> float:
    if shape.kind == "square":          # Bad: the same chain, now on strings
        return shape.size**2
    if shape.kind == "circle":
        return 3.14159 * shape.size**2
    raise ValueError(f"unknown kind: {shape.kind}")

print(area(Shape("hexagon", 2)))
```

```text
ValueError: unknown kind: hexagon
```

A `kind` field with an `if` chain is still closed to extension: a hexagon means editing `area`. **Fix:** give each kind its own class with `area()`, or map each kind to a function in a dict.

### 2. A subclass that misses the contract

```py
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Hexagon(Shape):
    def get_area(self) -> float:        # Bad: the contract says area()
        return 10.39

Hexagon()
```

```text
TypeError: Can't instantiate abstract class Hexagon without an implementation for abstract method 'area'
```

Python reports the missing abstract method when the example tries to instantiate the class. Match the name and callable signature declared by the base class.

### 3. A base class that checks for its subclasses

```py
class Shape(ABC):
    def describe(self) -> str:
        if isinstance(self, Circle):    # Bad: the parent knows its children
            return "round"
        return "angular"
```

Every new round shape now edits `Shape`, the most shared class of all. **Fix:** give `Shape` a default `describe()` and let `Circle` override it.

## Practice

### 1. Add a square <Difficulty level="1" />

Using `Shape` and `total_area` from the fix, add a `Square` with a `side`. Print `total_area([Square(3), Square(4)])`.

::: details Solution
```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side**2

def total_area(shapes: list[Shape]) -> float:
    return sum(s.area() for s in shapes)

print(total_area([Square(3), Square(4)]))
```

```text
25
```
:::

### 2. A dict instead of a chain <Difficulty level="1" />

`shipping(kind, weight)` uses `if`/`elif`: a courier costs 10 + 2 per kg, the post 5 + 1 per kg. Rewrite it with a dict `RATES` from each kind to a function of the weight. Add `"pickup"` (always 0) as one new line, and print the cost of 3 kg for each kind.

::: details Solution
```python
RATES = {
    "courier": lambda weight: 10 + 2 * weight,
    "post": lambda weight: 5 + weight,
}

def shipping(kind: str, weight: float) -> float:
    return RATES[kind](weight)

RATES["pickup"] = lambda weight: 0

for kind in RATES:
    print(kind, shipping(kind, 3))
```

```text
courier 16
post 8
pickup 0
```
:::

### 3. Describe any shape <Difficulty level="2" />

Write a `singledispatch` function `describe(shape)` that returns `circle r=7` for a `Circle(7)` and `unknown shape` for anything else. Then define `Triangle` below it and register `triangle 6/8` without editing anything above. Print the result for `Circle(7)`, `Triangle(6, 8)` and `"hexagon"`.

::: details Solution
```python
from functools import singledispatch

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

@singledispatch
def describe(shape: object) -> str:
    return "unknown shape"

@describe.register
def _(shape: Circle) -> str:
    return f"circle r={shape.radius}"

class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

@describe.register
def _(shape: Triangle) -> str:
    return f"triangle {shape.base}/{shape.height}"

for shape in [Circle(7), Triangle(6, 8), "hexagon"]:
    print(describe(shape))
```

```text
circle r=7
triangle 6/8
unknown shape
```
:::

### 4. Password rules as data <Difficulty level="2" />

Write `check(password, rules)`, where `rules` is a list of `(test, message)` pairs, returning the messages of failed tests. Start with two rules, "at least 8 characters" and "needs a digit". Add a third, "needs an uppercase letter", without editing `check`. Print the result for `"salom"` and `"Salom2026"`.

::: details Solution
```python
def check(password: str, rules: list) -> list[str]:
    return [message for test, message in rules if not test(password)]

rules = [
    (lambda p: len(p) >= 8, "at least 8 characters"),
    (lambda p: any(c.isdigit() for c in p), "needs a digit"),
]
rules.append((lambda p: any(c.isupper() for c in p), "needs an uppercase letter"))

print(check("salom", rules))
print(check("Salom2026", rules))
```

```text
['at least 8 characters', 'needs a digit', 'needs an uppercase letter']
[]
```
:::

### 5. Payment methods <Difficulty level="3" />

A `pay(method, amount)` function grows an `elif` for every payment method: `"card"` returns `Card: charged AMOUNT` and `"cash"` returns `Cash: collect AMOUNT on delivery`. Replace it with an abstract `PaymentMethod` that has `pay(amount) -> str`, plus `Card` and `Cash`, and a `checkout(total, method)` that prints `method.pay(total)`. Then add `Click` (`Click: payment link sent for AMOUNT`) without editing `checkout` or the other classes. Pay 150 with each.

::: details Solution
```python
from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount: int) -> str: ...

class Card(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Card: charged {amount}"

class Cash(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Cash: collect {amount} on delivery"

def checkout(total: int, method: PaymentMethod) -> None:
    print(method.pay(total))

class Click(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Click: payment link sent for {amount}"

for method in [Card(), Cash(), Click()]:
    checkout(150, method)
```

```text
Card: charged 150
Cash: collect 150 on delivery
Click: payment link sent for 150
```

`checkout` knows only the abstraction, so the next method is again one new class.
:::

## Recap

- **Open for extension, closed for modification:** a new case is new code; tested code stays untouched.
- An `isinstance` or `kind` chain is edited for every new type and repeats across functions.
- **Polymorphism** fixes it: a `Shape` contract with `area()`, one subclass per shape, and callers that only use the contract.
- Python extension points are often **functions as arguments**, dicts of functions, `singledispatch` or duck typing.
- Add an extension point where new cases are likely. A short conditional may be easier to read for stable cases.

## Further reading

- [Robert C. Martin: The Open Closed Principle](https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html)
- [`abc`: abstract base classes](https://docs.python.org/3/library/abc.html)
- [`functools.singledispatch`](https://docs.python.org/3/library/functools.html#functools.singledispatch)
- [SOLID Principles in Python: the source examples](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/02-ocp)
