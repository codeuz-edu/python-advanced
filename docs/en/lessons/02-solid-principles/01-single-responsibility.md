---
title: Single Responsibility Principle
description: "Separate pricing, discount rules, and storage according to the reasons each part changes."
---

# Single Responsibility Principle

::: tip What you'll learn
- What **one reason to change** means and which problem it prevents
- How to spot a class that mixes **calculation, business rules and storage**
- How to split it so a change request touches **one class**
- How it looks in everyday Python: **functions and modules**
- When splitting further is **over-engineering**
:::

## Why it matters

A checkout program may calculate prices, apply discounts, and save an order. If one class owns all three jobs, a change to a promotion and a change to the database both lead to the same code. This first principle in the [SOLID unit](/en/solid) helps you decide where each change belongs.

## The principle

> A class should have only one reason to change.

A responsibility is a source of change. In this example, finance sets the pricing formula, marketing sets discounts, and the platform team maintains storage. The principle groups code by whose requirements it serves. Several methods can have one responsibility when they respond to the same requirements.

## The violation

<SolidSrpViolation />

This `Order` does all three jobs, and its constructor runs them in a row:

```python
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    price: float
    quantity: int

class Order:
    def __init__(self, items: list[Item]) -> None:
        self.items = items
        self.total_price = self.calculate_total()
        self.total_price = self.apply_discount(self.total_price)
        self.save()

    def calculate_total(self) -> float:
        return sum(item.price * item.quantity for item in self.items)

    def apply_discount(self, total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

    def save(self) -> None:
        print(f"[DB] Saving order, total: ${self.total_price:.2f}")

items = [Item("Keyboard", 75.00, 1), Item("Mouse", 50.00, 3)]
order = Order(items)
print(f"Order total: ${order.total_price:.2f}")

# The cart page only wants the number
preview = Order([Item("Mouse", 50.00, 1)])
print(f"Cart preview: ${preview.total_price:.2f}")
```

```text
[DB] Saving order, total: $202.50
Order total: $202.50
[DB] Saving order, total: $50.00
Cart preview: $50.00
```

**Change request:** the cart page must show the discounted total while the customer shops, and nothing may be saved before checkout. The last two lines try it, and the second `[DB]` line shows the preview was saved as a real order. The pricing code exists, but it is locked inside a class that saves itself. A `save=False` flag would edit the class every team depends on; copying the formula into the cart page leaves two discount rules that will drift apart. Tests hit the same wall: checking the 10% rule writes to the database.

## The fix

<SolidSrpFix />

Give each of the three jobs a place of its own. `Order` holds the data and calls each part when checkout needs it.

```python
from dataclasses import dataclass, field

@dataclass
class Item:
    name: str
    price: float
    quantity: int

class PriceCalculator:
    @staticmethod
    def total(items: list[Item]) -> float:
        return sum(item.price * item.quantity for item in items)

class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

class OrderRepository:
    @staticmethod
    def save(order: "Order") -> None:
        print(f"[DB] Saving order, total: ${order.total_price:.2f}")

@dataclass
class Order:
    items: list[Item] = field(default_factory=list)
    total_price: float = 0.0

    def finalize(self) -> None:
        self.total_price = PriceCalculator.total(self.items)
        self.total_price = DiscountApplier.apply(self.total_price)
        OrderRepository.save(self)

order = Order(items=[Item("Keyboard", 75.00, 1), Item("Mouse", 50.00, 3)])
order.finalize()
print(f"Order total: ${order.total_price:.2f}")

# The cart page only wants the number
cart = [Item("Mouse", 50.00, 1)]
print(f"Cart preview: ${DiscountApplier.apply(PriceCalculator.total(cart)):.2f}")
```

```text
[DB] Saving order, total: $202.50
Order total: $202.50
Cart preview: $50.00
```

The cart preview calls the price calculator and the discount rule directly. Saving is a separate step, so the preview can leave storage alone. The table shows where each kind of change belongs.

| Class | Responsibility | Who asks for changes |
| --- | --- | --- |
| `Order` | Holds order data, runs the steps | the checkout flow |
| `PriceCalculator` | Computes the total | finance |
| `DiscountApplier` | Applies discount rules | marketing |
| `OrderRepository` | Saves the order | the platform team |

`Order` still names the three classes directly; making them swappable is the job of [Dependency Inversion](/en/lessons/dependency-inversion).

## In everyday Python

