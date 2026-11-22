---
title: Closures and Decorators
description: "Learn how closures retain variables, how to write and combine decorators, and when to use functools.wraps, lru_cache, and partial."
---

# Closures and Decorators

![Illustration: Closures and Decorators](/images/topics-webp/closures-and-decorators.webp){.lesson-cover width=1536 height=1024}

::: tip What you'll learn
- What a **closure** is, and when an inner function needs `nonlocal`
- How to write a **decorator** step by step, with `*args`, `**kwargs`, and `functools.wraps`
- How to pass arguments to decorators and how Python applies stacked decorators
- How to use `functools.lru_cache` and `functools.partial`
- How class decorators such as `@dataclass` and `@register` work
:::

## Why it matters

You may already know `@property` from *Properties and Encapsulation* and `@classmethod` from *Class Attributes, Class Methods, and Static Methods*. The same notation lets you add logging, caching, or retries to an existing function. In this chapter, you will build a decorator and follow what happens when Python defines the function and when you call it.

## Closures and `nonlocal`

A function can be passed as an argument or returned as a result, as you saw in *Lambdas and Higher-Order Functions*. A **closure** retains access to variables from an enclosing function even after that function returns. In the example below, each ticket counter reads its own prefix and updates its own number.

```python
def make_ticket_counter(prefix):
    number = 0

    def next_ticket():
        nonlocal number     # assign to the enclosing variable
        number += 1
        return f"{prefix}{number}"

    return next_ticket

bank = make_ticket_counter("A")
print(bank(), bank(), bank())

pharmacy = make_ticket_counter("B")   # a fresh, separate number
print(pharmacy())
```

```text
A1 A2 A3
B1
```

The inner function can read `prefix` directly. To assign to `number` from the inner function, declare it `nonlocal`, as in *Variable Scope*. Each call to `make_ticket_counter()` creates a separate binding for `number`, so the bank and pharmacy counters advance independently.

## Writing a decorator step by step

A **decorator** is a callable that takes a function or class and returns the object to bind to its name. A function decorator often returns a **wrapper**. Here the wrapper accepts positional and keyword arguments, passes them to the original function, and returns its result.

```python
def announce(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with {args} {kwargs}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result!r}")
        return result
    return wrapper

def add(a, b):
    return a + b

add = announce(add)          # decorating by hand
add(2, 3)

@announce                    # the same thing with @
def total_price(price, quantity=1):
    return price * quantity

total = total_price(15000, quantity=3)
print(total)
```

```text
Calling add with (2, 3) {}
add returned 5
Calling total_price with (15000,) {'quantity': 3}
total_price returned 45000
45000
```

`@announce` above a `def` means exactly `total_price = announce(total_price)`. The name now points to `wrapper`, and `wrapper` still reaches the original function through the closure variable `func`.

## `functools.wraps`

After decoration, the name refers to the wrapper. Without extra care, tools such as `help()` see the wrapper's name and docstring. `functools.wraps` copies this information and sets `__wrapped__` so tools can find the original function.

```python
from functools import wraps

def plain(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def careful(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@plain
def greet(name):
    """Return a greeting."""
    return f"Salom, {name}!"

@careful
def farewell(name):
    """Return a goodbye."""
    return f"Xayr, {name}!"

print(greet.__name__, greet.__doc__)
print(farewell.__name__, farewell.__doc__)
```

```text
wrapper None
farewell Return a goodbye.
```

`@wraps(func)` is itself a decorator with an argument. Use it when the wrapper stands in for the original function.

## Decorators with arguments

Python evaluates `retry(times=3)` when it defines the function. The result must be a decorator that Python can call with the function as its argument. The example uses three functions: `retry` sets the attempt limit, `decorator` receives the original function, and `wrapper` handles each call.

```python
from functools import wraps

def retry(times):
    if times < 1:
        raise ValueError("times must be at least 1")

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except ConnectionError as error:
                    print(f"  attempt {attempt} failed: {error}")
                    if attempt == times:
                        raise
        return wrapper
    return decorator

answers = iter(["timeout", "timeout", "1 USD = 12,650 som"])

@retry(times=3)
def fetch_rate():
    answer = next(answers)
    if answer == "timeout":
        raise ConnectionError(answer)
    return answer

print(fetch_rate())
```

```text
  attempt 1 failed: timeout
  attempt 2 failed: timeout
1 USD = 12,650 som
```

The equivalent assignment is `fetch_rate = retry(times=3)(fetch_rate)`. The wrapper retains `times` and re-raises the last connection error if all attempts fail.

## Stacking decorators

Python evaluates decorator expressions from top to bottom and applies the resulting decorators from bottom to top. The decorator closest to `def` receives the original function. The top decorator becomes the outermost wrapper in this example.

