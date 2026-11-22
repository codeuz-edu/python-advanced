---
title: Async va await
description: "Asinxron Python dasturida korutinalar, vazifalar, vaqt çegarasi va navbatlardan foydalanamiz."
---

# Async va await

![Rasm: Async va await](/images/topics-webp-uzb/async-await.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- **Korutina** (coroutine) nima va dastur kutayotganda `await` nima qiladi
- `asyncio.gather`, `create_task` va `TaskGroup` yordamida bir neça korutinani navbatlab bajariş
- `asyncio.timeout` bilan kutiş vaqtini çegaralaş
- `asyncio.Queue` orqali bir vazifadan ikkinçisiga iş uzatiş
- Async qaçon yordam beradi (I/O ni kutiş) va qaçon yordam bermaydi (oğir hisob-kitoblar)
:::

## Nega bu muhim

Valyuta ilovasi önta ayirboşlaş şoxobçasidan dollar kursini sörasin. Har bir javob uçun bir soniya kutamiz, deb olaylik. Sörovlarni ketma-ket yuborsak, bunga taxminan ön soniya ketadi. Sörovlarni birga yuborsak, javoblarni parallel ravishda kutamiz va iş taxminan bir soniyada tugaydi.

## Korutinalar va `await`

Oddiy `async def` funksiyasini çaqirsak, **korutina** obyekti yaratiladi. Funksiya tanasi korutinani `await` bilan kutganimizda yoki vazifa sifatida rejalaştirganimizda bajariladi. Kutilayotgan amal hali tugamagan bölsa, vazifa vaqtinça töxtaydi va hodisalar sikli boşqa işni davom ettira oladi. Amal allaqaçon tayyor bölsa, natija darhol qaytadi.

`asyncio.sleep` sekin tarmoq sörovi örnida işlatiladi:

```python
import asyncio
import time

async def fetch_price(city, delay):
    await asyncio.sleep(delay)          # serverni kutayotgandek qilamiz
    return f"{city}: 12,650 söm"

async def main():
    start = time.perf_counter()
    for city, delay in [("Toşkent", 0.1), ("Samarqand", 0.2), ("Buxoro", 0.3)]:
        print(await fetch_price(city, delay))
    print(f"{time.perf_counter() - start:.1f} s ketdi")

await main()
```

```text
Toşkent: 12,650 söm
Samarqand: 12,650 söm
Buxoro: 12,650 söm
0.6 s ketdi
```

**Hodisalar sikli** (*event loop*) vazifalarni rejalaştiradi va tayyor bölganlarini bajaradi. Bitta vazifa kutişga ötsa, sikl boşqasini davom ettira oladi.

::: info Skriptlar va bu sahifa
Bu saytdagi muharrir va ayrim interaktiv muhitlarda `await main()` ni funksiya taşqarisida yoziş mumkin. Oddiy `.py` faylda hodisalar siklini `asyncio.run(main())` bilan işga tuşiring. Muhitingizga mos bittasini tanlang.

```py
import asyncio

async def main():
    print("Salom!")

if __name__ == "__main__":
    asyncio.run(main())
```
:::

## `gather` bilan bir vaqtda işga tuşiriş

Birinçi misolda har bir sörovdan keyin uning javobini kutdik. `asyncio.gather` esa korutinalarni birga rejalaştiradi. Hammasi muvaffaqiyatli tugasa, natijalar **uzatilgan tartibda** qaytadi. Odatiy sozlamada birinçi istisno çaqiruvçiga uzatiladi, qolgan vazifalar esa davom etişi mumkin.

```python
import asyncio
import time

async def fetch_price(city, delay):
    await asyncio.sleep(delay)
    print(f"  {city} javob berdi")
    return f"{city}: 12,650 söm"

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        fetch_price("Buxoro", 0.3),
        fetch_price("Toşkent", 0.1),
        fetch_price("Samarqand", 0.2),
    )
    print(results)
    print(f"{time.perf_counter() - start:.1f} s ketdi")

await main()
```

```text
  Toşkent javob berdi
  Samarqand javob berdi
  Buxoro javob berdi
['Buxoro: 12,650 söm', 'Toşkent: 12,650 söm', 'Samarqand: 12,650 söm']
0.3 s ketdi
```

Bu misoldagi kutişlar bir-biriga ustma-ust tuşadi. Jami vaqt taxminan eng uzun kutişga, yaʼni 0.3 soniyaga teng. Hodisalar sikli bitta oqimda işlaydi.

## Vazifalar va hodisalar sikli

`asyncio.create_task(coro)` korutinani **vazifa** (*task*) sifatida rejalaştiradi. Odatiy tartibda sikl uni joriy vazifa boşqaruvni qaytarganidan söng bajaradi. Natijani oliş uçun vazifani `await` bilan kutamiz.

![Diagramma: Vazifalar va hodisalar sikli](/images/companions-webp-uzb/async-task-timeline.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```python
import asyncio

async def cook(dish, minutes):
    print(f"{dish} boşlandi")
    await asyncio.sleep(minutes / 100)
    print(f"{dish} tayyor")
    return dish

async def main():
    plov = asyncio.create_task(cook("palov", 20))
    samsa = asyncio.create_task(cook("somsa", 10))
    print("vazifalar yaratildi")
    await asyncio.sleep(0)            # vazifalar boşlanişi uçun bir marta pauza
    print("dasturxon tuzalmoqda")
    print("tortildi:", await plov, await samsa)

await main()
```

```text
vazifalar yaratildi
palov boşlandi
somsa boşlandi
dasturxon tuzalmoqda
somsa tayyor
palov tayyor
tortildi: palov somsa
```

Bu misolda `await asyncio.sleep(0)` boşqaruvni hodisalar sikliga qaytaradi. Allaqaçon tugagan vazifani kutsak, natija darhol qaytişi mumkin. Python 3.14 da vazifani darhol boşlaşni ham alohida tanlaş mumkin.

### `TaskGroup`

`asyncio.TaskGroup` `async with` blokidan çiqişda öz vazifalarining tugaşini kutadi. Biror vazifada `CancelledError` dan boşqa istisno yuz bersa, guruh qolgan vazifalarni bekor qiladi va xatoni uzatişdan oldin ularning tugaşini kutadi.

```python
import asyncio

async def fetch_rate(office, delay):
    await asyncio.sleep(delay)
    if office == "Çorsu":
        raise ConnectionError(f"{office} tarmoqda emas")
    return 12_650

async def main():
    async with asyncio.TaskGroup() as tg:
        a = tg.create_task(fetch_rate("Amir Temur", 0.1))
    print("kurs:", a.result())

    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(fetch_rate("Çorsu", 0.1))
            tg.create_task(fetch_rate("Yunusobod", 0.5))
    except* ConnectionError as group:
        print("xato:", group.exceptions[0])

await main()
```

```text
kurs: 12650
xato: Çorsu tarmoqda emas
```

Guruh xatolarni birga uzatadi. `except* ConnectionError` istisnolar guruhidagi mos xatolarni tutadi. Bu misolda Çorsu sörovida xato yuz beradi va hali tugamagan Yunusobod sörovi bekor qilinadi.

## Kutiş vaqtini çegaralaş

`asyncio.timeout(seconds)` joriy vazifaga vaqt çegarasi qöyadi. Vaqt tugasa, vazifa bekor qilinadi va blokdan çiqişda bu bekor qiliş `TimeoutError` ga aylantiriladi. `TimeoutError` ni `async with` blokining taşqarisida tuting.

```python
import asyncio

async def fetch_price(city, delay):
    await asyncio.sleep(delay)
    return f"{city}: 12,650 söm"

async def main():
    for city, delay in [("Toşkent", 0.05), ("Nukus", 1.0)]:
        try:
            async with asyncio.timeout(0.2):
                print(await fetch_price(city, delay))
        except TimeoutError:
            print(f"{city}: vaqtida javob bermadi")

await main()
```

```text
Toşkent: 12,650 söm
Nukus: vaqtida javob bermadi
```

## Navbat orqali iş uzatiş

**Iş yuboruvçi** vazifa elementlarni `asyncio.Queue` ga qöyadi. **Işni bajaruvçi** vazifa elementni `await queue.get()` bilan oladi. Navbat böş bölsa, u kutadi. Har bir olingan element uçun `task_done()` bir marta çaqiriladi. `await queue.join()` navbatga qöyilgan amallar tugadi deb belgilangunça kutadi.

```python
import asyncio

async def producer(queue):
    for order in ["palov", "somsa", "lağmon", "manti"]:
        await queue.put(order)
        print(f"{order} buyurtma qilindi")

async def cook(name, seconds, queue):
    while True:
        order = await queue.get()
        if order is None:
            queue.task_done()
            return
        await asyncio.sleep(seconds)
        print(f"{name} {order} tayyorladi")
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
palov buyurtma qilindi
somsa buyurtma qilindi
lağmon buyurtma qilindi
manti buyurtma qilindi
Aziza palov tayyorladi
Aziza lağmon tayyorladi
Bobur somsa tayyorladi
Aziza manti tayyorladi
```

Bu işga tuşirişda Aziza uçta buyurtmani oldi. Vaqtlar özgarsa, taqsimot ham özgarişi mumkin. Navbatdagi işlar tugagaç, `main` har bir işçiga töxtaş belgisini yuboradi va ularning tugaşini kutadi.

## `async for` va `async with`

Içida `yield` bor `async def` funksiya - **async generator**; u böylab `async for message in chat.messages():` bilan aylanasiz va sikl elementlar orasida pauza qilişi mumkin. *Kontekst menejerlarini çuqurroq örganiş* darsidagi asinxron kontekst menejerlariga, masalan `TaskGroup` yoki maʼlumotlar bazasiga ulanişga, `async with` bilan kiriladi, çunki ulaniş ham, uziliş ham kutişni talab qilişi mumkin.

## Async qaçon yordam beradi

Asinxron kod köp ulanişli server kabi, vaqti asosan kiritiş-çiqarış amallarini kutişga ketadigan dasturlarda foydali. Uzoq hisob-kitob yoki `time.sleep()` kabi sinxron çaqiruv tugagunça hodisalar siklining oqimi band böladi. Asinxron HTTP sörovlari uçun `aiohttp` yoki `httpx` dan foydalaning. Oğir hisob-kitoblar uçun *Oqimlar va jarayonlar* darsiga qarang.

## Özingiz sinab köring

Vaqt çegarasi misoliga uçinçi şaharni qöşing. Kutiş vaqtini tanlang va sörov vaqtida tugaşini oldindan taxmin qiling.

<ClientOnly><PythonPlayground :code='"import asyncio\n\nasync def fetch_price(city, delay):\n    await asyncio.sleep(delay)\n    return f\"{city}: 12,650 söm\"\n\nasync def safe_fetch(city, delay):\n    try:\n        async with asyncio.timeout(0.3):\n            return await fetch_price(city, delay)\n    except TimeoutError:\n        return f\"{city}: vaqt tugadi\"\n\nasync def main():\n    results = await asyncio.gather(\n        safe_fetch(\"Toşkent\", 0.1),\n        safe_fetch(\"Samarqand\", 0.2),\n        safe_fetch(\"Nukus\", 0.8),\n    )\n    for line in results:\n        print(line)\n\nawait main()"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. `await` ni unutiş

```py
import asyncio

async def fetch_price(city):
    await asyncio.sleep(0.1)
    print(f"{city} narxi yuklandi")

async def main():
    fetch_price("Toşkent")        # Yomon: await yöq
    print("tayyor")

asyncio.run(main())
```

```text
RuntimeWarning: coroutine 'fetch_price' was never awaited
tayyor
```

Çaqiriş faqat korutina obyektini yaratdi; tana heç qaçon bajarilmadi. **Tuzatiş:** `await fetch_price("Toşkent")`.

### 2. Korutina içida `time.sleep`

```python
import asyncio
import time

async def fetch_price(city):
    time.sleep(0.1)                # Yomon: butun event loopni bloklaydi
    return city

async def main():
    start = time.perf_counter()
    await asyncio.gather(fetch_price("Toşkent"), fetch_price("Samarqand"), fetch_price("Buxoro"))
    print(f"{time.perf_counter() - start:.1f} s ketdi")

await main()
```

```text
0.3 s ketdi
```

`time.sleep` boşqaruvni loopga heç qaçon qaytarmaydi, şuning uçun uçta çaqiriş birin-ketin bajarildi. **Tuzatiş:** `await asyncio.sleep(0.1)`, bunda hammasi jami 0.1 s oladi.

### 3. Işlab turgan loop içida `asyncio.run()` ni çaqiriş

```py
import asyncio

async def main():
    print("Salom")

asyncio.run(main())    # şu muharrirda yoki Jupyter da
```

```text
RuntimeError: asyncio.run() cannot be called from a running event loop
```

Şu oqimda hodisalar sikli işlab turgan bölsa, `asyncio.run()` ni çaqirib bölmaydi. Bu muharrirda `await main()` yozing. Oddiy skriptni esa `asyncio.run(main())` bilan boşlang.

### 4. Vazifa yaratib, uni unutiş

```py
import asyncio

async def send_receipt(name):
    await asyncio.sleep(0.1)
    print(f"{name} ga chek yuborildi")

async def main():
    asyncio.create_task(send_receipt("Dilnoza"))   # Yomon: havola yöq, heç qaçon kutilmaydi
    print("buyurtma saqlandi")

asyncio.run(main())
```

```text
buyurtma saqlandi
```

Çek heç qaçon yuborilmadi: `main` qaytganda `asyncio.run()` tugamagan vazifalarni bekor qiladi, heç kim havola qilmagan vazifani esa çiqindi yiğuvçi (garbage collector) iş örtasida yiğib olişi ham mumkin. **Tuzatiş:** vazifani özgaruvçida saqlang va uni `await` qiling yoki `TaskGroup` içida yarating.

## Maşqlar

### 1. Bir vaqtdagi yuklab olişlar <Difficulty level="1" />

`size / 1000` soniya kutadigan, `NOMI yuklandi` deb çop etadigan va `size` ni qaytaradigan `download(name, size)` ni yozing. `lesson.mp4` (300), `notes.pdf` (50) va `photo.jpg` (120) yuklab olişlarini `gather` qiling, keyin jamini çop eting.

::: details Yeçim
```python
import asyncio

async def download(name, size):
    await asyncio.sleep(size / 1000)
    print(f"{name} yuklandi")
    return size

async def main():
    sizes = await asyncio.gather(
        download("lesson.mp4", 300),
        download("notes.pdf", 50),
        download("photo.jpg", 120),
    )
    print(f"jami: {sum(sizes)} MB")

await main()
```

```text
notes.pdf yuklandi
photo.jpg yuklandi
lesson.mp4 yuklandi
jami: 470 MB
```
:::

### 2. Timeout örami <Difficulty level="1" />

Korutina natijasini yoki `seconds` ötgaç `default` ni qaytaradigan `with_timeout(coro, seconds, default)` ni yozing. Uni 0.2 s çegara bilan `asyncio.sleep(0.05, result="kurs: 12650")` da, keyin 1 soniya kutadigan xuddi şunday korutinada sinang.

::: details Yeçim
```python
import asyncio

async def with_timeout(coro, seconds, default):
    try:
        async with asyncio.timeout(seconds):
            return await coro
    except TimeoutError:
        return default

async def main():
    print(await with_timeout(asyncio.sleep(0.05, result="kurs: 12650"), 0.2, "javob yöq"))
    print(await with_timeout(asyncio.sleep(1, result="kurs: 12650"), 0.2, "javob yöq"))

await main()
```

```text
kurs: 12650
javob yöq
```
:::

### 3. Imtihon varaqalari navbati <Difficulty level="2" />

Işlab çiqaruvçi `asyncio.Queue` ga `Aziza`, `Bobur`, `Dilnoza`, `Jasur` ni, keyin töxtaş signali sifatida `None` ni qöyadi. Isteʼmolçi `None` ni olgunça har bir varaq uçun `NOMI tekşirildi` deb çop etadi va sonini qaytaradi. Uni çop eting.

::: details Yeçim
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
        print(f"{name} tekşirildi")
        count += 1

async def main():
    queue = asyncio.Queue()
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(queue))
        result = tg.create_task(checker(queue))
    print("tekşirilgan varaqalar:", result.result())

await main()
```

```text
Aziza tekşirildi
Bobur tekşirildi
Dilnoza tekşirildi
Jasur tekşirildi
tekşirilgan varaqalar: 4
```
:::

### 4. Bir vaqtda köpi bilan ikkitasi <Difficulty level="2" />

`[("palov", 0.4), ("somsa", 0.1), ("lağmon", 0.2), ("manti", 0.2)]` buyurtmalarini `gather` bilan bajaring, lekin `asyncio.Semaphore(2)` yordamida bir vaqtda köpi bilan ikkitasi bajarilsin. `NOMI boşlandi`, `NOMI tayyor` va qaytarilgan nomlarni çop eting.

::: details Yeçim
```python
import asyncio

async def prepare(name, seconds, limit):
    async with limit:
        print(f"{name} boşlandi")
        await asyncio.sleep(seconds)
        print(f"{name} tayyor")
        return name

async def main():
    limit = asyncio.Semaphore(2)
    orders = [("palov", 0.4), ("somsa", 0.1), ("lağmon", 0.2), ("manti", 0.2)]
    names = await asyncio.gather(*(prepare(n, s, limit) for n, s in orders))
    print(names)

await main()
```

```text
palov boşlandi
somsa boşlandi
somsa tayyor
lağmon boşlandi
lağmon tayyor
manti boşlandi
palov tayyor
manti tayyor
['palov', 'somsa', 'lağmon', 'manti']
```

Uçinçi buyurtma işlayotganlardan biri semaforni böşatgunça `async with limit` da kutadi.
:::

### 5. Oraliqni oşirib qayta uriniş <Difficulty level="3" />

Işonçsiz `fetch_rate()` ikki marta `ConnectionError` çaqiradi, keyin `12650` qaytaradi. `retry(func, attempts, delay)` ni yozing: `ConnectionError` da `N-uriniş muvaffaqiyatsiz, D s kutamiz` deb çop etsin, kutsin va `delay` ni ikki barobar oşirsin; oxirgi urinişdan keyin xatoni qayta çaqirsin. `delay=0.01` dan boşlab 4 va 2 urinişni sinang va `kurs: 12650` yoki `voz keçildi: XABAR` ni çop eting.

::: details Yeçim
```python
import asyncio

def make_flaky(failures):
    calls = 0
    async def fetch_rate():
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.01)
        if calls <= failures:
            raise ConnectionError("server band")
        return 12650
    return fetch_rate

