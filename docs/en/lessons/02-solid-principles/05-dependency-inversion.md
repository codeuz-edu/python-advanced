---
title: Dependency Inversion Principle
description: "Pass a payment dependency into the processor and test it with an object that records payments."
---

# Dependency Inversion Principle

::: tip What you'll learn
- What the **Dependency Inversion Principle** (DIP) says, and what **high-level** and **low-level** code mean
- Why creating a dependency inside `__init__` **hard-wires** it
- How **dependency injection** passes the dependency in, and why that makes testing easy
- How an `abc.ABC`, a `typing.Protocol` or a plain function can serve as the abstraction
- When an abstraction with one implementation is **just extra code**
:::

## Why it matters

Checkout knows when to process a payment. The payment service knows how to charge a card or record cash. If checkout creates a specific service, changing services means editing checkout. Give checkout the payment operation it needs and choose the service when assembling the application.

## The principle

> High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.

Define the shared contract around what the calling code needs. Here the processor needs `pay(amount)`. Each payment service supplies that operation, and the processor can call it without knowing the service class.

## The violation

<SolidDipViolation />

```python
class CreditCardPayment:
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with credit card")

class PaymentProcessor:
    def __init__(self) -> None:
        self.payment = CreditCardPayment()  # hard-wired dependency

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

processor = PaymentProcessor()
processor.process(150.00)
```

```text
Paying $150.00 with credit card
```

`PaymentProcessor` names `CreditCardPayment` and creates it. The caller has no parameter through which to pass a different payment object.

**Change request:** the shop starts taking cash. The only way in is through `PaymentProcessor` itself:

```python
class CreditCardPayment:
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with credit card")

class CashPayment:
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with cash")

class PaymentProcessor:
    def __init__(self, method: str = "card") -> None:    # edited
        if method == "card":
            self.payment = CreditCardPayment()
        elif method == "cash":
            self.payment = CashPayment()
        else:
            raise ValueError(f"unknown payment method: {method}")

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

PaymentProcessor("cash").process(150.00)
```

```text
Paying $150.00 with cash
```

Every additional method adds another branch to the processor. The test still has to replace a name inside the processor module to intercept object creation.

## The fix

Add an abstraction, `Payment`, that says what the processor needs: something with `pay(amount)`. The processor receives one through its constructor instead of building it. Passing a dependency in like this is **dependency injection**.

<SolidDipFix />

```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class CashPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with cash")

class CreditCardPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with credit card")

class CryptoPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with cryptocurrency")

class PaymentProcessor:
    def __init__(self, payment: Payment) -> None:
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

for method in (CashPayment(), CreditCardPayment(), CryptoPayment()):
    processor = PaymentProcessor(method)
    processor.process(150.00)
```

```text
Paying $150.00 with cash
Paying $150.00 with credit card
Paying $150.00 with cryptocurrency
```

The caller creates a `CashPayment` for cash and passes it to `PaymentProcessor`. Both card and cash implementations follow `Payment`. The same choice is available for future services.

The code that assembles the application still names the concrete classes. It often lives near the program's entry point.

## Testing with a fake

Injection pays off first in tests. A test hands the processor a fake that records payments instead of making them, the idea behind the mocks in *Testing in Depth*:

```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class PaymentProcessor:
    def __init__(self, payment: Payment) -> None:
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

class FakePayment(Payment):
    def __init__(self) -> None:
        self.paid: list[float] = []

    def pay(self, amount: float) -> None:
        self.paid.append(amount)

fake = FakePayment()
processor = PaymentProcessor(fake)
processor.process(150.00)
processor.process(80.50)
assert fake.paid == [150.00, 80.50]
print("test passed:", fake.paid)
```

```text
test passed: [150.0, 80.5]
```

The example records the amount in a list. For the version that creates its dependency internally, a test could instead patch the class name where the processor looks it up.

## In everyday Python

A constructor parameter is enough to pass a dependency. Use an ABC, a protocol, or a function signature to describe the expected behavior.

- **A `Protocol`** (`class Payment(Protocol)` with the same `pay` method) asks for no base class, so a payment class from another library fits without inheriting anything.
- **A function** is the smallest abstraction. When the dependency has one method, pass the function itself:

```python
from typing import Callable

def pay_in_cash(amount: float) -> None:
    print(f"Paying ${amount:.2f} with cash")

class PaymentProcessor:
    def __init__(self, pay: Callable[[float], None]) -> None:
        self.pay = pay

    def process(self, amount: float) -> None:
        self.pay(amount)

PaymentProcessor(pay_in_cash).process(150.00)
PaymentProcessor(lambda amount: print(f"test saw {amount}")).process(9.99)
```

