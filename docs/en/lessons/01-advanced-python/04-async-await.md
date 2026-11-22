---
title: Async and await
description: "Use coroutines, tasks, timeouts, and queues to overlap work in asynchronous Python."
---

# Async and await

![Illustration: Async and await](/images/topics-webp/async-await.webp){.lesson-cover width=1536 height=1024}

::: tip What you'll learn
- What a **coroutine** is, and what `await` does while a program waits
- How to run coroutines **concurrently** with `asyncio.gather`, `create_task` and `TaskGroup`
- How to stop slow work with `asyncio.timeout`
- How producers and consumers share work through an `asyncio.Queue`
- When async helps (waiting on I/O) and when it does not (heavy calculations)
:::

## Why it matters

Suppose a currency app requests rates from ten offices. If each answer takes a second, waiting for one reply before sending the next request takes about ten seconds. Starting the requests together lets the waits overlap, so the group can finish in about a second under these assumptions.

## Coroutines and `await`

Calling a regular `async def` function creates a **coroutine** object. The body runs when you await the coroutine or schedule it as a task. If the operation you await has to wait, your task can pause and let the event loop run other work. An operation that is already ready may return immediately.

`asyncio.sleep` stands in for a slow network request:

```python
import asyncio
import time

async def fetch_price(city, delay):
    await asyncio.sleep(delay)          # pretend to wait for a server
    return f"{city}: 12,650 som"

async def main():
    start = time.perf_counter()
    for city, delay in [("Tashkent", 0.1), ("Samarkand", 0.2), ("Bukhara", 0.3)]:
        print(await fetch_price(city, delay))
    print(f"took {time.perf_counter() - start:.1f} s")

await main()
```

```text
Tashkent: 12,650 som
Samarkand: 12,650 som
Bukhara: 12,650 som
took 0.6 s
```

The **event loop** schedules tasks and runs them when they are ready. A task can give the loop a chance to run another task when it suspends.

::: info Scripts vs this page
The browser editor supports top-level `await main()`, as do some notebook environments. In a normal `.py` script, start the event loop with `asyncio.run(main())` instead. Use one form for your environment.

```py
import asyncio

async def main():
    print("Salom!")

if __name__ == "__main__":
    asyncio.run(main())
```
:::

## Running concurrently with `gather`

The first example waits for each request before starting the next. `asyncio.gather` schedules the coroutines together. If they all succeed, it returns their results in the order you supplied them. By default, the first exception is raised to the caller and the other tasks may keep running.

```python
import asyncio
import time

async def fetch_price(city, delay):
    await asyncio.sleep(delay)
    print(f"  {city} answered")
    return f"{city}: 12,650 som"

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        fetch_price("Bukhara", 0.3),
        fetch_price("Tashkent", 0.1),
        fetch_price("Samarkand", 0.2),
    )
    print(results)
    print(f"took {time.perf_counter() - start:.1f} s")

await main()
```

```text
  Tashkent answered
  Samarkand answered
  Bukhara answered
['Bukhara: 12,650 som', 'Tashkent: 12,650 som', 'Samarkand: 12,650 som']
took 0.3 s
```

The waits overlap. This example takes roughly the longest delay (0.3 seconds), plus scheduling overhead, on one event loop thread.

## Tasks and the event loop

`asyncio.create_task(coro)` schedules a coroutine to run as a **task**. With default scheduling, the event loop runs it after the current task yields control. Await the task to get its result.

