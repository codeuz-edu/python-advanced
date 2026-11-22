---
title: Memory and Performance
description: "Measure execution time, inspect memory use, and profile Python programs before optimizing them."
---

# Memory and Performance

![Illustration: Memory and Performance](/images/topics-webp/memory-and-performance.webp){.lesson-cover width=1536 height=1024}

::: tip What you'll learn
- How to **measure** speed with `timeit` and `time.perf_counter`
- What `sys.getsizeof` reports, and how `tracemalloc` shows **where** memory goes
- How **reference counting**, `gc`, and `weakref` decide when objects are freed
- How to find slow functions with **`cProfile`** and `pstats`
- Which speed-ups matter (sets, `join`, built-ins, `lru_cache`), and when not to optimize
:::

## Why it matters

When a sales report takes forty minutes or a service uses more memory each day, start with a measurement. A report may spend most of its time in a single lookup. A service may keep old reports in a list. The tools in this chapter help you find which part of the program to investigate.

## Measure before guessing

`timeit` measures the total time for a fixed number of runs. `timeit.repeat` repeats the measurement. The smallest result is a useful estimate of how fast the code can run under those conditions, with less interference from other work on the machine.

```python
import timeit

ids = list(range(10_000))
ids_set = set(ids)

list_best = min(timeit.repeat("9_999 in ids", globals=globals(), number=1_000, repeat=5))
set_best = min(timeit.repeat("9_999 in ids_set", globals=globals(), number=1_000, repeat=5))

print("set is faster:", set_best < list_best)
```

```text
set is faster: True
```

On one laptop, the list took 0.103 seconds and the set 0.00004 seconds. The numbers vary by machine, so the example prints the comparison. To measure a longer operation, take the difference between two readings of `time.perf_counter()`.

```python
import time

timings = {}

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        timings[func.__name__] = time.perf_counter() - start
        return result
    return wrapper

@timer
def loop_total(numbers):
    total = 0
    for n in numbers:
        total += n
    return total

@timer
def builtin_total(numbers):
    return sum(numbers)

numbers = list(range(1_000_000))
print(loop_total(numbers) == builtin_total(numbers))
print("fastest:", min(timings, key=timings.get))
```

```text
True
fastest: builtin_total
```

One desktop run recorded about 0.027 and 0.007 seconds. The order can differ in the browser. Compare the results on the runtime you intend to use.

## How big is an object?

`sys.getsizeof(obj)` reports the shallow size in bytes. A list holds references to its items, so this measurement includes space for the references and excludes the memory used by the items.

```python
import sys

short = [letter for letter in "abc"]
long = [letter * 10_000 for letter in "abc"]

print(sys.getsizeof(7), sys.getsizeof("Tashkent"))
print(sys.getsizeof(short), sys.getsizeof(long))
print(sys.getsizeof([n for n in range(1_000)]), sys.getsizeof(n for n in range(1_000)))
```

```text
28 49
88 88
8856 200
```

The displayed sizes come from a desktop run. In the browser, the second line can be `44 44` instead of `88 88`. Both lists have room for the same number of references even though one references longer strings. The generator in this example produces one item at a time, so it does not store all the items in advance.

## Reference counting, `gc`, and `weakref`

CPython tracks references from names, containers, and attributes. In a conventional build, an ordinary object whose last strong reference is released can usually be reclaimed immediately. Finalization timing is an implementation detail. `sys.getrefcount` includes the temporary reference from the call and can return unusual values for immortal objects, so the example compares changes for an ordinary object.

```python
import sys

prices = [15000, 8000]
before = sys.getrefcount(prices)

basket = prices
orders = {"lunch": prices}
print(sys.getrefcount(prices) - before)

del basket
print(sys.getrefcount(prices) - before)
```

```text
2
1
```

Objects in an unreachable reference cycle can still refer to each other, leaving their counts above zero. The cyclic garbage collector can find such groups. Call `gc.collect()` to request a collection. A **weak reference** lets you refer to an object without keeping it alive.