![Diagram: Stacked Decorators](/images/companions-webp/decorator-stack.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```python
from functools import wraps

def bold(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return "<b>" + func(*args, **kwargs) + "</b>"
    return wrapper

def italic(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return "<i>" + func(*args, **kwargs) + "</i>"
    return wrapper

@bold
@italic
def city(name):
    return name

print(city("Samarkand"))     # bold(italic(city))
```

```text
<b><i>Samarkand</i></b>
```

With `@retry` above `@announce`, the retry wrapper calls the logging wrapper once per attempt. Swap them and `@announce` reports one call covering the whole retry operation.

## `lru_cache` and `partial`

`lru_cache` stores results indexed by arguments. In recursive Fibonacci, many calls ask for the same value. A cache serves those calls without running the function body again.

```python
from functools import lru_cache

calls = 0

def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(25), "calls:", calls)

calls = 0

@lru_cache(maxsize=None)
def fast_fib(n):
    global calls
    calls += 1
    return n if n < 2 else fast_fib(n - 1) + fast_fib(n - 2)

print(fast_fib(25), "calls:", calls)
print(fast_fib.cache_info())
```

```text
75025 calls: 242785
75025 calls: 26
CacheInfo(hits=23, misses=26, maxsize=None, currsize=26)
```

`functools.cache` is equivalent to `lru_cache(maxsize=None)`. Cache arguments must be hashable. Use the cache when returning a previous result for the same arguments is correct and it is safe to skip the function's work.

`partial`, introduced in *Lambdas and Higher-Order Functions*, fixes some arguments in advance and returns a callable for later use.

```python
from functools import partial

def price_with_tax(price, rate):
    return round(price * (1 + rate))

with_vat = partial(price_with_tax, rate=0.12)
print(with_vat(100000))
```

```text
112000
```

## Class decorators

A decorator can receive a **class** too, do something with it, and return it. A common use is a **registry** that collects classes by name:

```python
PAYMENT_METHODS = {}

def register(cls):
    PAYMENT_METHODS[cls.__name__.lower()] = cls
    return cls                  # give the class back unchanged

@register
class Cash:
    fee = 0

@register
class Card:
    fee = 0.01

print(list(PAYMENT_METHODS))
method = PAYMENT_METHODS["card"]()
print(type(method).__name__, method.fee)
```

```text
['cash', 'card']
Card 0.01
```

A new payment class can register itself with `@register`. The `@dataclass` decorator from *Dataclasses* uses annotated fields to generate methods such as `__init__`, `__repr__`, and `__eq__` with the default settings.

## Try it

Decorate another function with `@count_calls`, or make the wrapper also print the arguments.

<ClientOnly><PythonPlayground :code='"from functools import wraps\n\ndef count_calls(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        wrapper.calls += 1\n        print(f\"[{func.__name__} call #{wrapper.calls}]\")\n        return func(*args, **kwargs)\n    wrapper.calls = 0\n    return wrapper\n\n@count_calls\ndef order_total(price, quantity=1):\n    return price * quantity\n\nprint(order_total(15000))\nprint(order_total(8000, quantity=3))\nprint(\"Total calls:\", order_total.calls)"' /></ClientOnly>

## Common mistakes

### 1. Forgetting to return the wrapper

```py
def announce(func):
    def wrapper(*args, **kwargs):
        print("Calling", func.__name__)
        return func(*args, **kwargs)
    # Bad: no return wrapper

@announce
def greet(name):
    return f"Salom, {name}!"

print(greet("Aziza"))
```

```text
TypeError: 'NoneType' object is not callable
```

The decorator returned `None`, so `greet` is `None`. `return wrapper()` is just as wrong: it calls the function while decorating. **Fix:** end the decorator with `return wrapper`, no parentheses.

### 2. Forgetting `@wraps`

```python
def logged(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@logged
def home():
    return "Home page"

@logged
def about():
    return "About us"

pages = {page.__name__: page for page in [home, about]}
print(list(pages))
print(pages["wrapper"]())
```

```text
['wrapper']
About us
```

Both functions are called `wrapper`, so the second one overwrote the first. **Fix:** put `@wraps(func)` above `def wrapper`.

### 3. Swallowing the return value

```python
def announce(func):
    def wrapper(*args, **kwargs):
        print("Calling", func.__name__)
        func(*args, **kwargs)       # Bad: result is thrown away
    return wrapper

@announce
def total(prices):
    return sum(prices)

print("Total:", total([15000, 8000]))
```

```text
Calling total
Total: None
```

**Fix:** `return func(*args, **kwargs)`, or save it in `result` and return it at the end.

### 4. Changing an outer variable without `nonlocal`

```py
def make_counter():
    count = 0
    def counter():
        count += 1          # Bad: assignment makes count local
        return count
    return counter

tick = make_counter()
tick()
```

```text
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

**Fix:** add `nonlocal count` as the first line of `counter`.

## Practice

### 1. Log every call <Difficulty level="1" />

Write a decorator `@log_calls` that prints `log: NAME(ARGS)` before each call and returns the result. Decorate `add(a, b)` and print `add(2, 3)`.

::: details Solution
```python
from functools import wraps

def log_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"log: {func.__name__}{args}")
        return func(*args, **kwargs)
    return wrapper