```text
Paying $150.00 with cash
test saw 9.99
```

To offer a convenient default while keeping the processor independent, choose the default in the code that builds the application. For example, a factory can return `PaymentProcessor(CreditCardPayment())` when the caller has made no selection.

## When not to apply it

Introduce a shared contract when services can change independently of the rules, when more than one service already fits, or when tests benefit from a substitute. A stable helper can often be called directly.

- **Stable, cheap, deterministic dependencies.** `math`, `json` and your own pure helpers will not be swapped. Wrapping `json.dumps` in a `Serializer` interface only hides it.
- **One implementation, no fake needed.** An ABC with a single subclass doubles the code to read. Inject the concrete class and add the `Protocol` when a second implementation arrives; with injection in place, that step is small.
- **Inside one module.** Functions in the same file calling each other need nothing between them.

## Try it

Add a `BankTransferPayment` to the list and process 99.90 with it, without touching `PaymentProcessor`.

<ClientOnly><PythonPlayground :code='"from abc import ABC, abstractmethod\n\nclass Payment(ABC):\n    @abstractmethod\n    def pay(self, amount: float) -> None: ...\n\nclass CashPayment(Payment):\n    def pay(self, amount: float) -> None:\n        print(f\"Paying ${amount:.2f} with cash\")\n\nclass PaymentProcessor:\n    def __init__(self, payment: Payment) -> None:\n        self.payment = payment\n\n    def process(self, amount: float) -> None:\n        self.payment.pay(amount)\n\nfor method in [CashPayment()]:\n    PaymentProcessor(method).process(99.90)"' /></ClientOnly>

## Common mistakes

### 1. Passing the class instead of an object

```py
processor = PaymentProcessor(CreditCardPayment)   # Bad: no ()
processor.process(150.00)
```

```text
TypeError: CreditCardPayment.pay() missing 1 required positional argument: 'amount'
```

`self.payment.pay(amount)` calls the method on the class, so `amount` fills the `self` slot. **Fix:** inject an object, `PaymentProcessor(CreditCardPayment())`.

### 2. A default object shared by every processor

```python
class CreditCardPayment:
    def __init__(self) -> None:
        self.history: list[float] = []

    def pay(self, amount: float) -> None:
        self.history.append(amount)

class PaymentProcessor:
    def __init__(self, payment: CreditCardPayment = CreditCardPayment()) -> None:   # Bad
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

shop, cafe = PaymentProcessor(), PaymentProcessor()
shop.process(150.00)
print("cafe history:", cafe.payment.history)
```

```text
cafe history: [150.0]
```

Python evaluates default arguments when it defines the function. Every processor that omits `payment` shares the same object. Require an injected object or have the application factory create a fresh one for each call.

### 3. Checking for a concrete class in the rules

```py
class PaymentProcessor:
    ...
    def process(self, amount: float) -> None:
        if isinstance(self.payment, CreditCardPayment):   # Bad
            amount *= 1.02                                # card fee
        self.payment.pay(amount)

PaymentProcessor(CreditCardPayment()).process(150.00)
```

```text
Paying $153.00 with credit card
```

Checking the concrete class ties the processor to that detail again. If the card service owns the fee, apply it in that service. If checkout owns the fee rule, pass the rule in as a policy.

## Practice

### 1. Inject the sender <Difficulty level="1" />

`OrderService` creates an `EmailSender()` in `__init__`. Make it receive a sender instead (a `Sender` protocol with `send(text)`), add an `SmsSender`, and confirm order 17 with each.

::: details Solution
```python
from typing import Protocol

class Sender(Protocol):
    def send(self, text: str) -> None: ...

class EmailSender:
    def send(self, text: str) -> None:
        print(f"Email: {text}")

class SmsSender:
    def send(self, text: str) -> None:
        print(f"SMS: {text}")

class OrderService:
    def __init__(self, sender: Sender) -> None:
        self.sender = sender

    def confirm(self, order_id: int) -> None:
        self.sender.send(f"order #{order_id} confirmed")

for sender in [EmailSender(), SmsSender()]:
    OrderService(sender).confirm(17)
```

```text
Email: order #17 confirmed
SMS: order #17 confirmed
```
:::

### 2. A fake for the test <Difficulty level="1" />

`Checkout(payment)` has `pay_cart(prices)`, which pays the rounded sum. Write it and a `FakePayment` that stores the last amount, then assert that a cart of 45.00 and 15.50 is charged 60.50.