A module can group related functions without a class. Here the helpers take ordinary arguments and return values, so the same jobs can be separated into functions.

```python
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    price: float
    quantity: int

def order_total(items: list[Item]) -> float:          # pricing.py
    return sum(item.price * item.quantity for item in items)

def apply_discount(total: float) -> float:            # discounts.py
    return total * 0.9 if total > 200 else total

def save_order(total: float) -> None:                 # storage.py
    print(f"[DB] Saving order, total: ${total:.2f}")

def checkout(items: list[Item]) -> float:
    total = apply_discount(order_total(items))
    save_order(total)
    return total

checkout([Item("Keyboard", 75.00, 1), Item("Mouse", 50.00, 3)])
assert apply_discount(100) == 100 and apply_discount(300) == 270
print("discount rule tested without a database")
```

```text
[DB] Saving order, total: $202.50
discount rule tested without a database
```

The comments name each function's module. The last two lines show the payoff: a pure function such as `apply_discount` is tested with one `assert`, without setup or mocks (*Testing in Depth*). The standard library is split the same way: `json` handles JSON, `pathlib` handles paths.

## When not to apply it

Every split adds names and code for readers to follow. Keep related code together when it serves the same requirements. Separate parts when they already change for different reasons.

- **Its parts always change together.** A `Point` with `x`, `y` and `distance_to()` has one reason to change.
- **Requirements are still small.** A short script may keep related work in one file. Separate storage from pricing if those parts already change independently, even with one database.
- **The code is small and short-lived,** such as a 50-line script you run once.

Try describing who asks for changes and why. A class called `OrderManager` can become a place for unrelated features if its responsibility is unclear.

## Try it

Change the discount rule (say, 15% off above $300) and notice that nothing else needs an edit.

<ClientOnly><PythonPlayground :code='"class PriceCalculator:\n    @staticmethod\n    def total(prices: list[float]) -> float:\n        return sum(prices)\n\nclass DiscountApplier:\n    @staticmethod\n    def apply(total: float) -> float:\n        if total > 200:\n            return total * 0.9\n        return total\n\nclass OrderRepository:\n    @staticmethod\n    def save(total: float) -> None:\n        print(f\"[DB] Saving order, total: ${total:.2f}\")\n\nfor prices in [[50.0], [75.0, 150.0], [120.0, 250.0]]:\n    total = DiscountApplier.apply(PriceCalculator.total(prices))\n    OrderRepository.save(total)"' /></ClientOnly>

## Common mistakes

### 1. A side effect hidden in `__init__`

```python
class Order:
    def __init__(self, total: float) -> None:
        self.total = total
        print(f"[DB] Saving order, total: ${total:.2f}")   # Bad: saving is a second job

orders = [Order(t) for t in (20.0, 35.5)]   # just for a report
print(len(orders), "orders built")
```

```text
[DB] Saving order, total: $20.00
[DB] Saving order, total: $35.50
2 orders built
```

Building an object for a report or a test should not write anything. **Fix:** let the constructor only set up the object, and save with an explicit call such as `OrderRepository.save(order)`.

### 2. A class per method

```python
from dataclasses import dataclass

@dataclass
class Item:
    price: float
    quantity: int

    @property
    def total(self) -> float:       # Good: the item knows its own total
        return self.price * self.quantity

class ItemTotalCalculator:          # Bad: a class for one line that belongs to Item
    @staticmethod
    def total(item: Item) -> float:
        return item.price * item.quantity

mouse = Item(50.00, 3)
print(mouse.total, ItemTotalCalculator.total(mouse))
```

```text
150.0 150.0
```

One method per class can scatter code that serves the same requirement. If two pieces change together for the same reason, consider keeping them together.

## Practice

### 1. Move the printing out <Difficulty level="1" />

A `Student` class stores a name and grades, computes `average()`, and has a `print_report()` that prints `NAME: AVERAGE` with one decimal. Move the printing into a static method `ReportPrinter.show(student)`, so a new layout never touches `Student`. Print reports for Aziza `[5, 4, 5]` and Bobur `[3, 4, 4]`.

::: details Solution
```python
class Student:
    def __init__(self, name: str, grades: list[int]) -> None:
        self.name = name
        self.grades = grades

    def average(self) -> float:
        return sum(self.grades) / len(self.grades)

class ReportPrinter:
    @staticmethod
    def show(student: Student) -> None:
        print(f"{student.name}: {student.average():.1f}")

for student in [Student("Aziza", [5, 4, 5]), Student("Bobur", [3, 4, 4])]:
    ReportPrinter.show(student)
```