![Diagram: Tasks and the Event Loop](/images/companions-webp/async-task-timeline.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```python
import asyncio

async def cook(dish, minutes):
    print(f"start {dish}")
    await asyncio.sleep(minutes / 100)
    print(f"{dish} ready")
    return dish

async def main():
    plov = asyncio.create_task(cook("plov", 20))
    samsa = asyncio.create_task(cook("samsa", 10))
    print("tasks created")
    await asyncio.sleep(0)            # pause once so the tasks can start
    print("setting the table")
    print("served:", await plov, await samsa)

await main()
```

```text
tasks created
start plov
start samsa
setting the table
samsa ready
plov ready
served: plov samsa
```

In this example, `await asyncio.sleep(0)` explicitly yields control. Awaiting an already completed task, by contrast, can return immediately. Python 3.14 also supports explicit eager task execution.

### `TaskGroup`

`asyncio.TaskGroup` waits for all of its tasks when you leave the `async with` block. If a task raises an exception other than `CancelledError`, the group cancels its remaining tasks and waits for them before reporting the failure.

```python
import asyncio

async def fetch_rate(office, delay):
    await asyncio.sleep(delay)
    if office == "Chorsu":
        raise ConnectionError(f"{office} is offline")
    return 12_650

async def main():
    async with asyncio.TaskGroup() as tg:
        a = tg.create_task(fetch_rate("Amir Temur", 0.1))
    print("rate:", a.result())

    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(fetch_rate("Chorsu", 0.1))
            tg.create_task(fetch_rate("Yunusobod", 0.5))
    except* ConnectionError as group:
        print("failed:", group.exceptions[0])

await main()
```

```text
rate: 12650
failed: Chorsu is offline
```

The group reports failures together. `except* ConnectionError` handles the matching part of the exception group. Here the Chorsu request fails and the unfinished Yunusobod request is cancelled.

## Timeouts

`asyncio.timeout(seconds)` sets a deadline for the current task. When the deadline expires, it cancels that task and converts the resulting cancellation to `TimeoutError` on exit. Catch `TimeoutError` outside the `async with` block.

```python
import asyncio

async def fetch_price(city, delay):
    await asyncio.sleep(delay)
    return f"{city}: 12,650 som"

async def main():
    for city, delay in [("Tashkent", 0.05), ("Nukus", 1.0)]:
        try:
            async with asyncio.timeout(0.2):
                print(await fetch_price(city, delay))
        except TimeoutError:
            print(f"{city}: no answer in time")

await main()
```

```text
Tashkent: 12,650 som
Nukus: no answer in time
```

## Queues: producers and consumers

A **producer** puts work in an `asyncio.Queue`. A **consumer** takes work with `await queue.get()`, which waits when the queue is empty. Call `task_done()` once per item removed. `await queue.join()` waits for all queued items to be acknowledged.

```python
import asyncio

async def producer(queue):
    for order in ["plov", "samsa", "lagman", "manti"]:
        await queue.put(order)
        print(f"placed {order}")

async def cook(name, seconds, queue):
    while True:
        order = await queue.get()
        if order is None:
            queue.task_done()
            return
        await asyncio.sleep(seconds)
        print(f"{name} cooked {order}")
        queue.task_done()

async def main():
    queue = asyncio.Queue()
    cooks = [asyncio.create_task(cook(n, s, queue)) for n, s in [("Aziza", 0.1), ("Bobur", 0.25)]]
    await producer(queue)
    await queue.join()
    for _ in cooks:
        await queue.put(None)
    await asyncio.gather(*cooks)

await main()
```

```text
placed plov
placed samsa
placed lagman
placed manti
Aziza cooked plov
Aziza cooked lagman
Bobur cooked samsa
Aziza cooked manti
```

In the sample run, Aziza handles three orders. Timing can vary. Once the queue has drained, `main` sends a stop signal to each worker and waits for both to exit.

## `async for` and `async with`

An `async def` function containing `yield` is an **async generator**; you loop over it with `async for message in chat.messages():`, which may pause between items. Asynchronous context managers from *Context Managers in Depth*, such as `TaskGroup` or a database connection, are entered with `async with`, because connecting and disconnecting may both wait.

## When async helps

Async works well when many operations spend time waiting for I/O, such as a web server handling network connections. Long calculations and synchronous calls such as `time.sleep()` block the event loop thread until they return. For asynchronous HTTP requests, use a client such as `aiohttp` or `httpx`. For CPU-heavy work, see *Threads and Processes*.

## Try it

Try a third city in the timeouts example. Choose a delay and predict whether it will finish before the deadline.

<ClientOnly><PythonPlayground :code='"import asyncio\n\nasync def fetch_price(city, delay):\n    await asyncio.sleep(delay)\n    return f\"{city}: 12,650 som\"\n\nasync def safe_fetch(city, delay):\n    try:\n        async with asyncio.timeout(0.3):\n            return await fetch_price(city, delay)\n    except TimeoutError:\n        return f\"{city}: timed out\"\n\nasync def main():\n    results = await asyncio.gather(\n        safe_fetch(\"Tashkent\", 0.1),\n        safe_fetch(\"Samarkand\", 0.2),\n        safe_fetch(\"Nukus\", 0.8),\n    )\n    for line in results:\n        print(line)\n\nawait main()"' /></ClientOnly>

## Common mistakes

### 1. Forgetting `await`

```py
import asyncio

async def fetch_price(city):
    await asyncio.sleep(0.1)
    print(f"{city} price loaded")

async def main():
    fetch_price("Tashkent")        # Bad: no await
    print("done")

asyncio.run(main())
```

```text
RuntimeWarning: coroutine 'fetch_price' was never awaited
done
```

The call only created a coroutine object; the body never ran. **Fix:** `await fetch_price("Tashkent")`.

### 2. `time.sleep` inside a coroutine

```python
import asyncio
import time

async def fetch_price(city):
    time.sleep(0.1)                # Bad: blocks the whole event loop
    return city

async def main():
    start = time.perf_counter()
    await asyncio.gather(fetch_price("Tashkent"), fetch_price("Samarkand"), fetch_price("Bukhara"))
    print(f"took {time.perf_counter() - start:.1f} s")

await main()
```

```text
took 0.3 s
```

`time.sleep` never gives control back to the loop, so the three calls ran one after another. **Fix:** `await asyncio.sleep(0.1)`, which takes 0.1 s in total.

### 3. Calling `asyncio.run()` inside a running loop

```py
import asyncio

async def main():
    print("Salom")

asyncio.run(main())    # in this editor or in Jupyter
```

```text
RuntimeError: asyncio.run() cannot be called from a running event loop
```

`asyncio.run()` requires its own event loop and cannot be called while another loop is running in the same thread. Use `await main()` in this editor and `asyncio.run(main())` as the entry point of a regular script.

### 4. Creating a task and forgetting it

```py
import asyncio

async def send_receipt(name):
    await asyncio.sleep(0.1)
    print(f"sent receipt to {name}")

async def main():
    asyncio.create_task(send_receipt("Dilnoza"))   # Bad: no reference, never awaited
    print("order saved")

asyncio.run(main())
```

```text
order saved
```

The receipt was never sent: `asyncio.run()` cancels unfinished tasks when `main` returns, and a task nobody references can even be garbage-collected mid-run. **Fix:** keep the task in a variable and `await` it, or create it in a `TaskGroup`.

## Practice

### 1. Concurrent downloads <Difficulty level="1" />

Write `download(name, size)` that sleeps `size / 1000` seconds, prints `finished NAME` and returns `size`. `gather` downloads of `lesson.mp4` (300), `notes.pdf` (50) and `photo.jpg` (120), then print the total.

::: details Solution
```python
import asyncio

async def download(name, size):
    await asyncio.sleep(size / 1000)
    print(f"finished {name}")
    return size

async def main():
    sizes = await asyncio.gather(
        download("lesson.mp4", 300),
        download("notes.pdf", 50),
        download("photo.jpg", 120),
    )
    print(f"total: {sum(sizes)} MB")

await main()
```

```text
finished notes.pdf
finished photo.jpg
finished lesson.mp4
total: 470 MB
```
:::

### 2. A timeout wrapper <Difficulty level="1" />

Write `with_timeout(coro, seconds, default)` that returns the coroutine's result, or `default` after `seconds`. Test it with a 0.2 s limit on `asyncio.sleep(0.05, result="rate: 12650")` and on a 1 s sleep.

::: details Solution
```python
import asyncio

async def with_timeout(coro, seconds, default):
    try:
        async with asyncio.timeout(seconds):
            return await coro
    except TimeoutError:
        return default

async def main():
    print(await with_timeout(asyncio.sleep(0.05, result="rate: 12650"), 0.2, "no answer"))
    print(await with_timeout(asyncio.sleep(1, result="rate: 12650"), 0.2, "no answer"))

await main()
```

```text
rate: 12650
no answer
```
:::

### 3. Exam papers queue <Difficulty level="2" />

A producer puts `Aziza`, `Bobur`, `Dilnoza`, `Jasur` into an `asyncio.Queue`, then `None` as a stop signal. A consumer prints `checked NAME` for each paper until it gets `None`, and returns the count. Print it.

::: details Solution
```python
import asyncio

async def producer(queue):
    for name in ["Aziza", "Bobur", "Dilnoza", "Jasur"]:
        await queue.put(name)
    await queue.put(None)

async def checker(queue):
    count = 0
    while True:
        name = await queue.get()
        if name is None:
            return count
        await asyncio.sleep(0.01)
        print(f"checked {name}")
        count += 1

async def main():
    queue = asyncio.Queue()
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(queue))
        result = tg.create_task(checker(queue))
    print("papers checked:", result.result())

await main()
```

```text
checked Aziza
checked Bobur
checked Dilnoza
checked Jasur
papers checked: 4
```
:::

### 4. At most two at a time <Difficulty level="2" />

Run the orders `[("plov", 0.4), ("samsa", 0.1), ("lagman", 0.2), ("manti", 0.2)]` with `gather`, but at most two at once, using `asyncio.Semaphore(2)`. Print `start NAME`, `done NAME` and the returned names.

::: details Solution
```python
import asyncio

async def prepare(name, seconds, limit):
    async with limit:
        print(f"start {name}")
        await asyncio.sleep(seconds)
        print(f"done {name}")
        return name

async def main():
    limit = asyncio.Semaphore(2)
    orders = [("plov", 0.4), ("samsa", 0.1), ("lagman", 0.2), ("manti", 0.2)]
    names = await asyncio.gather(*(prepare(n, s, limit) for n, s in orders))
    print(names)

await main()
```

```text
start plov
start samsa
done samsa
start lagman
done lagman
start manti
done plov
done manti
['plov', 'samsa', 'lagman', 'manti']
```

A third order waits at `async with limit` until a running one releases the semaphore.
:::

### 5. Retry with backoff <Difficulty level="3" />

A flaky `fetch_rate()` raises `ConnectionError` twice, then returns `12650`. Write `retry(func, attempts, delay)`: on `ConnectionError` print `attempt N failed, waiting D s`, sleep, and double `delay`; re-raise after the last attempt. Try 4 attempts and 2 attempts, starting at `delay=0.01`, and print `rate: 12650` or `gave up: MESSAGE`.

::: details Solution
```python
import asyncio

def make_flaky(failures):
    calls = 0
    async def fetch_rate():
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.01)
        if calls <= failures:
            raise ConnectionError("server busy")
        return 12650
    return fetch_rate

async def retry(func, attempts, delay):
    for attempt in range(1, attempts + 1):
        try:
            return await func()
        except ConnectionError:
            if attempt == attempts:
                raise
            print(f"attempt {attempt} failed, waiting {delay} s")
            await asyncio.sleep(delay)
            delay *= 2

async def main():
    print("rate:", await retry(make_flaky(2), attempts=4, delay=0.01))
    try:
        await retry(make_flaky(2), attempts=2, delay=0.01)
    except ConnectionError as e:
        print("gave up:", e)

await main()
```

```text
attempt 1 failed, waiting 0.01 s
attempt 2 failed, waiting 0.02 s
rate: 12650
attempt 1 failed, waiting 0.01 s
gave up: server busy
```

The `fetch_rate` function returned by `make_flaky` is a closure. Each call to `make_flaky` creates a separate counter.
:::

## Recap

- Calling a regular `async def` function creates a coroutine. Await it or schedule it as a task to run it.
- A task that suspends lets the event loop run other work. Keep blocking calls and long calculations off the event loop thread.
- `gather`, `create_task`, and `TaskGroup` let independent waits overlap. A task group also manages sibling tasks when one fails.
- Catch a deadline's `TimeoutError` outside the timeout block. Use a queue to hand work between tasks.
- Scripts call `asyncio.run(main())`; this page and notebooks use `await main()`.
- Async helps with waiting (I/O), not with CPU-heavy work.

## Further reading

- [`asyncio`: Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html)
- [`asyncio`: Queues](https://docs.python.org/3/library/asyncio-queue.html)
- [`asyncio` HOWTO: A conceptual overview](https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html)
