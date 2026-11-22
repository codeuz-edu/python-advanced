---
title: Testing in Depth
description: "Organize pytest tests, manage fixtures, capture output, and replace external services with test doubles."
---

# Testing in Depth

![Illustration: Testing in Depth](/images/topics-webp/testing-in-depth.webp){.lesson-cover width=1536 height=1024}

::: tip What you'll learn
- How to organize tests with a **`tests/` folder**, **`conftest.py`** and `-k`
- **Fixture scopes** and **`yield` fixtures** for setup and teardown
- The built-in fixtures **`monkeypatch`**, **`capsys`** and **`caplog`**
- **`unittest.mock`**: `Mock`, `patch`, `return_value`, `side_effect`
- When to use a **test double**, and what makes a test good
:::

## Why it matters

A delivery app reads settings, sends text messages, and logs failed payments. A unit test can check what the app would send without contacting a phone network. Building on *Testing with pytest*, this chapter shows how to control those dependencies and inspect the results.

::: info Run pytest on your computer
Run the pytest files (blocks without a Run button) locally. The runnable blocks use `unittest.mock`, `logging` and plain `assert`, which work in the browser.
:::

## Organizing a test suite

When a project has several test files, put them in a `tests/` directory. The layout below is an example. The snippets that follow identify which files to create.

```text
shop_project/
├── shop.py
├── pytest.ini          # pythonpath = .
└── tests/
    ├── conftest.py     # shared fixtures
    ├── test_orders.py
    └── test_shop.py
```

- pytest discovers `conftest.py` automatically. Fixtures there are available to tests in that directory and its descendants.
- Name tests after behavior: `test_large_discount_logs_warning`, not `test_discount2`.
- A `[pytest]` section with `pythonpath = .` in `pytest.ini` adds the project root to the import path for this layout.
- `pytest -k "currency or receipt"` runs only tests whose names match (`collected 6 items / 4 deselected / 2 selected`).

## Fixture scopes and `yield` fixtures

A fixture can prepare a resource, yield it to the test, and clean it up afterwards. If the fixture reaches `yield`, pytest runs the cleanup even when the test fails. If setup fails before `yield`, the statements after it do not run. Put this fixture in `tests/conftest.py`.

