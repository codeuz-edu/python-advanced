---
title: Interface Segregation Principle
description: "Give each caller the methods it needs using small interfaces, abstract classes, and protocols."
---

# Interface Segregation Principle

::: tip What you'll learn
- What the **Interface Segregation Principle** (ISP) says, and which stub methods it prevents
- How to spot a **fat interface** by the methods that raise `NotImplementedError`
- How to split one interface into **small, focused** ones and combine them in a class
- How `typing.Protocol` and `collections.abc` keep interfaces small in everyday Python
- When splitting an interface **goes too far**
:::

## Why it matters

A factory schedules both people and robots to work. Its canteen only serves people. If the same interface requires both `work()` and `eat()`, a robot may end up with an `eat()` method whose only purpose is to raise an error. The scheduling and lunch code need different contracts.

## The principle

> Clients should not be forced to depend on interfaces they do not use.

An interface should reflect what its callers need. Give the scheduler an interface for work and the canteen an interface for eating. A class can support both when both operations make sense.

## The violation

A factory employs people and robots. The first design puts everything a worker might do into one fat abstract class:

<SolidIspViolation />

```python
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> str: ...

    @abstractmethod
    def eat(self) -> str: ...

    @abstractmethod
    def sleep(self) -> str: ...

class Human(Worker):
    def __init__(self, name: str) -> None:
        self.name = name

    def work(self) -> str:
        return f"{self.name} is working"

    def eat(self) -> str:
        return f"{self.name} is eating"

    def sleep(self) -> str:
        return f"{self.name} is sleeping"

class Robot(Worker):
    def __init__(self, model: str) -> None:
        self.model = model

    def work(self) -> str:
        return f"Robot {self.model} is working"

    def eat(self) -> str:
        raise NotImplementedError("Robots don't eat")

    def sleep(self) -> str:
        raise NotImplementedError("Robots don't sleep")

aziza, t800 = Human("Aziza"), Robot("T-800")
print(aziza.eat())
print(t800.work())
try:
    print(t800.eat())
except NotImplementedError as error:
    print("Error:", error)
```

```text
Aziza is eating
Robot T-800 is working
Error: Robots don't eat
```

Python refuses to instantiate a subclass that still has abstract methods. Adding an `eat()` that only raises lets Python instantiate `Robot`, but code relying on `Worker.eat()` still fails. This also breaks [Liskov Substitution](/en/lessons/liskov-substitution).

**Change request:** the factory buys delivery drones. A drone works and needs charging, but never eats or sleeps. `Worker` is the only shared contract, so `charge()` has to go there, and that one line breaks a class that has nothing to do with batteries:

```py
class Worker(ABC):
    ...                                # work, eat, sleep as before

    @abstractmethod
    def charge(self) -> str: ...       # new, for drones

Human("Aziza")                         # Human is unchanged
```

```text
TypeError: Can't instantiate abstract class Human without an implementation for abstract method 'charge'
```

Adding `charge()` to `Worker` would make the existing classes account for a method only drones need. The drone would still have to account for `eat()` and `sleep()`.

## The fix

Split `Worker` along the lines its users draw: tasks need `work()`, the canteen `eat()`, the night shift `sleep()`. Each becomes its own interface, and each class inherits only the ones it supports:

<SolidIspFix />

```python
from abc import ABC, abstractmethod

class Workable(ABC):
    @abstractmethod
    def work(self) -> str: ...

class Eatable(ABC):
    @abstractmethod
    def eat(self) -> str: ...

class Sleepable(ABC):
    @abstractmethod
    def sleep(self) -> str: ...

class Human(Workable, Eatable, Sleepable):
    def __init__(self, name: str) -> None:
        self.name = name

    def work(self) -> str:
        return f"{self.name} is working"

    def eat(self) -> str:
        return f"{self.name} is eating"

    def sleep(self) -> str:
        return f"{self.name} is sleeping"

class Robot(Workable):
    def __init__(self, model: str) -> None:
        self.model = model

    def work(self) -> str:
        return f"Robot {self.model} is working"

def assign_task(worker: Workable) -> None:
    print(worker.work())

assign_task(Human("Aziza"))
assign_task(Robot("T-800"))
```

```text
Aziza is working
Robot T-800 is working
```

`Robot` has no stubs left. `assign_task` asks for a `Workable`, the smallest type that has what it calls, so it takes people and robots alike.

Define a `Chargeable` interface for drones. Existing workers keep their interfaces. The example repeats `Workable` and `assign_task` so you can run it on its own.