```text
Aziza: 4.7
Bobur: 3.7
```
:::

### 2. A new discount rule <Difficulty level="1" />

Marketing changes the rule: 15% off above $300, 10% off above $200. Rewrite `DiscountApplier` and print the result for 150, 250 and 400. Which other classes from the lesson had to change?

::: details Solution
```python
class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 300:
            return total * 0.85
        if total > 200:
            return total * 0.9
        return total

for total in [150, 250, 400]:
    print(f"${DiscountApplier.apply(total):.2f}")
```

```text
$150.00
$225.00
$340.00
```

None: `Order`, `PriceCalculator` and `OrderRepository` stay as they were.
:::

### 3. Split a newsletter sign-up <Difficulty level="2" />

A `Newsletter.subscribe(email)` method checks that the address contains `@`, adds it to a list and builds a welcome message. Write `is_valid(email)` and `welcome(email)`, plus a `subscribe(subscribers, email)` that uses them and returns the welcome text or `invalid address: EMAIL`. Subscribe `aziza@mail.uz` and `bobur-at-mail`, print each result, then the list.

::: details Solution
```python
def is_valid(email: str) -> bool:
    return "@" in email

def welcome(email: str) -> str:
    name = email.split("@")[0]
    return f"Welcome, {name}!"

def subscribe(subscribers: list[str], email: str) -> str:
    if not is_valid(email):
        return f"invalid address: {email}"
    subscribers.append(email)
    return welcome(email)

subscribers: list[str] = []
for email in ["aziza@mail.uz", "bobur-at-mail"]:
    print(subscribe(subscribers, email))
print(subscribers)
```

```text
Welcome, aziza!
invalid address: bobur-at-mail
['aziza@mail.uz']
```

A stricter check now edits only `is_valid`.
:::

### 4. Test the rule without a database <Difficulty level="2" />

Copy `DiscountApplier` from the fix and check with `assert` that 200 gets no discount, 300 becomes 270 and 1000 becomes 900. Print `all checks passed`. Why would the same checks be awkward with the `Order` from the violation?

::: details Solution
```python
class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

assert DiscountApplier.apply(200) == 200
assert DiscountApplier.apply(300) == 270
assert DiscountApplier.apply(1000) == 900
print("all checks passed")
```

```text
all checks passed
```

There the rule runs inside `Order.__init__`, which also saves, so each check writes an order.
:::

### 5. A report in two formats <Difficulty level="3" />

A `report(lines)` function parses log lines such as `"ERROR disk full"`, counts them by level and returns sorted `LEVEL: N` lines, all in one loop. Write it as `parse_level(line)`, `count_levels(levels)` and `format_text(counts)`. Then, without editing those three, add `format_json(counts)` using `json.dumps(..., sort_keys=True)`. Print both reports for `["ERROR disk full", "INFO started", "ERROR timeout"]`.

::: details Solution
```python
import json
from collections import Counter

def parse_level(line: str) -> str:
    return line.split()[0]

def count_levels(levels: list[str]) -> dict[str, int]:
    return dict(Counter(levels))

def format_text(counts: dict[str, int]) -> str:
    return "\n".join(f"{level}: {n}" for level, n in sorted(counts.items()))

def format_json(counts: dict[str, int]) -> str:
    return json.dumps(counts, sort_keys=True)

lines = ["ERROR disk full", "INFO started", "ERROR timeout"]
counts = count_levels([parse_level(line) for line in lines])
print(format_text(counts))
print(format_json(counts))
```

```text
ERROR: 2
INFO: 1
{"ERROR": 2, "INFO": 1}
```

A third format is one more function.
:::

## Recap

- A class should have **one reason to change**: one source of change requests.
- A class that computes, applies rules and saves mixes three jobs, and a change to one risks the others.
- Split by **reason to change**, not by method: `PriceCalculator`, `DiscountApplier`, `OrderRepository`, and an `Order` that holds the data.
- In Python the split is often **functions in separate modules**, testable with a plain `assert`.
- Keep together what changes together; don't split for requests nobody has made.

## Further reading

- [Robert C. Martin: The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
- [Python Tutorial: Modules](https://docs.python.org/3/tutorial/modules.html)
- [`dataclasses`: data classes](https://docs.python.org/3/library/dataclasses.html)
- [SOLID Principles in Python: the source examples](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/01-srp)