![Diagram: Fixture Setup and Teardown](/images/companions-webp/fixture-lifecycle.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```py
import pytest


class FakeDatabase:
    def __init__(self):
        self.orders = []

    def close(self):
        print("closed")


@pytest.fixture
def db():
    database = FakeDatabase()   # setup
    print("connected")
    yield database              # the test runs here
    database.close()            # teardown, even if the test failed
```

With two tests using `db`, `pytest -q -s` (show prints) gives:

```text
connected
.closed
connected
.closed

2 passed in 0.01s
```

The **scope** determines how long pytest keeps a fixture instance. These are three common scopes.

| Scope | Created once per | Use for |
|---|---|---|
| `function` (default) | test | anything a test changes |
| `module` | test file | slow, read-only setup |
| `session` | test run | a test server |

Wider scopes can reduce repeated setup. Tests that share a mutable fixture can affect each other, as the mistakes section demonstrates.

## Built-in fixtures: `monkeypatch`, `capsys`, `caplog`

Try these pytest fixtures locally. Use the four functions in the standalone example below as `shop.py` and save this block as `tests/test_shop.py`. Run `python -m pytest` from the project root.

```py
import shop


def test_currency_from_env(monkeypatch):
    monkeypatch.setenv("SHOP_CURRENCY", "USD")
    assert shop.get_currency() == "USD"


def test_ask_quantity(monkeypatch):
    monkeypatch.setattr("builtins.input", lambda prompt: "3")
    assert shop.ask_quantity() == 3


def test_receipt(capsys):
    shop.print_receipt({"somsa": 8000})
    captured = capsys.readouterr()
    assert captured.out == "somsa: 8000 som\n"


def test_large_discount_logs(caplog):
    assert shop.apply_discount(100000, 60) == 40000
    assert "large discount 60%" in caplog.text
```

- **`monkeypatch`** sets environment variables (`setenv`, `delenv`) and attributes (`setattr`), and **undoes every change** after the test.
- **`capsys`** captures writes to Python's standard output and error streams. **`caplog`** captures log records. Call `caplog.set_level(...)` when you need to capture records below the configured level.

The next block contains the four functions. Its second half checks them with the standard library, so you can run the full example in the browser.

```python
from contextlib import redirect_stdout
from io import StringIO
import logging
import os
import unittest
from unittest.mock import patch

logger = logging.getLogger("shop")

def get_currency():
    return os.environ.get("SHOP_CURRENCY", "som")

def ask_quantity():
    return int(input("How many? "))

def print_receipt(items):
    for name, price in items.items():
        print(f"{name}: {price} som")

def apply_discount(price, percent):
    if percent > 100:
        raise ValueError("percent must be at most 100")
    if percent > 50:
        logger.warning("large discount %s%%", percent)
    return price * (100 - percent) // 100

with patch.dict(os.environ, {"SHOP_CURRENCY": "USD"}):
    assert get_currency() == "USD"

with patch("builtins.input", return_value="3"):
    assert ask_quantity() == 3

output = StringIO()
with redirect_stdout(output):
    print_receipt({"somsa": 8000})
assert output.getvalue() == "somsa: 8000 som\n"

case = unittest.TestCase()
with case.assertLogs("shop", level="WARNING") as logs:
    assert apply_discount(100000, 60) == 40000
print(logs.output)

with case.assertRaisesRegex(ValueError, "at most 100"):
    apply_discount(100000, 150)
print("all checks passed")
```

```text
['WARNING:shop:large discount 60%']
all checks passed
```

`assertLogs` fails if nothing is logged; `assertRaisesRegex` works like `pytest.raises(..., match=...)`.

## `Mock`: a fake object that records calls

A default **`Mock`** creates child mocks for ordinary attributes on demand and records calls. Use a `spec` when you want to restrict which attributes exist. Set **`return_value`** to control what a call returns.

```python
from unittest.mock import Mock

sms = Mock()
sms.send.return_value = "delivered"

print(sms.send("+998901234567", "Your plov is on its way"))
print("calls:", sms.send.call_count)
sms.send.assert_called_once_with("+998901234567", "Your plov is on its way")
print("assert_called_once_with passed")
```

```text
delivered
calls: 1
assert_called_once_with passed
```

Use **`side_effect`** to run a function, raise an exception, or supply successive results from an iterable. An exception in that iterable is raised when its turn comes.

```python
from unittest.mock import Mock

def notify(sms, phone):
    try:
        return sms.send(phone, "Order ready")
    except ConnectionError:
        return "will retry later"

sms = Mock()
sms.send.side_effect = ConnectionError("network down")
print(notify(sms, "+998901234567"))

sms.send.side_effect = ["failed", "delivered"]
print(sms.send(), sms.send())
```

```text
will retry later
failed delivered
```

## `patch`: replacing a name for one test

Use **`patch("module.name")`** to replace the name where the code looks it up. By default, patch creates a mock and restores the original object when the context manager or decorated function exits.

```python
import random
from unittest.mock import patch

def pick_winner(names):
    return random.choice(names)

with patch("random.choice", return_value="Dilnoza") as fake_choice:
    print(pick_winner(["Aziza", "Bobur", "Dilnoza"]))
fake_choice.assert_called_once_with(["Aziza", "Bobur", "Dilnoza"])

@patch("random.choice")
def test_winner(fake_choice):
    fake_choice.return_value = "Jasur"
    assert pick_winner(["Jasur", "Bobur"]) == "Jasur"

test_winner()
print("test_winner passed")
```

```text
Dilnoza
test_winner passed
```

The decorator passes the mock in as an argument. This works because `pick_winner` looks up `random.choice` **when it runs** (see Common mistakes).

## Test doubles or real objects?

A **test double** stands in for a dependency, such as an SMS gateway or clock. A stub supplies a prepared answer, a fake implements a simplified version, and a mock can record calls. Use real objects when they are fast and give you a reliable test.

For time and randomness, pass a clock function or a seeded random number generator as an argument. The test can then choose the inputs directly.

```python
import random
from datetime import datetime

def greeting(now=datetime.now):
    return "Xayrli tong" if now().hour < 12 else "Xayrli kun"

assert greeting(lambda: datetime(2026, 9, 16, 9, 0)) == "Xayrli tong"
assert greeting(lambda: datetime(2026, 9, 16, 15, 0)) == "Xayrli kun"

rng = random.Random(42)
print([rng.randint(1, 6) for _ in range(5)])
```

```text
[6, 1, 1, 6, 3]
```

The main program uses the default clock. The tests pass a fixed time. Creating a new `random.Random` with the same seed gives a reproducible sequence within the same Python version.

Line coverage measures which executable lines ran. Install `pytest-cov` and run `pytest --cov=shop`. Even 100% line coverage leaves open whether the assertions checked the right behavior.

A good test:

- checks **one behavior**, named after it;
- is **fast** and **deterministic** (same result every run);
- is **independent**: passes alone and in any order;
- asserts on **results**, not internal details;
- **fails** when the code is broken (break it once to check).

## Try it

This retry gives up too early. Make the test pass.

<ClientOnly><PythonPlayground :code='"from unittest.mock import Mock\n\ndef fetch_rate(api, attempts=2):\n    for attempt in range(attempts):\n        try:\n            return api.get_rate(\"USD\")\n        except ConnectionError:\n            print(f\"attempt {attempt + 1} failed\")\n    return None\n\napi = Mock()\napi.get_rate.side_effect = [ConnectionError(), ConnectionError(), 12650]\n\nrate = fetch_rate(api)\nprint(\"rate:\", rate, \"calls:\", api.get_rate.call_count)\nassert rate == 12650, \"expected the third call to succeed\"\nprint(\"test passed\")"' /></ClientOnly>

## Common mistakes

### 1. Patching where a name is defined, not where it is used

`rates.py` defines `fetch_rate()`, and `prices.py` does `from rates import fetch_rate`, creating a **second name**. Patching `rates.fetch_rate` misses it:

`rates.py`

```py
def fetch_rate():
    raise ConnectionError("no internet in tests")
```

`prices.py`

```py
from rates import fetch_rate

def price_in_som(amount):
    return amount * fetch_rate()
```

`tests/test_prices.py`

```py
from unittest.mock import patch

from prices import price_in_som


def test_price_wrong_path():
    with patch("rates.fetch_rate", return_value=12500):  # Bad
        assert price_in_som(2) == 25000
```

```text
    def fetch_rate():
>       raise ConnectionError("no internet in tests")
E       ConnectionError: no internet in tests
```

**Fix:** patch the name where the code looks it up: `patch("prices.fetch_rate", return_value=12500)`.

### 2. A module-scoped fixture with mutable state

The `db` fixture from above, now with `scope="module"` (Bad: one list for the whole file):

```py
def test_add_order(db):
    db.orders.append("plov")
    assert db.orders == ["plov"]


def test_no_orders_yet(db):
    assert db.orders == []
```

```text
E       AssertionError: assert ['plov'] == []
E         
E         Left contains one more item: 'plov'
```

`test_no_orders_yet` passes alone but fails after `test_add_order`. **Fix:** use the default `function` scope for mutable objects.

### 3. Mocking the thing you are testing

```python
from unittest.mock import Mock

class Cart:
    def __init__(self, prices):
        self.prices = prices

    def total(self):
        return sum(self.prices) * 2   # bug

cart = Cart([15000, 8000])
cart.total = Mock(return_value=23000)   # Bad: replaces the real method
assert cart.total() == 23000
print("test passed, but the real total is", Cart.total(cart))
```

```text
test passed, but the real total is 46000
```

The assertion succeeds because the mock was configured to return that value. To check your implementation, call it and replace a dependency it uses.

### 4. Asserting a call that never happened

```py
from unittest.mock import Mock

def place_order(items, sms):
    total = sum(items.values())
    if total > 1_000_000:          # bug: every order should send an SMS
        sms.send(f"Order total: {total} som")
    return total

sms = Mock()
place_order({"plov": 35000}, sms)
sms.send.assert_called_with("Order total: 35000 som")
```

```text
AssertionError: expected call not found.
Expected: send('Order total: 35000 som')
  Actual: not called.
```

The test found a real bug. **Fix:** the code, not the test; `call_args` shows what really happened.

## Practice

### 1. A fake exchange-rate API <Difficulty level="1" />

Write `usd_to_som(amount, api)` returning `amount * api.get_rate("USD")`. With a `Mock` whose `get_rate` returns `12650`, print the result for 20 USD, check the call with `assert_called_once_with`, and print `"call checked"`.

::: details Solution
```python
from unittest.mock import Mock

def usd_to_som(amount, api):
    return amount * api.get_rate("USD")

api = Mock()
api.get_rate.return_value = 12650

print(usd_to_som(20, api))
api.get_rate.assert_called_once_with("USD")
print("call checked")
```

```text
253000
call checked
```
:::

### 2. Environment variables with `monkeypatch` <Difficulty level="1" />

Run locally: `greet.py` has `greeting()`, which returns `f"Salom, {name}!"` where `name` is the `USER_NAME` environment variable or `"friend"`. Write two pytest tests with `monkeypatch`: one sets the variable, one removes it.

::: details Solution
`greet.py`

```py
import os

def greeting():
    name = os.environ.get("USER_NAME", "friend")
    return f"Salom, {name}!"
```

`test_greet.py`

```py
from greet import greeting


def test_name_from_env(monkeypatch):
    monkeypatch.setenv("USER_NAME", "Aziza")
    assert greeting() == "Salom, Aziza!"


def test_default_name(monkeypatch):
    monkeypatch.delenv("USER_NAME", raising=False)
    assert greeting() == "Salom, friend!"
```

```text
..                                                                       [100%]
2 passed in 0.01s
```
:::

### 3. Retry until it works <Difficulty level="2" />

Write `send_with_retry(sms, text, attempts=3)`: call `sms.send(text)` until it does not raise `ConnectionError`; return the attempt number, or `None` if all fail. With `side_effect`, test a mock that fails twice then succeeds and one that always fails. Print each result and call count.

::: details Solution
```python
from unittest.mock import Mock

def send_with_retry(sms, text, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            sms.send(text)
            return attempt
        except ConnectionError:
            pass
    return None

flaky = Mock()
flaky.send.side_effect = [ConnectionError(), ConnectionError(), "ok"]
print(send_with_retry(flaky, "Salom"), flaky.send.call_count)

broken = Mock()
broken.send.side_effect = ConnectionError("down")
print(send_with_retry(broken, "Salom"), broken.send.call_count)
```

```text
3 3
None 3
```
:::

### 4. A `yield` fixture with `tmp_path` <Difficulty level="2" />

Run locally: `orders.py` has `count_orders(path)`, which returns the number of lines in a file. Write a `yield` fixture that creates a two-line `orders.csv` in `tmp_path`, and after the test prints `"deleting orders.csv"` and deletes it. Run `pytest -q -s`.

::: details Solution
`orders.py`

```py
def count_orders(path):
    with path.open(encoding="utf-8") as file:
        return sum(1 for line in file)
```

`test_orders.py`

```py
import pytest

from orders import count_orders


@pytest.fixture
def orders_file(tmp_path):
    path = tmp_path / "orders.csv"
    path.write_text("plov,35000\nsomsa,8000\n", encoding="utf-8")
    yield path
    print("deleting", path.name)
    path.unlink()


def test_count_orders(orders_file):
    assert count_orders(orders_file) == 2
```

```text
.deleting orders.csv

1 passed in 0.01s
```
:::

### 5. Weekend reports <Difficulty level="3" />

Write `daily_report(sms, now)`: on weekends (`now().weekday() >= 5`) it logs INFO `"weekend, no report"` to the `"reports"` logger; otherwise it calls `sms.send("Daily report ready")`. Test both cases with a `Mock`, fixed clocks, `assertLogs` and `assert_not_called`, then print `"2 tests passed"`.

::: details Solution
```python
import logging
import unittest
from datetime import datetime
from unittest.mock import Mock

logger = logging.getLogger("reports")

def daily_report(sms, now=datetime.now):
    if now().weekday() >= 5:
        logger.info("weekend, no report")
        return
    sms.send("Daily report ready")

def test_weekday_sends():
    sms = Mock()
    daily_report(sms, now=lambda: datetime(2026, 9, 16))  # Wednesday
    sms.send.assert_called_once_with("Daily report ready")

def test_weekend_logs():
    sms = Mock()
    with unittest.TestCase().assertLogs("reports", level="INFO") as logs:
        daily_report(sms, now=lambda: datetime(2026, 9, 19))  # Saturday
    sms.send.assert_not_called()
    assert logs.output == ["INFO:reports:weekend, no report"]

test_weekday_sends()
test_weekend_logs()
print("2 tests passed")
```

```text
2 tests passed
```
:::

## Recap

- Put tests in `tests/`, share fixtures in `conftest.py`, and run a subset with `-k`.
- A fixture can clean up after `yield`. A wider scope shares the fixture across more tests.
- `monkeypatch`, `capsys` and `caplog` handle environment, output and logs.
- `Mock` records calls; `return_value` and `side_effect` control them.
- Patch a name **where it is used**, and mock only the edges: network, time, randomness.

## Further reading

- [unittest.mock: getting started](https://docs.python.org/3/library/unittest.mock-examples.html)
- [unittest.mock: Where to patch](https://docs.python.org/3/library/unittest.mock.html#where-to-patch)
- [pytest: How to use fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [pytest: How to monkeypatch/mock modules and environments](https://docs.pytest.org/en/stable/how-to/monkeypatch.html)