::: details Solution
```python
class Checkout:
    def __init__(self, payment) -> None:
        self.payment = payment

    def pay_cart(self, prices: list[float]) -> None:
        self.payment.pay(round(sum(prices), 2))

class FakePayment:
    def __init__(self) -> None:
        self.last: float | None = None

    def pay(self, amount: float) -> None:
        self.last = amount

fake = FakePayment()
Checkout(fake).pay_cart([45.00, 15.50])
assert fake.last == 60.50
print("charged:", fake.last)
```

```text
charged: 60.5
```
:::

### 3. Pass a function <Difficulty level="2" />

Write a `Notifier` that takes a `send` function (`Callable[[str], None]`) and has `remind(name, event)`. Remind Aziza with `print`, then remind Bobur with the `append` method of an `outbox` list and print the list.

::: details Solution
```python
from typing import Callable

class Notifier:
    def __init__(self, send: Callable[[str], None]) -> None:
        self.send = send

    def remind(self, name: str, event: str) -> None:
        self.send(f"{name}, remember: {event}")

Notifier(print).remind("Aziza", "exam on Monday")
outbox: list[str] = []
Notifier(outbox.append).remind("Bobur", "exam on Monday")
print(outbox)
```

```text
Aziza, remember: exam on Monday
['Bobur, remember: exam on Monday']
```

A bound method such as `outbox.append` is a function too.
:::

### 4. A safe default <Difficulty level="2" />

Give `PaymentProcessor` a parameter `payment: Payment | None = None` that falls back to a new `CreditCardPayment`. Show that two processors created without an argument get different objects, then process 20.00 with the default and with an injected `CashPayment`.

::: details Solution
```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class CreditCardPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with credit card")

class CashPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"Paying ${amount:.2f} with cash")

class PaymentProcessor:
    def __init__(self, payment: Payment | None = None) -> None:
        self.payment = payment if payment is not None else CreditCardPayment()

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

first, second = PaymentProcessor(), PaymentProcessor()
print(first.payment is second.payment)
first.process(20.00)
PaymentProcessor(CashPayment()).process(20.00)
```

```text
False
Paying $20.00 with credit card
Paying $20.00 with cash
```
:::

### 5. Wire a small app <Difficulty level="3" />

A `ReportService` loads sales from a `Source` (`load()`) and saves a summary to a `Storage` (`save(name, text)`). Write both protocols, a `ListSource`, a `MemoryStorage`, the service, and `build_app()`, the only function that names the concrete classes. Run the report and print what was stored.

::: details Solution
```python
from typing import Protocol

class Source(Protocol):
    def load(self) -> list[int]: ...

class Storage(Protocol):
    def save(self, name: str, text: str) -> None: ...

class ReportService:
    def __init__(self, source: Source, storage: Storage) -> None:
        self.source = source
        self.storage = storage

    def run(self) -> None:
        sales = self.source.load()
        self.storage.save("summary", f"{len(sales)} sales, total {sum(sales):,}")

class ListSource:
    def __init__(self, sales: list[int]) -> None:
        self.sales = sales

    def load(self) -> list[int]:
        return self.sales

class MemoryStorage:
    def __init__(self) -> None:
        self.files: dict[str, str] = {}

    def save(self, name: str, text: str) -> None:
        self.files[name] = text

def build_app() -> tuple[ReportService, MemoryStorage]:
    storage = MemoryStorage()
    return ReportService(ListSource([120000, 45000, 80000]), storage), storage

service, storage = build_app()
service.run()
print(storage.files)
```

```text
{'summary': '3 sales, total 245,000'}
```

Swapping in a database or a CSV file later changes only `build_app`.
:::

## Recap

- DIP: the rules and the details both depend on an abstraction shaped by what the rules need.
- Creating a dependency inside `__init__` hard-wires it.
- **Dependency injection** passes the object in, usually through the constructor; one place near the entry point wires the concrete classes.
- The abstraction can be an `ABC`, a `Protocol` or a plain callable, and a fake can stand in for it in tests.
- Skip the abstraction for stable helpers and single implementations; add it when the second one arrives.

## Further reading

- [`abc`: abstract base classes](https://docs.python.org/3/library/abc.html)
- [`typing.Protocol`](https://docs.python.org/3/library/typing.html#typing.Protocol)
- [Annotating callable objects](https://docs.python.org/3/library/typing.html#annotating-callable-objects)
- [`unittest.mock`](https://docs.python.org/3/library/unittest.mock.html)
- [SOLID Principles in Python: the source examples](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/05-dip)