async def retry(func, attempts, delay):
    for attempt in range(1, attempts + 1):
        try:
            return await func()
        except ConnectionError:
            if attempt == attempts:
                raise
            print(f"{attempt}-uriniş muvaffaqiyatsiz, {delay} s kutamiz")
            await asyncio.sleep(delay)
            delay *= 2

async def main():
    print("kurs:", await retry(make_flaky(2), attempts=4, delay=0.01))
    try:
        await retry(make_flaky(2), attempts=2, delay=0.01)
    except ConnectionError as e:
        print("voz keçildi:", e)

await main()
```

```text
1-uriniş muvaffaqiyatsiz, 0.01 s kutamiz
2-uriniş muvaffaqiyatsiz, 0.02 s kutamiz
kurs: 12650
1-uriniş muvaffaqiyatsiz, 0.01 s kutamiz
voz keçildi: server band
```

`make_flaky` qaytargan `fetch_rate` funksiyasi closure hisoblanadi. `make_flaky` har safar çaqirilganda alohida hisoblagiç yaratiladi.
:::

## Xulosa

- Oddiy `async def` funksiyasini çaqiriş korutina yaratadi. Uni bajariş uçun `await` bilan kuting yoki vazifa sifatida rejalaştiring.
- Vazifa kuta boşlaganda hodisalar sikli boşqa işni bajara oladi. Bloklovçi çaqiruvlar va uzoq hisob-kitoblarni sikl oqimidan ayri bajaring.
- `gather`, `create_task` va `TaskGroup` bir neça vazifaning bir paytda kutişiga imkon beradi. Birida xato yuz bersa, vazifalar guruhi qolganlarini ham boşqaradi.
- Vaqt çegarasidan kelgan `TimeoutError` ni blokdan taşqarida tuting. Vazifalar orasida iş uzatiş uçun navbatdan foydalaning.
- Skriptlar `asyncio.run(main())` ni çaqiradi; bu sahifa va notebooklar `await main()` ni işlatadi.
- Async kutişda (I/O) yordam beradi, protsessorni yuklaydigan işda emas.

## Qöşimça manbalar

- [`asyncio`: Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html)
- [`asyncio`: Queues](https://docs.python.org/3/library/asyncio-queue.html)
- [`asyncio` HOWTO: A conceptual overview](https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html)
