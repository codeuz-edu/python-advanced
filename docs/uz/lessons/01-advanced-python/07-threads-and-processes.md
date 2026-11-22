---
title: Oqimlar va jarayonlar
description: "Oqimlar yordamida kutişlarni birga olib boramiz, jarayonlar yordamida hisoblarni parallel bajaramiz. Qulf, navbat va işçi guruhlarini köramiz."
---

# Oqimlar va jarayonlar

![Rasm: Oqimlar va jarayonlar](/images/topics-webp-uzb/threads-and-processes.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- **I/O-bound** va **CPU-bound** iş farqi hamda **GIL** ularning har biri uçun nimani anglatişi
- **Oqimni** (thread) qanday işga tuşiriş va `join` qiliş, nega umumiy maʼlumotlarga **`Lock`** kerak
- **`queue.Queue`** bilan işçilar pooli (worker pool) qanday quriladi
- **`ThreadPoolExecutor`** va **`ProcessPoolExecutor`** köp vazifalarni qanday bajaradi
- Oqimlar, jarayonlar va asyncio orasida qanday tanlaş
:::

## Nega bu muhim

Dökon ellikta saytdagi narxlarni tekşirmoqçi. İşning katta qismi javob kutişdan iborat bölsa, bir neça oqim bir paytda kuta oladi. Sof Python kodida köp hisob-kitob bajariş kerak bölganda esa alohida jarayonlar bir neça yadroni işga soladi. Misollarda şu ikki holatni soliştiramiz.

::: info Bularni kompyuteringizda işga tuşiring
Kompyuter uçun belgilangan misollarni `.py` faylga saqlab, öz kompyuteringizda bajaring. Brauzer muharriri tizim oqimlari va jarayonlarini işga tuşira olmaydi. Bir neça işçi çiqaradigan xabarlar tartibi va bajariş vaqti özgarişi mumkin.
:::

## Kutiş, hisob-kitob va GIL

Dastur vaqtining katta qismini tarmoq javobi yoki fayl öqilişini kutib ötkazsa, bunday iş **kiritiş-çiqarışga boğliq** (*I/O-bound*) deyiladi. Vaqt asosan tub sonlarni sanaş kabi hisob-kitobga ketsa, iş **protsessorga boğliq** (*CPU-bound*) böladi.

CPythonning odatiy yiğilmasida **GIL** (*Global Interpreter Lock*) bir vaqtda faqat bitta oqimga Python kodini bajarişga ruxsat beradi. `time.sleep()` va köp bloklovçi amallar kutiş davomida GIL ni böşatadi.

- I/O-bound iş uçun oqimlar yordam beradi: kutişlar ustma-ust tuşadi.
- Jarayonlar sof Python kodini bir neça yadroda parallel bajara oladi. Ayrim mahalliy kutubxonalar iş paytida GIL ni böşatadi. Bunday kodda oqimlar ham foyda berişi mumkin.

CPython 3.14 ning GIL siz işlay oladigan ixtiyoriy yiğilmasi (*free-threaded build*) ham bor. Bu darsda odatiy yiğilmani nazarda tutamiz.

![Diagramma: Umumiy yoki alohida xotira?](/images/companions-webp-uzb/thread-process-memory.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

## Oqimlarni işga tuşiriş

`threading.Thread(target=..., args=...)` oqim yaratadi. `start()` uni işga tuşiradi; `join()` u tugaşini kutadi.

```py
import threading
import time


def download(city):
    time.sleep(1)  # tarmoqni kutişni taqlid qilamiz
    print(f"{city} tayyor")


start = time.perf_counter()
threads = [
    threading.Thread(target=download, args=(city,))
    for city in ["Toşkent", "Samarqand", "Buxoro"]
]
for thread in threads:
    thread.start()
for thread in threads:
    thread.join()
print(f"{time.perf_counter() - start:.1f} soniya ketdi")
```

```text
Toşkent tayyor
Samarqand tayyor
Buxoro tayyor
1.0 soniya ketdi
```

Bu işga tuşirişda uçala bir soniyalik kutiş bir paytda ötdi. `args=(name,)` bitta elementli kortej. Sizda oqimlar boşqa tartibda tugaşi mumkin.

## Poyga holatlari va `Lock`

Oqimlar özgaruvçilarni bölişadi. Ikki oqim bir xil qiymatni **öqisa, özgartirsa va yozsa**, biri boşqasining yangilanişini ustidan yozib yuborişi mumkin: bu **poyga holati** (race condition). Törtta oqim balansga 1,000 tadan qöşadi; `time.sleep(0)` öqiş va yoziş orasidagi sekin iş örnida turadi:

```py
import threading
import time

balance = 0


def deposit_many():
    global balance
    for _ in range(1_000):
        current = balance      # öqiş
        time.sleep(0)          # bu yerda boşqa oqim işlab olsin
        balance = current + 1  # yoziş


threads = [threading.Thread(target=deposit_many) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"4000 kutilgandi, {balance} çiqdi")
```

```text
4000 kutilgandi, 1005 çiqdi
```

Natija operatsion tizim oqimlarni qanday navbatlaşiga boğliq. Öqiş, qiymatni yangilaş va yozişni bir amal sifatida himoyalaş uçun törtala oqimga umumiy **`Lock`** bering. Avvalgi `deposit_many` ni şu funksiya bilan almaştiring va butun skriptni qayta bajaring.

```py
lock = threading.Lock()


def deposit_many():
    global balance
    for _ in range(1_000):
        with lock:
            current = balance
            time.sleep(0)
            balance = current + 1
```

```text
4000 kutilgandi, 4000 çiqdi
```

## `queue.Queue` bilan işçilar guruhi

`queue.Queue` elementlarni kelgan tartibida uzatadi va oqimlarning unga murojaatini özi muvofiqlaştiradi. İşçilar `put()` va `get()` ni alohida qulfsiz çaqira oladi. Elementlar navbat bilan olinadi, lekin ularni bajariş tartibi özgarişi mumkin.

```py
import queue
import threading
import time

tasks = queue.Queue()
results = queue.Queue()


def worker():
    while True:
        order = tasks.get()
        if order is None:          # töxtaş signali
            break
        time.sleep(0.1)            # qadoqlaş vaqt oladi
        results.put(f"{order}-buyurtma qadoqlandi")


workers = [threading.Thread(target=worker) for _ in range(3)]
for w in workers:
    w.start()

for order in range(1, 7):
    tasks.put(order)
for _ in workers:
    tasks.put(None)                # har bir işçiga bitta töxtaş signali

for w in workers:
    w.join()

packed = sorted(results.get() for _ in range(results.qsize()))
print("\n".join(packed))
```

```text
1-buyurtma qadoqlandi
2-buyurtma qadoqlandi
3-buyurtma qadoqlandi
4-buyurtma qadoqlandi
5-buyurtma qadoqlandi
6-buyurtma qadoqlandi
```

Uç işçi oltita sinov buyurtmasini taxminan 0.2 soniyada bajaradi. Har bir işçi navbatdan bittadan `None` olganida töxtaydi.

## `ThreadPoolExecutor`

`ThreadPoolExecutor` işçilarni özi boşqaradi. `map()` natijalarni kiriş tartibida beradi. `submit()` har bir çaqiruv uçun **`Future`** qaytaradi. `as_completed()` yordamida natijalarni tayyor bölişi bilan öqiy olamiz.

```py
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

PAGES = {"tashkent.uz": 0.3, "samarkand.uz": 0.1, "bukhara.uz": 0.2}


def download(site):
    time.sleep(PAGES[site])        # tarmoqni kutişni taqlid qilamiz
    return f"{site}: {len(site) * 1000} bayt"


with ThreadPoolExecutor(max_workers=3) as pool:
    print(list(pool.map(download, PAGES)))

    futures = [pool.submit(download, site) for site in PAGES]
    for future in as_completed(futures):
        print("tugadi:", future.result())
```

```text
['tashkent.uz: 11000 bayt', 'samarkand.uz: 12000 bayt', 'bukhara.uz: 10000 bayt']
tugadi: samarkand.uz: 12000 bayt
tugadi: bukhara.uz: 10000 bayt
tugadi: tashkent.uz: 11000 bayt
```

`with` bloki çiqişda barça oqimlarni `join` qiladi. `future.result()` qiymatni qaytaradi yoki oqimdagi istisnoni **qayta çaqiradi**.

## CPU iş uçun `ProcessPoolExecutor`

`ProcessPoolExecutor` ning interfeysi xuddi şunday, lekin har bir işçi alohida Python jarayoni:

```py
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor


def count_primes(limit):
    count = 0
    for n in range(2, limit):
        if all(n % d for d in range(2, int(n**0.5) + 1)):
            count += 1
    return count


if __name__ == "__main__":
    for executor_class in [ThreadPoolExecutor, ProcessPoolExecutor]:
        start = time.perf_counter()
        with executor_class(max_workers=2) as pool:
            results = list(pool.map(count_primes, [600_000, 600_000]))
        seconds = time.perf_counter() - start
        print(f"{executor_class.__name__}: {results}, {seconds:.1f} soniya")

    start = time.perf_counter()
    results = [count_primes(600_000), count_primes(600_000)]
    print(f"oddiy sikl: {results}, {time.perf_counter() - start:.1f} soniya")
```

```text
ThreadPoolExecutor: [49098, 49098], 3.9 soniya
ProcessPoolExecutor: [49098, 49098], 2.1 soniya
oddiy sikl: [49098, 49098], 3.6 soniya
```

Körsatilgan natijada jarayonlar guruhi oldin tugadi. Jarayonlarni işga tuşiriş va ular orasida maʼlumot uzatiş ham vaqt oladi. Şu bois haqiqiy yuklamada jarayonlar guruhini oddiy sikl bilan soliştiring.

Skript bola jarayonda import qilinganda yana işçi guruhi yaratilmasligi uçun guruhni `if __name__ == "__main__":` içida yarating. Bu qoida `spawn` va `forkserver` usullarida muhim. Windows va macOS odatda `spawn` ni tanlaydi. Python 3.14 Linux kabi mos POSIX tizimlarida `forkserver` dan foydalanadi. `count_primes` ni modul darajasida aniqlang, şunda işçi uni import qila oladi.

## Oqimlar, jarayonlar yoki asyncio?

| Iş | Eng yaxşi vosita | Nega |
|---|---|---|
| Tarmoq yoki fayllarni kutiş, bloklaydigan kod | Oqimlar | Kutiş paytida GIL böşatiladi |
| Minglab ulanişlar, async kutubxonalar | asyncio (*Async va await*) | Juda arzon vazifalar |
| Sof Pythonda oğir hisoblaşlar | Jarayonlar | Bir neçta yadro |
| Bir marta, bir neça soniyalik iş | Oddiy sikl | Eng sodda kod |

Dastur yopilayotganda Python fon oqimini (`daemon=True`) birdan töxtatişi mumkin. İşçi işini tugatişi yoki resursni böşatişi şart bölsa, unga töxtaş belgisi yuboring va `join()` bilan kuting. `thread.join(timeout=1)` dan söng oqimning holatini `thread.is_alive()` bilan tekşiring. Natija tayyor bölmasa, `future.result(timeout=2)` `TimeoutError` beradi.

## Özingiz sinab köring

Bu işçi haqiqiy navbat va qulf bilan asosiy oqimda işlaydi. Ikkita buyurtma qöşing, keyin işçini uçta buyurtmadan keyin töxtaydigan qiling.

<ClientOnly><PythonPlayground :code='"import queue\nimport threading\n\norders = queue.Queue()\nfor item, price in [(\"palov\", 35000), (\"somsa\", 8000), (\"lağmon\", 30000)]:\n    orders.put((item, price))\n\ntotal = 0\nlock = threading.Lock()\n\ndef worker():\n    global total\n    while not orders.empty():\n        item, price = orders.get()\n        with lock:\n            total += price\n        print(f\"{threading.current_thread().name}: {item} qadoqlandi\")\n\nworker()\nprint(f\"Jami: {total} söm\")"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Funksiyani uzatiş örniga çaqiriş

```py
import threading


def work():
    print("işlayapti:", threading.current_thread().name)


thread = threading.Thread(target=work())  # Yomon: work() ni hoziroq çaqiradi
thread.start()
thread.join()
```

```text
işlayapti: MainThread
```

`work()` asosiy oqimda işladi va `None` qaytardi, şuning uçun oqimga target berilmadi. **Tuzatiş:** funksiyaning özini uzating: `Thread(target=work)`.

### 2. `join` ni unutiş

```py
import threading
import time

totals = []

def add_order(amount):
    time.sleep(0.1)
    totals.append(amount)

for amount in [15000, 32000, 8000]:
    threading.Thread(target=add_order, args=(amount,)).start()

# Yomon: join yöq, oqimlar hali uxlab turibdi
print(f"Jami: {sum(totals)} söm")
```

```text
Jami: 0 söm
```

**Tuzatiş:** natijalarni öqişdan oldin har bir oqimni `join()` qiling yoki `with` blokida `ThreadPoolExecutor` dan foydalaning.

### 3. CPU-bound iş uçun oqimlar

```py
with ThreadPoolExecutor(max_workers=2) as pool:  # Yomon: CPU iş
    results = list(pool.map(count_primes, [600_000, 600_000]))
```

```text
ThreadPoolExecutor: [49098, 49098], 3.9 soniya
oddiy sikl: [49098, 49098], 3.6 soniya
```

Odatiy CPython bu sof Python hisobini bir neça oqimda parallel bajarmaydi. Jarayonlar guruhini sinang va uni işga tuşirişga ketadigan vaqtni ham hisobga olib, natijalarni soliştiring.

### 4. `__main__` himoyasiz `ProcessPoolExecutor`

```py
from concurrent.futures import ProcessPoolExecutor


def square(n):
    return n * n


with ProcessPoolExecutor() as pool:
    print(list(pool.map(square, [1, 2, 3])))
```

```text
RuntimeError:
        An attempt has been made to start a new process before the
        current process has finished its bootstrapping phase.
concurrent.futures.process.BrokenProcessPool: A process in the process pool was terminated abruptly while the future was running or pending.
```

**Tuzatiş:** pool kodini `if __name__ == "__main__":` ostiga qöying va `square` ni yuqori darajada qoldiring.

## Maşqlar

### 1. Şaharlar navbati <Difficulty level="1" />

`"Toşkent"`, `"Samarqand"` va `"Xiva"` ni `queue.Queue` ga joylang. Uning hajmini çop eting, keyin şaharlarni birma-bir olib, har birini çop eting va oxirida navbat böş yoki yöqligini çop eting.

::: details Yeçim
```python
import queue

cities = queue.Queue()
for city in ["Toşkent", "Samarqand", "Xiva"]:
    cities.put(city)

print("hajmi:", cities.qsize())
while not cities.empty():
    print(cities.get())
print("böşmi:", cities.empty())
```

```text
hajmi: 3
Toşkent
Samarqand
Xiva
böşmi: True
```
:::

### 2. Uçta salomlaşuvçi oqim <Difficulty level="1" />

Kompyuteringizda işga tuşiring: `["Dilnoza", "Aziza", "Jasur"]` dagi har bir ism uçun 0.1 soniya uxlaydigan va umumiy luğatga `"Salom, <ism>!"` ni yozadigan oqim işga tuşiring. `join` dan keyin salomlarni ism böyiça saralab çop eting.

::: details Yeçim
```py
import threading
import time

greetings = {}


def greet(name):
    time.sleep(0.1)
    greetings[name] = f"Salom, {name}!"


threads = [threading.Thread(target=greet, args=(name,))
           for name in ["Dilnoza", "Aziza", "Jasur"]]
for thread in threads:
    thread.start()
for thread in threads:
    thread.join()

for name in sorted(greetings):
    print(greetings[name])
```

```text
Salom, Aziza!
Salom, Dilnoza!
Salom, Jasur!
```
:::

### 3. Oqimlar uçun xavfsiz hisoblagiç klassi <Difficulty level="2" />

`value`, umumiy `Lock` va qiymatni qulf içida yangilaydigan `increment(amount=1)` metodiga ega `SafeCounter` yozing. Metodni asosiy oqimda beş marta çaqirib, natijani va qulf böşatilganini tekşiring. Keyin öz kompyuteringizda bir neça oqim bilan sinang.

::: details Yeçim
```python
import threading

class SafeCounter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()

    def increment(self, amount=1):
        with self.lock:
            self.value += amount

counter = SafeCounter()
for _ in range(5):
    counter.increment(2000)

print("qiymat:", counter.value)
print("qulf böşmi:", not counter.lock.locked())
```

```text
qiymat: 10000
qulf böşmi: True
```
:::

### 4. Parallel yuklab oliş <Difficulty level="2" />

Kompyuteringizda işga tuşiring: quyidagi `FILES` fayl nomlarini yuklab oliş soniyalariga moslaydi. `ThreadPoolExecutor` bilan har bir faylni "yuklab oling" (uxlang, `"<nom>: <soniya * 5000> KB"` ni qaytaring) va natijalarni tugaş tartibida çop eting.

::: details Yeçim
```py
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

FILES = {"report.pdf": 0.3, "photo.jpg": 0.1, "notes.txt": 0.2}


def download(name):
    time.sleep(FILES[name])
    return f"{name}: {int(FILES[name] * 5000)} KB"


with ThreadPoolExecutor(max_workers=3) as pool:
    futures = [pool.submit(download, name) for name in FILES]
    for future in as_completed(futures):
        print(future.result())
```

```text
photo.jpg: 500 KB
notes.txt: 1000 KB
report.pdf: 1500 KB
```
:::

### 5. Futurelarni qölda yaratiş <Difficulty level="3" />

`concurrent.futures.Future` qaytaradigan `fake_download(site)` ni yozing: `.uz` bilan tugaydigan saytlar uçun natija sifatida `f"{site}: OK"` ni, boşqalari uçun istisno sifatida `ValueError(f"nomaʼlum sayt {site}")` ni örnating. Keyin `["kun.uz", "example.com", "gazeta.uz"]` böylab aylanib, har birining natijasini yoki xatosini çop eting.

::: details Yeçim
```python
from concurrent.futures import Future

def fake_download(site):
    future = Future()
    if site.endswith(".uz"):
        future.set_result(f"{site}: OK")
    else:
        future.set_exception(ValueError(f"nomaʼlum sayt {site}"))
    return future

for site in ["kun.uz", "example.com", "gazeta.uz"]:
    future = fake_download(site)
    try:
        print(future.result())
    except ValueError as error:
        print("xato:", error)
```

```text
kun.uz: OK
xato: nomaʼlum sayt example.com
gazeta.uz: OK
```

Executor bu çaqiruvlarni siz uçun bajaradi.
:::

## Xulosa

- Oqimlar bloklovçi amallarning kutiş vaqtlarini ustma-ust olib bora oladi. Odatiy CPythonning GIL qulfi sof Python kodining oqimlarda parallel bajarilişini çegaralaydi.
- `Thread(target=func, args=(...))`, keyin `start()` va `join()`.
- Umumiy qiymatni yangilaşda qulfdan foydalaning. `queue.Queue` öz amallarini özi muvofiqlaştiradi.
- `pool.map` kiriş tartibini saqlaydi; `as_completed` futurelarni tugaş tartibida beradi.
- Jarayonlar guruhi bir neça yadroni işlatişi mumkin. Guruhni skriptning `if __name__ == "__main__":` bloki içida yarating.
- Köp ulanişlar uçun asyncio, bloklaydigan I/O uçun oqimlar, hisoblaş uçun jarayonlar.

## Qöşimça manbalar

- [threading: Oqimlarga asoslangan parallellik](https://docs.python.org/3/library/threading.html)
- [concurrent.futures: Parallel vazifalarni işga tuşiriş](https://docs.python.org/3/library/concurrent.futures.html)
- [queue: Sinxronlangan navbat klassi](https://docs.python.org/3/library/queue.html)
- [Pythonda free threading qöllab-quvvatlaşi](https://docs.python.org/3/howto/free-threading-python.html)