```python
from abc import ABC, abstractmethod

class Workable(ABC):                  # not changed
    @abstractmethod
    def work(self) -> str: ...

class Chargeable(ABC):                # new
    @abstractmethod
    def charge(self) -> str: ...

class Drone(Workable, Chargeable):    # new
    def __init__(self, code: str) -> None:
        self.code = code

    def work(self) -> str:
        return f"Drone {self.code} is delivering"

    def charge(self) -> str:
        return f"Drone {self.code} is charging"

def assign_task(worker: Workable) -> None:    # not changed
    print(worker.work())

drone = Drone("D-7")
assign_task(drone)
print(drone.charge())
```

```text
Drone D-7 is delivering
Drone D-7 is charging
```

## In everyday Python

An ABC describes required methods through inheritance. Python also supports checking some interfaces by their method names and signatures.

**`typing.Protocol`** describes the methods a caller needs. A static type checker can accept any object with a compatible `work()` method, even when its class does not inherit from that protocol.

```python
from typing import Protocol

class CanWork(Protocol):
    def work(self) -> str: ...

class Volunteer:                 # no base class
    def work(self) -> str:
        return "Volunteer Bobur is working"

def assign_task(worker: CanWork) -> None:
    print(worker.work())

assign_task(Volunteer())
```

```text
Volunteer Bobur is working
```

**`collections.abc`** follows ISP too. `Sized` needs only `__len__`, `Iterable` only `__iter__`, `Container` only `__contains__`, and `Collection` combines the three, the way `Human` combines `Workable`, `Eatable` and `Sleepable`.

## When not to apply it

Split an interface around groups of operations that callers use together. Several methods may form one useful interface when implementations support all of them.

- **Every implementor uses every method.** If the factory employed only people, one `Worker` would be right. Split when the first class needs a stub.
- **One interface per method.** Seven one-method bases are as hard to read as one fat interface; keep together what one caller uses together.
- **A single caller.** For a helper used in one place, plain duck typing is enough.

## Try it

Add a `Cook` with `work()` and `eat()` to the lunch break. Then add the robot and read the error.

<ClientOnly><PythonPlayground :code='"from typing import Protocol\n\nclass CanEat(Protocol):\n    def eat(self) -> str: ...\n\nclass Human:\n    def eat(self) -> str:\n        return \"Aziza is eating\"\n\nclass Robot:\n    def work(self) -> str:\n        return \"Robot T-800 is working\"\n\ndef lunch_break(eaters: list[CanEat]) -> None:\n    for eater in eaters:\n        print(eater.eat())\n\nlunch_break([Human()])"' /></ClientOnly>

## Common mistakes

### 1. A stub that quietly does nothing

```python
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> str: ...

    @abstractmethod
    def eat(self) -> str: ...

class Robot(Worker):
    def work(self) -> str:
        return "Robot is working"

    def eat(self) -> str:
        pass                      # Bad: returns None

print("Lunch:", Robot().eat())
```

```text
Lunch: None
```

The stub returns `None`; the caller expects a string. If only some objects can produce a PDF, give those objects a separate interface for that operation.

### 2. Annotating one interface and calling another

```py
def lunch_break(workers: list[Workable]) -> None:
    for worker in workers:
        print(worker.eat())       # Bad: eat() is not part of Workable

lunch_break([Human("Aziza"), Robot("T-800")])
```

```text
Aziza is eating
AttributeError: 'Robot' object has no attribute 'eat'
```

The signature promises only `work()`, so callers pass robots. **Fix:** ask for the interface whose methods you call, `list[Eatable]`; a type checker then flags the robot.

### 3. `isinstance` with a plain protocol

```py
from typing import Protocol

class CanWork(Protocol):
    def work(self) -> str: ...

print(isinstance(Robot("T-800"), CanWork))
```

```text
TypeError: Instance and class checks can only be used with @runtime_checkable protocols
```

**Fix:** add `@runtime_checkable` from `typing`; the check then confirms only that the methods exist, not their signatures.

## Practice

### 1. Split an office machine <Difficulty level="1" />

A `Machine` ABC with `print_doc(text)` and `scan()` forces a simple printer to stub `scan()`. Split it into `Printer` and `Scanner`, write `SimplePrinter` and `OfficeCombo`, print `"Invoice #12"` with both and scan with the combo.

::: details Solution
```python
from abc import ABC, abstractmethod

class Printer(ABC):
    @abstractmethod
    def print_doc(self, text: str) -> str: ...

class Scanner(ABC):
    @abstractmethod
    def scan(self) -> str: ...

class SimplePrinter(Printer):
    def print_doc(self, text: str) -> str:
        return f"SimplePrinter: {text}"

class OfficeCombo(Printer, Scanner):
    def print_doc(self, text: str) -> str:
        return f"OfficeCombo: {text}"

    def scan(self) -> str:
        return "OfficeCombo: scanned 1 page"

for machine in [SimplePrinter(), OfficeCombo()]:
    print(machine.print_doc("Invoice #12"))
print(OfficeCombo().scan())
```

```text
SimplePrinter: Invoice #12
OfficeCombo: Invoice #12
OfficeCombo: scanned 1 page
```
:::

