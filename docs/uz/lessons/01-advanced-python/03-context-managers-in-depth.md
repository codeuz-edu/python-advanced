---
title: Kontekst menejerlarini çuqurroq örganiş
description: "Kontekst menejerini yoziş, istisnolarni __exit__ da qayta işlaş va ExitStack yordamida resurslarni tartib bilan yopiş."
---

# Kontekst menejerlarini çuqurroq örganiş

![Rasm: Kontekst menejerlari](/images/topics-webp-uzb/context-managers-in-depth.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- Aniq **kontekst menejeri protokoli** (context manager protocol): `__enter__` nima qaytaradi va `__exit__(exc_type, exc, tb)` nima qabul qiladi
- `__exit__` qaytargan qiymat istisnoning taşqariga uzatilişiga qanday taʼsir qilişi
- `contextlib.ExitStack` özgaruvçan sondagi resurslarni va tozalaş callbacklarini qanday boşqaradi
- `closing`, `redirect_stdout` va `nullcontext` qaçon kerak böladi
- `@contextmanager` yaratgan obyektni nega bir marta işlatib bölişi
:::

## Nega bu muhim

*with operatori* darsida faylni avtomatik yopiş uçun `with open(...)` dan foydalangan edik. Blokda istisno yuz bersa ham, sozlamani tiklaş yoki qulfni böşatiş kerak bölgan hollar bor. Bu darsda şol amallarning tayyorgarlik va yakun qismlarini qayerga yozişni köramiz.

## Protokol qadamma-qadam

`with EXPR as name:` tört iş bajaradi:

1. Menejerni oliş uçun `EXPR` ni hisoblaydi.
2. `__enter__()` ni çaqiradi va **uning qaytargan qiymatini** `name` ga boğlaydi.
3. Blokni bajaradi.
4. `__enter__` muvaffaqiyatli tugaganidan keyin blokdan çiqayotganda `__exit__(exc_type, exc, tb)` ni çaqiradi. Blokda istisno yuz bersa, uning turi, obyekti va izi uzatiladi. Boşqa hollarda uçta `None` uzatiladi.

Mana klass körinişidagi `Timer`:

```python
import time

class Timer:
    def __init__(self, label):
        self.label = label
        self.elapsed = None

    def __enter__(self):
        self.start = time.perf_counter()
        return self                      # pastdagi `t` aynan şu böladi

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        print(f"{self.label}: {self.elapsed:.1f} s, xato: {exc_type}")

with Timer("narxlarni yuklaş") as t:
    time.sleep(0.1)

print("Obyektda saqlandi:", round(t.elapsed, 1))
```

```text
narxlarni yuklaş: 0.1 s, xato: None
Obyektda saqlandi: 0.1
```

`self` ni qaytariş odatiy tanlov, lekin `__enter__` istalgan narsani qaytarişi mumkin, masalan quyidagi `Transaction` dagi luğatni.

## `__exit__` istisnolarni qanday qayta işlaydi

Blokda istisno yuz bersa, `__exit__` dan qaytgan rost qiymat uni bostiradi. Yolğon deb baholanadigan qiymat, jumladan `None` yoki `False`, istisnoning taşqariga uzatilişiga yöl qöyadi. Blok odatdagidek tugasa, Python bu qiymatga qaramaydi.

Bu misolda `Transaction` hisoblarning nusxasi bilan işlaydi. Blok xatosiz tugasa, butun nusxa saqlanadi. Xato yuz bersa, özgarişlar bekor qilinadi. Menejer `ValueError` va undan meros olgan istisnolarni bostiradi. Har bir tranzaksiya uçun yangi menejer yarating.

![Diagramma: Kontekst menejeri hayot sikli](/images/companions-webp-uzb/context-manager-lifecycle.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```python
class Transaction:
    def __init__(self, accounts):
        self.accounts = accounts

    def __enter__(self):
        self.draft = dict(self.accounts)
        return self.draft

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.accounts.clear()
            self.accounts.update(self.draft)
            print("saqlandi")
            return False
        print(f"bekor qilindi: {exc}")
        return issubclass(exc_type, ValueError)   # True uni yutadi

accounts = {"Aziza": 500_000, "Bobur": 100_000}

with Transaction(accounts) as draft:
    draft["Aziza"] -= 200_000
    draft["Bobur"] += 200_000
print(accounts)

with Transaction(accounts) as draft:
    draft["Bobur"] -= 900_000
    if draft["Bobur"] < 0:
        raise ValueError("pul yetarli emas")
print(accounts)

try:
    with Transaction(accounts) as draft:
        draft["Dilnoza"] += 1
except KeyError as e:
    print("baribir çaqirildi:", repr(e))
```

```text
saqlandi
{'Aziza': 300000, 'Bobur': 300000}
bekor qilindi: pul yetarli emas
{'Aziza': 300000, 'Bobur': 300000}
bekor qilindi: 'Dilnoza'
baribir çaqirildi: KeyError('Dilnoza')
```

Rad etilgan ötkazma `ValueError` berdi va menejer uni bostirdi. Yöq hisobga murojaat qilinganda esa `KeyError` yuz berdi. Uni taşqi `except` tutdi.

### `__enter__` istisno çaqirganda

`__enter__` istisno çaqirsa, blok umuman bajarilmaydi va **`__exit__` çaqirilmaydi**. Çala qolgan tayyorlaş uçun tozalaş `__enter__` ning özida bajarilişi kerak:

```python
import os

class ChangeDirectory:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.old = os.getcwd()
        os.chdir(self.path)              # xato berişi mumkin
        return self.path

    def __exit__(self, exc_type, exc, tb):
        os.chdir(self.old)
        print("eski papkaga qaytdik")

os.makedirs("reports", exist_ok=True)
with ChangeDirectory("reports"):
    print("içida:", os.path.basename(os.getcwd()))

try:
    with ChangeDirectory("no_such_folder"):
        print("heç qaçon çop etilmaydi")
except FileNotFoundError:
    print("__enter__ muvaffaqiyatsiz, __exit__ ötkazib yuborildi")
```

```text
içida: reports
eski papkaga qaytdik
__enter__ muvaffaqiyatsiz, __exit__ ötkazib yuborildi
```

## `ExitStack`: istalgan miqdordagi resurslar

Resurslar soni dastur işlayotganda aniqlansa, `contextlib.ExitStack` dan foydalaning. `with ExitStack()` bloki içida har bir resurs uçun `enter_context(cm)` ni çaqiramiz. Keyingi resursni oçişda xato yuz bersa ham, stek oldin oçilganlarini teskari tartibda yopadi. Istisno haqida maʼlumot olmaydigan yakunlovçi funksiyani `callback(func, *args)` bilan röyxatga kiriting.

```python
from contextlib import ExitStack

cities = ["toşkent", "samarqand", "buxoro"]

with ExitStack() as stack:
    files = [stack.enter_context(open(f"{c}.txt", "w", encoding="utf-8")) for c in cities]
    stack.callback(print, "barça fayllar yopildi")
    for city, f in zip(cities, files):
        f.write(f"{city.title()} hisoboti\n")
    print("oçiq fayllar:", len(files))

print("yopildimi:", all(f.closed for f in files))
```

```text
oçiq fayllar: 3
barça fayllar yopildi
yopildimi: True
```

Callback birinçi bölib bajarildi, çunki u oxirgi bölib röyxatdan ötkazilgan.

## `contextlib` dagi qulay menejerlar

`suppress` ni allaqaçon bilasiz. Yana uçtasi:

- `closing(obj)` oxirida `obj.close()` ni çaqiradi; `close()` metodi bor, lekin `with` ni qöllamaydigan obyektlar uçun.
- `redirect_stdout(target)` `print` natijasini boşqa joyga, masalan `io.StringIO` ga yönaltiradi.
- `nullcontext(value)` kirishda `value` ni qaytaradi va çiqişda resursga tegmaydi. U sizda tayyor resurs bor bölgan holatda yordam beradi.

```python
import io
from contextlib import closing, nullcontext, redirect_stdout

class Connection:
    def close(self):
        print("ulaniş yopildi")

with closing(Connection()):
    print("maʼlumot yuborilmoqda")

buffer = io.StringIO()
with redirect_stdout(buffer):
    print("Somsa: 8,000 söm")
print("uşlandi:", buffer.getvalue().strip())

def report(lock=None):
    with lock if lock is not None else nullcontext():
        print("hisobot yozildi")

report()
```

```text
maʼlumot yuborilmoqda
ulaniş yopildi
uşlandi: Somsa: 8,000 söm
hisobot yozildi
```

## Bir martalik, qayta işlatiladigan va içma-iç qöllanadigan menejerlar

**Qayta işlatiladigan** menejer bilan bir neça `with` blokini ketma-ket bajariş mumkin. **Içma-iç qöllanadigan** (*reentrant*) menejer bilan esa bir obyektni bir-birining içidagi bloklarda ham işlatsa böladi. `redirect_stdout` bunga misol. `@contextmanager` yaratgan menejer bitta generatorga boğlangan va bir martalik.

```py
from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")

bold = tag("b")
with bold:
    print("Palov")
with bold:          # aynan şu obyektdan ikkinçi marta foydalaniş
    print("Lağmon")
```

```text
AttributeError: '_GeneratorContextManager' object has no attribute 'args'
```

Har bir `with` uçun `tag("b")` ni yangidan çaqiring. Generator birinçi `yield` ga yetmasdan odatdagidek tugasa, `RuntimeError: generator didn't yield` yuz beradi. Muvaffaqiyatli kirgan generator bitta qiymat beradi va blokdan çiqayotganda tugaydi.

## `async with`

Tarmoqni kutadigan kod `__aenter__` va `__aexit__` metodlari bor **asinxron** menejerlardan foydalanadi, ularga `async with` bilan kiriladi. `contextlib.asynccontextmanager` xuddi `@contextmanager` kabi `async def` generatoridan şunday menejer yasaydi. Ular bilan *Async va await* darsida tanişasiz.

## Dizayn vositasi sifatida kontekst menejerlari

Kontekst menejeri vaqtinça özgartirilgan sozlamani tiklaydi yoki blok tugaganda qulfni böşatadi. `threading.Lock` bilan `with lock:` yozuvi kirishda qulfni oladi va çiqişda uni böşatadi. Qulflarni *Oqimlar va jarayonlar* darsida batafsil köramiz.

```python
from contextlib import contextmanager

settings = {"currency": "söm", "debug": False}

@contextmanager
def temporary_setting(key, value):
    old = settings[key]
    settings[key] = value
    try:
        yield
    finally:
        settings[key] = old

with temporary_setting("debug", True):
    print("içida:", settings["debug"])
print("keyin:", settings["debug"])
```

```text
içida: True
keyin: False
```

## Özingiz sinab köring

Tranzaksiya `KeyError` ni ham yutadigan qiling yoki saqlaşdan oldin xato çaqirib, balanslarni kuzating.

<ClientOnly><PythonPlayground :code='"class Transaction:\n    def __init__(self, accounts):\n        self.accounts = accounts\n\n    def __enter__(self):\n        self.draft = dict(self.accounts)\n        return self.draft\n\n    def __exit__(self, exc_type, exc, tb):\n        if exc_type is None:\n            self.accounts.clear()\n            self.accounts.update(self.draft)\n            print(\"saqlandi\")\n            return False\n        print(\"bekor qilindi:\", exc)\n        return issubclass(exc_type, ValueError)\n\naccounts = {\"Jasur\": 250000, \"Dilnoza\": 80000}\n\nwith Transaction(accounts) as draft:\n    draft[\"Jasur\"] -= 50000\n    draft[\"Dilnoza\"] += 50000\nprint(accounts)\n\nwith Transaction(accounts) as draft:\n    draft[\"Dilnoza\"] -= 500000\n    if draft[\"Dilnoza\"] < 0:\n        raise ValueError(\"pul yetarli emas\")\nprint(accounts)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. `__enter__` dan `self` ni qaytarişni unutiş

```py
class Timer:
    def __enter__(self):
        self.start = 0          # return yöq, şuning uçun None qaytaradi

    def __exit__(self, exc_type, exc, tb):
        pass

with Timer() as t:
    print(t.start)
```

```text
AttributeError: 'NoneType' object has no attribute 'start'
```

**Tuzatiş:** `__enter__` ni `return self` bilan (yoki blok işlatişi kerak bölgan boşqa obyekt bilan) tugating.

### 2. Tasodifan `True` qaytaradigan `__exit__`

```python
class Quiet:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        print("tozalanmoqda")
        return True               # Yomon: barça xatolarni yaşiradi

with Quiet():
    total = 150_000 / 0
print("hammasi joyida körinadi, lekin jami heç qaçon hisoblanmadi")
```

```text
tozalanmoqda
hammasi joyida körinadi, lekin jami heç qaçon hisoblanmadi
```

**Tuzatiş:** `exc_type` ni tekşirib, bitta aniq istisnoni ataylab yutmasangiz, `__exit__` dan heç narsa qaytarmang.

### 3. Istisno çaqiradigan tozalaş kodi

```py
class Upload:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.connection.close()   # self.connection mavjud emas

with Upload():
    raise ValueError("fayl juda katta")
```

```text
Traceback (most recent call last):
ValueError: fayl juda katta

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
AttributeError: 'Upload' object has no attribute 'connection'
```

Yakunlovçi kodda yangi istisno yuz bersa, taşqariga oşa istisno çiqadi. Avvalgi `ValueError` uning kontekstida saqlanadi. Yakunlovçi kodni ixcham tuting va tuzatiş mumkin bölgan xatolarni oşa yerda qayta işlang.

### 4. `try`/`finally` siz `@contextmanager`

```python
from contextlib import contextmanager

settings = {"debug": False}

@contextmanager
def debug_on():
    settings["debug"] = True
    yield                         # Yomon: try/finally yöq
    settings["debug"] = False

try:
    with debug_on():
        raise ValueError("notöğri kiritiş")
except ValueError:
    pass
print("debug:", settings["debug"])
```

```text
debug: True
```

Xato `yield` da çaqiriladi, şuning uçun undan keyingi qator heç qaçon bajarilmaydi. **Tuzatiş:** `temporary_setting` dagidek `yield` ni `try`/`finally` ga öring.

## Maşqlar

### 1. `Timer` klassi <Difficulty level="1" />

`__enter__` taymerning özini qaytaradigan, `__exit__` esa `elapsed` ni saqlaydigan `Timer` klassini yozing. `sum(range(100_000))` vaqtini ölçang, jamini çop eting va `elapsed` manfiy bölmagan float ekanini çop eting (qiymatning özi har işga tuşirişda özgaradi).

::: details Yeçim
```python
import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start

with Timer() as t:
    total = sum(range(100_000))

print(total)
print(isinstance(t.elapsed, float) and t.elapsed >= 0)
```

```text
4999950000
True
```
:::

### 2. Içma-iç bölimlar <Difficulty level="1" />

Kirişda sarlavhasini klass darajasidagi `depth` qadar çekiniş bilan çop etadigan va `depth` ga bir qöşadigan, çiqişda esa birni ayiradigan `Section` klassini yozing. `Hisobot`, `Toşkent` va `Savdo` bölimlarini içma-iç joylang va içida summani çop eting.

::: details Yeçim
```python
class Section:
    depth = 0

    def __init__(self, title):
        self.title = title

    def __enter__(self):
        print("  " * Section.depth + self.title)
        Section.depth += 1
        return self

    def __exit__(self, exc_type, exc, tb):
        Section.depth -= 1

with Section("Hisobot"):
    with Section("Toşkent"):
        with Section("Savdo"):
            print("  " * Section.depth + "1,200,000 söm")
```

```text
Hisobot
  Toşkent
    Savdo
      1,200,000 söm
```
:::

### 3. `temporary_attr` <Difficulty level="2" />

Atributni özgartiradigan va çiqişda, hatto blok istisno çaqirsa ham, eski qiymatni tiklaydigan `temporary_attr(obj, name, value)` `@contextmanager` funksiyasini yozing. Uni `discount = 0` bölgan `Shop` da sinang: içida çegirmani (15) çop eting va `ValueError` çaqiring; keyin xatoni va çegirmani çop eting.

::: details Yeçim
```python
from contextlib import contextmanager

@contextmanager
def temporary_attr(obj, name, value):
    old = getattr(obj, name)
    setattr(obj, name, value)
    try:
        yield obj
    finally:
        setattr(obj, name, old)

class Shop:
    discount = 0

shop = Shop()
try:
    with temporary_attr(shop, "discount", 15):
        print("aksiya paytida:", shop.discount)
        raise ValueError("kassa işdan çiqdi")
except ValueError as e:
    print("xato:", e)
print("aksiyadan keyin:", shop.discount)
```

```text
aksiya paytida: 15
xato: kassa işdan çiqdi
aksiyadan keyin: 0
```
:::

### 4. Köp fayllarga yoziş <Difficulty level="2" />

`names = ["aziza.txt", "bobur.txt", "jasur.txt"]` berilgan. `ExitStack` yordamida hammasini yoziş uçun oçing va har biriga `Imtihon duşanba kuni` deb yozing. `N ta fayl yopildi` deb çop etadigan callback röyxatdan ötkazing, keyin har bir faylning mazmunini çop eting.

::: details Yeçim
```python
from contextlib import ExitStack
from pathlib import Path

names = ["aziza.txt", "bobur.txt", "jasur.txt"]

files = []
with ExitStack() as stack:
    stack.callback(lambda: print(f"{len(files)} ta fayl yopildi"))
    for n in names:
        files.append(stack.enter_context(open(n, "w", encoding="utf-8")))
    for f in files:
        f.write("Imtihon duşanba kuni\n")

for n in names:
    print(n, "->", Path(n).read_text(encoding="utf-8").strip())
```

```text
3 ta fayl yopildi
aziza.txt -> Imtihon duşanba kuni
bobur.txt -> Imtihon duşanba kuni
jasur.txt -> Imtihon duşanba kuni
```
:::

### 5. Yutiş va qayd qiliş <Difficulty level="3" />

Istisno turlarini qabul qiladigan, faqat ularni yutadigan va har birini `records` röyxatiga `"TurNomi: xabar"` körinişida yozib qöyadigan `ErrorLog` klassini yozing. Boşqa istisnolar yuqoriga uzatilişi kerak. **Bitta** `ErrorLog` obyektini uçta blok uçun qayta işlating: `int("abc")`, `{}["palov"]` va `1 / 0` (röyxatda yöq). Qoçib çiqqan xatoni, keyin yozuvlarni çop eting.

::: details Yeçim
```python
class ErrorLog:
    def __init__(self, *types):
        self.types = types
        self.records = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is not None and issubclass(exc_type, self.types):
            self.records.append(f"{exc_type.__name__}: {exc}")
            return True
        return False

log = ErrorLog(ValueError, KeyError)

with log:
    int("abc")
with log:
    {}["palov"]
try:
    with log:
        1 / 0
except ZeroDivisionError as e:
    print("qoçib çiqdi:", e)

for record in log.records:
    print(record)
```

```text
qoçib çiqdi: division by zero
ValueError: invalid literal for int() with base 10: 'abc'
KeyError: 'palov'
```

`issubclass` klasslar kortejini qabul qiladi. Bu klass har bir blok uçun alohida holat saqlamaydi, şuning uçun `@contextmanager` obyektidan farqli ravişda uni qayta işlatiş mumkin.
:::

## Xulosa

- `__enter__` muvaffaqiyatli tugasa, `with ... as name` uning natijasini nomga boğlaydi va blokdan çiqişda `__exit__` ni çaqiradi.
- Blokda istisno yuz bersa, `__exit__` dan qaytgan rost qiymat uni bostiradi. Yolğon qiymat istisnoning taşqariga uzatilişiga yöl qöyadi.
- `ExitStack` menejerlarning çiqiş metodlarini va yakunlovçi funksiyalarni teskari tartibda bajaradi.
- `closing`, `redirect_stdout` va `nullcontext` `with` ni qöllamaydigan obyektlar, uşlangan natija va ixtiyoriy menejerlar uçun.
- `@contextmanager` obyekti bir martalik; uning `yield` ini `try`/`finally` içiga qöying.
- Sozlamalar va qulflar kabi har qanday "özgartir, keyin ortga qaytar" juftini menejer qilib yozing.

## Qöşimça manbalar

- [`contextlib`: utilities for with-statement contexts](https://docs.python.org/3/library/contextlib.html)
- [Data model: With statement context managers](https://docs.python.org/3/reference/datamodel.html#context-managers)
- [PEP 343: The "with" Statement](https://peps.python.org/pep-0343/)