```python
import gc
import weakref

class Customer:
    def __init__(self, name):
        self.name = name
        self.friend = None

gc.disable()                        # only collect when we ask
aziza = Customer("Aziza")
bobur = Customer("Bobur")
aziza.friend = bobur
bobur.friend = aziza                # a cycle
watch = weakref.ref(aziza)          # watch() gives the object or None

del aziza, bobur
print("alive after del:", watch() is not None)
print("gc found garbage:", gc.collect() > 0)
print("alive after collect:", watch() is not None)
gc.enable()
```

```text
alive after del: True
gc found garbage: True
alive after collect: False
```

A `weakref.WeakValueDictionary` removes an entry when its value is collected. It can be useful when a cache should keep an object only while other code still holds it.

## Finding where memory goes: `tracemalloc`

`tracemalloc` tracks memory blocks allocated through Python's memory allocators after tracing starts. A snapshot can group the tracked blocks by the Python line that allocated them.

```python
import tracemalloc

def load_orders():
    return [{"id": n, "city": "Tashkent", "total": n * 1000} for n in range(50_000)]

def load_names():
    return [f"customer-{n}" for n in range(50_000)]

tracemalloc.start()
orders = load_orders()
names = load_names()
snapshot = tracemalloc.take_snapshot()
tracemalloc.stop()

for stat in snapshot.statistics("lineno")[:2]:
    frame = stat.traceback[0]
    print(f"line {frame.lineno}: {stat.size / 1_000_000:.1f} MB")
```

```text
line 4: 12.8 MB
line 7: 3.2 MB
```

In this run, the dictionary allocation on line 4 used the most memory. The byte counts depend on the runtime. Try `__slots__` when the program creates many small instances. `get_traced_memory()` returns current and peak bytes.

```python
import tracemalloc

class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

class SlotPoint:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x, self.y = x, y

for cls in (Point, SlotPoint):
    tracemalloc.start()
    points = [cls(n, n) for n in range(100_000)]
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    print(f"{cls.__name__}: {current // 100_000} bytes per point")
```

```text
Point: 127 bytes per point
SlotPoint: 87 bytes per point
```

These sample figures include the list and integer objects. The browser uses different sizes. Compare the two rows within one runtime.

## Finding slow code: `cProfile`

`cProfile` records the number of calls and the time spent in each function. Use `pstats` to sort and inspect the results.

```python
import cProfile
import pstats

def parse(line):
    city, amount = line.split(",")
    return city, int(amount)

def total_by_city(lines):
    totals = {}
    for line in lines:
        city, amount = parse(line)
        totals[city] = totals.get(city, 0) + amount
    return totals

lines = ["Tashkent,15000", "Samarkand,8000", "Bukhara,12000"] * 20_000

with cProfile.Profile() as profiler:
    total_by_city(lines)

stats = pstats.Stats(profiler).strip_dirs()
calls = stats.get_stats_profile().func_profiles
print("parse ran", calls["parse"].ncalls, "times")
```

```text
parse ran 60000 times
```

For the full table, call `stats.sort_stats("cumulative").print_stats(2)`. One run printed (your times will differ):

```text
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.028    0.028    0.075    0.075 sales.py:8(total_by_city)
    60000    0.026    0.000    0.038    0.000 sales.py:4(parse)
```

`cumtime` includes time spent in functions called from the row's function. `tottime` counts time spent in the row's function itself. Use both columns to follow the call path and find the work worth investigating.

## Common speed-ups

After measuring, consider the following changes and measure again on the same workload.