@log_calls
def add(a, b):
    return a + b

print(add(2, 3))
```

```text
log: add(2, 3)
5
```
:::

### 2. Running total <Difficulty level="1" />

Write `make_wallet(balance)` that returns a function `spend(amount)`. Each call subtracts the amount and returns the new balance. Start at 100,000 som, spend 25,000 and then 40,000, and print each new balance.

::: details Solution
```python
def make_wallet(balance):
    def spend(amount):
        nonlocal balance
        balance -= amount
        return balance
    return spend

spend = make_wallet(100000)
print(spend(25000))
print(spend(40000))
```

```text
75000
35000
```
:::

### 3. Memoize by hand <Difficulty level="2" />

Without `functools`, write `@memoize` that stores results in a dictionary inside the closure. Decorate a recursive `fib`, count how many times its body runs, and print `fib(30)` and the count.

::: details Solution
```python
from functools import wraps

def memoize(func):
    cache = {}

    @wraps(func)
    def wrapper(n):
        if n not in cache:
            cache[n] = func(n)
        return cache[n]
    return wrapper

runs = 0

@memoize
def fib(n):
    global runs
    runs += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(30))
print("body ran", runs, "times")
```

```text
832040
body ran 31 times
```

The recursive calls go through the decorated name `fib`, so they hit the cache too.
:::

### 4. Repeat with an argument <Difficulty level="2" />

Write `@repeat(n)` that calls the function `n` times and returns a list of all results. Decorate `roll()`, which returns the next number from `iter([3, 6, 2])`, with `@repeat(3)` and print the result.

::: details Solution
```python
from functools import wraps

def repeat(n):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return [func(*args, **kwargs) for _ in range(n)]
        return wrapper
    return decorator

dice = iter([3, 6, 2])

@repeat(3)
def roll():
    return next(dice)

print(roll())
print(roll.__name__)
```

```text
[3, 6, 2]
roll
```
:::

### 5. Type checks <Difficulty level="3" />

Write `@validate_types(**types)`, for example `@validate_types(city=str, price=int)`. Before each call, check every named argument (passed by position or keyword) and raise `TypeError` with a clear message if the type is wrong. Hint: `inspect.signature(func).bind(*args, **kwargs).arguments` gives a dict of names to values. Print `delivery("Bukhara", 30000)`, then call it with `("Nukus", "30000")` and `(42, 30000)` and print `Error: MESSAGE` for each.

::: details Solution
```python
import inspect
from functools import wraps

def validate_types(**types):
    def decorator(func):
        signature = inspect.signature(func)

        @wraps(func)
        def wrapper(*args, **kwargs):
            arguments = signature.bind(*args, **kwargs).arguments
            for name, expected in types.items():
                if name in arguments and not isinstance(arguments[name], expected):
                    actual = type(arguments[name]).__name__
                    raise TypeError(f"{name} must be {expected.__name__}, got {actual}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(city=str, price=int)
def delivery(city, price):
    return f"Delivery to {city}: {price:,} som"

print(delivery("Bukhara", 30000))
for args in [("Nukus", "30000"), (42, 30000)]:
    try:
        delivery(*args)
    except TypeError as error:
        print("Error:", error)
```

```text
Delivery to Bukhara: 30,000 som
Error: price must be int, got str
Error: city must be str, got int
```

`bind` matches supplied arguments to parameters using Python's call rules. To check omitted parameters with defaults too, call `apply_defaults()` on the bound arguments before reading `.arguments`.
:::

## Recap

- A **closure** retains access to variables of an enclosing function. Use `nonlocal` to rebind such a variable.
- `@deco` applies `deco` to the function or class and binds the result to its name.
- A wrapper can forward `*args, **kwargs` and return the original result. Use `@wraps(func)` to preserve metadata.
- `@retry(times=3)` first creates a decorator. Python applies stacked decorators from bottom to top.
- `lru_cache` stores results and `partial` supplies arguments in advance. A class decorator receives a class and can return it.

## Further reading

- [Glossary: decorator](https://docs.python.org/3/glossary.html#term-decorator)
- [`functools`: higher-order functions and operations on callables](https://docs.python.org/3/library/functools.html)
- [Reference: function definitions and decorators](https://docs.python.org/3/reference/compound_stmts.html#function-definitions)
- [PEP 318: decorators for functions and methods](https://peps.python.org/pep-0318/)