### 2. A protocol for greeters <Difficulty level="1" />

Write a `Greeter` protocol with `greet(name: str) -> str`, two greeters **without** a base class, and `welcome(greeter, name)` that prints the greeting. Welcome Aziza with both.

::: details Solution
```python
from typing import Protocol

class Greeter(Protocol):
    def greet(self, name: str) -> str: ...

class UzbekGreeter:
    def greet(self, name: str) -> str:
        return f"Assalomu alaykum, {name}!"

class EnglishGreeter:
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"

def welcome(greeter: Greeter, name: str) -> None:
    print(greeter.greet(name))

for greeter in [UzbekGreeter(), EnglishGreeter()]:
    welcome(greeter, "Aziza")
```

```text
Assalomu alaykum, Aziza!
Hello, Aziza!
```
:::

### 3. Lunch for those who eat <Difficulty level="2" />

Write an `Eatable` ABC, a `Human` that inherits it and a `Robot` that does not. Then write `lunch_break(staff)` that feeds only the `Eatable` members and prints how many it skipped.

::: details Solution
```python
from abc import ABC, abstractmethod

class Eatable(ABC):
    @abstractmethod
    def eat(self) -> str: ...

class Human(Eatable):
    def __init__(self, name: str) -> None:
        self.name = name

    def eat(self) -> str:
        return f"{self.name} is eating"

class Robot:
    pass

def lunch_break(staff: list[object]) -> None:
    eaters = [member for member in staff if isinstance(member, Eatable)]
    for eater in eaters:
        print(eater.eat())
    print("Skipped:", len(staff) - len(eaters))

lunch_break([Human("Aziza"), Robot(), Human("Bobur")])
```

```text
Aziza is eating
Bobur is eating
Skipped: 1
```
:::

### 4. A playlist without a base class <Difficulty level="2" />

Write a `Playlist` of song titles that defines only `__len__`, `__iter__` and `__contains__`. Print its length, whether `"Bahor"` is in it, and `isinstance(playlist, Collection)`.

::: details Solution
```python
from collections.abc import Collection

class Playlist:
    def __init__(self, songs: list[str]) -> None:
        self.songs = songs

    def __len__(self) -> int:
        return len(self.songs)

    def __iter__(self):
        return iter(self.songs)

    def __contains__(self, title: object) -> bool:
        return title in self.songs

playlist = Playlist(["Bahor", "Yor-yor", "Lazgi"])
print(len(playlist), "Bahor" in playlist)
print(isinstance(playlist, Collection))
```

```text
3 True
True
```

This particular ABC recognizes these three methods through a subclass hook. More complex ABCs may require explicit inheritance or registration.
:::

### 5. A read-only archive <Difficulty level="3" />

An archive must never be written to. Write runtime-checkable protocols `Readable` (`read(key)`) and `Writable` (`write(key, value)`), an `Archive` that only reads, a `MemoryStore` that writes, and `copy(source, target, keys)`. Copy two keys from an archive into a store, print the store, and check the archive against both protocols.

::: details Solution
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self, key: str) -> str: ...

@runtime_checkable
class Writable(Protocol):
    def write(self, key: str, value: str) -> None: ...

class MemoryStore:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}

    def write(self, key: str, value: str) -> None:
        self.data[key] = value

class Archive:
    def __init__(self, data: dict[str, str]) -> None:
        self._data = dict(data)

    def read(self, key: str) -> str:
        return self._data[key]

def copy(source: Readable, target: Writable, keys: list[str]) -> None:
    for key in keys:
        target.write(key, source.read(key))

archive = Archive({"2024": "sales 120", "2025": "sales 150"})
store = MemoryStore()
copy(archive, store, ["2024", "2025"])
print(store.data)
print(isinstance(archive, Readable), isinstance(archive, Writable))
```

```text
{'2024': 'sales 120', '2025': 'sales 150'}
True False
```

`copy` asks each side only for what it uses.
:::

## Recap

- ISP: no class should have to implement, and no caller depend on, methods it does not use.
- A method that raises `NotImplementedError` or does nothing marks a fat interface.
- Split by caller; a class combines the small interfaces it supports.
- A required method that an implementation cannot honor may point to an interface that should be split.
- `typing.Protocol` lets a function name exactly the methods it calls; `collections.abc` is the standard library's example.
- Do not split while every implementor uses every method.

## Further reading

- [`abc`: abstract base classes](https://docs.python.org/3/library/abc.html)
- [`typing.Protocol`](https://docs.python.org/3/library/typing.html#typing.Protocol)
- [PEP 544: Protocols, structural subtyping](https://peps.python.org/pep-0544/)
- [`collections.abc`: abstract base classes for containers](https://docs.python.org/3/library/collections.abc.html)
- [SOLID Principles in Python: the source examples](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/04-isp)