- **Set membership** is typically constant time for ordinary hashable keys. List membership can examine every item. Include the cost of building a set if membership is checked only once.
- **`"".join(parts)`** instead of `text += part` in a loop.
- **Built-ins and comprehensions** instead of manual loops.
- **Local names** can reduce repeated lookup in some loops. Measure before changing a clear expression such as `math.sqrt(x)`.
- **Caching** repeated work with `functools.lru_cache`:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def route_count(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return route_count(rows - 1, cols) + route_count(rows, cols - 1)

print(route_count(16, 16))
print(route_count.cache_info())
```

```text
155117520
CacheInfo(hits=196, misses=255, maxsize=None, currsize=255)
```

Without the cache this makes about 310 million calls; with it, 451.

Spend effort where a change can improve a result users notice. A function called once may still deserve attention when it dominates the program's running time.

## Try it

Change `n` to 100,000 and watch the gap grow.

<ClientOnly><PythonPlayground :code='"import timeit\n\nn = 1_000\nitems = list(range(n))\nitems_set = set(items)\n\nlist_time = timeit.timeit(lambda: (n - 1) in items, number=1_000)\nset_time = timeit.timeit(lambda: (n - 1) in items_set, number=1_000)\nprint(f\"list: {list_time:.5f} s\")\nprint(f\"set:  {set_time:.5f} s\")"' /></ClientOnly>

## Common mistakes

### 1. Comparing different amounts of work

```py
import timeit

loop = timeit.timeit("[n * 2 for n in range(1000)]", number=10_000)
builtin = timeit.timeit("list(map(lambda n: n * 2, range(1000)))", number=100)
print(loop, builtin)
```

```text
0.3371560389999786 0.0063662349999731305
```

One expression ran 10,000 times and the other 100 times, so comparing the totals gives a misleading result. Use the same input, run count, and repeated measurement for both expressions.

### 2. Timing once with `time.time()`

```py
import time

start = time.time()
total = sum(range(10_000))
print(time.time() - start)
```

```text
0.00016045570373535156
```

One tiny run is mostly noise, and `time.time()` can jump with the system clock. **Fix:** use `timeit` for small snippets and `time.perf_counter()` for longer tasks.

### 3. An accidental reference keeps data alive

```python
import weakref

class Report:
    def __init__(self, rows):
        self.rows = rows

def row_count(report, seen=[]):      # Bad: this list lives as long as the function
    seen.append(report)
    return len(report.rows)

report = Report(list(range(1_000_000)))
alive = weakref.ref(report)
print(row_count(report))
del report
print("still in memory:", alive() is not None)
```

```text
1000000
still in memory: True
```

The default list keeps every report ever passed in alive; globals and unbounded caches can do the same. **Fix:** don't store what you don't need.

### 4. Optimizing code that runs once

```python
cities = "Tashkent,Samarkand,Bukhara".split(",")
# Bad: a cryptic "speed trick" in code that runs once
lookup = dict(map(reversed, enumerate(cities)))
# Good: obvious; the difference is microseconds
clear = {city: i for i, city in enumerate(cities)}
print(lookup == clear, clear)
```

```text
True {'Tashkent': 0, 'Samarkand': 1, 'Bukhara': 2}
```

Start with the part of the workload that matters most. How often a function runs is one factor in that decision.

## Practice

### 1. Shallow and deep size <Difficulty level="1" />

Write `deep_size(items)` for a flat list with distinct items. Add the shallow size of the list to the shallow size of each item. A fully recursive measurement would also need to avoid counting a shared object twice. Use `words = [word * 1000 for word in ["plov", "somsa"]]` and `short = [word[0] for word in words]`. Print whether `deep_size(words) > sys.getsizeof(words)` and whether `sys.getsizeof(words) == sys.getsizeof(short)`.

::: details Solution
```python
import sys

def deep_size(items):
    return sys.getsizeof(items) + sum(sys.getsizeof(item) for item in items)

words = [word * 1000 for word in ["plov", "somsa"]]
short = [word[0] for word in words]
print(deep_size(words) > sys.getsizeof(words))
print(sys.getsizeof(words) == sys.getsizeof(short))
```

```text
True
True
```
:::

### 2. Watch an object disappear <Difficulty level="1" />

Create an `Order` and register a callback with `weakref.finalize(order, print, "Order 42 freed")`. Print `deleting...`, delete the last reference you hold, then print `done`. The timing shown is typical for this example on CPython.

::: details Solution
```python
import weakref

class Order:
    pass

order = Order()
weakref.finalize(order, print, "Order 42 freed")
print("deleting...")
del order
print("done")
```

```text
deleting...
Order 42 freed
done
```
:::

### 3. Count the real work <Difficulty level="2" />

`delivery_cost(city)` looks up `{"Tashkent": 20000, "Bukhara": 35000, "Nukus": 50000}` and adds one to a global `calls` counter (imagine a slow database query). Cache it with `@lru_cache(maxsize=None)`, then for orders to Tashkent, Bukhara, Tashkent, Nukus, Bukhara, Tashkent print the total cost, `calls`, and `delivery_cost.cache_info()`.

::: details Solution
```python
from functools import lru_cache

PRICES = {"Tashkent": 20000, "Bukhara": 35000, "Nukus": 50000}
calls = 0

@lru_cache(maxsize=None)
def delivery_cost(city):
    global calls
    calls += 1                  # the slow part runs only on a cache miss
    return PRICES[city]

orders = ["Tashkent", "Bukhara", "Tashkent", "Nukus", "Bukhara", "Tashkent"]
print(sum(delivery_cost(city) for city in orders))
print(calls)
print(delivery_cost.cache_info())
```

```text
180000
3
CacheInfo(hits=3, misses=3, maxsize=None, currsize=3)
```

:::

### 4. Pick the right structure <Difficulty level="2" />

Write `clean(message)` that replaces the banned words `spam`, `cheap`, and `gold` (kept in a set) with `***`. Clean and print `"buy cheap gold now"`, `"salom from Tashkent"`, and `"cheap spam here"`.

::: details Solution
```python
banned = {"spam", "cheap", "gold"}

def clean(message):
    return " ".join("***" if word in banned else word for word in message.split())

for message in ["buy cheap gold now", "salom from Tashkent", "cheap spam here"]:
    print(clean(message))
```

```text
buy *** *** now
salom from Tashkent
*** *** here
```
:::

### 5. Profile, fix, profile again <Difficulty level="3" />

`is_prime_slow(n)` tries divisors from 2 up to `n - 1`, stopping on the first divisor. Write `is_prime_fast(n)` so it only tries divisors up to the square root. Profile both while counting primes from 2 to 2,999. Print each function name, the prime count, and the number of calls to `divides`.

::: details Solution
```python
import cProfile
import pstats

def divides(d, n):
    return n % d == 0

def is_prime_slow(n):
    for d in range(2, n):
        if divides(d, n):
            return False
    return True

def is_prime_fast(n):
    d = 2
    while d * d <= n:
        if divides(d, n):
            return False
        d += 1
    return True

for is_prime in (is_prime_slow, is_prime_fast):
    with cProfile.Profile() as profiler:
        count = sum(1 for n in range(2, 3_000) if is_prime(n))
    calls = pstats.Stats(profiler).get_stats_profile().func_profiles["divides"].ncalls
    print(is_prime.__name__, count, calls)
```

```text
is_prime_slow 430 601875
is_prime_fast 430 23091
```

Call counts don't depend on your computer's speed.
:::

## Recap

- Measure first: `min(timeit.repeat(...))` for snippets, `time.perf_counter()` in a `@timer` for functions.
- `sys.getsizeof` is shallow; `tracemalloc` shows which lines allocate the most.
- CPython counts references and can collect unreachable cycles with `gc`. A weak reference does not keep its target alive.
- `cProfile` with `pstats` sorted by `cumulative` shows where time goes.
- Choose changes after measuring. The right data structure, less repeated work, and smaller objects can each help a different problem.

## Further reading

- [`timeit`: measure execution time of small code snippets](https://docs.python.org/3/library/timeit.html)
- [The Python profilers (`cProfile`, `pstats`)](https://docs.python.org/3/library/profile.html)
- [`tracemalloc`: trace memory allocations](https://docs.python.org/3/library/tracemalloc.html)
- [`gc`](https://docs.python.org/3/library/gc.html) and [`weakref`](https://docs.python.org/3/library/weakref.html)
