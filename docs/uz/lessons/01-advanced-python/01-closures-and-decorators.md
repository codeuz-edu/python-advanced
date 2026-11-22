---
title: Closure va dekoratorlar
description: "Closure taşqi özgaruvçilarni qanday saqlaşini, dekoratorlar qanday yozilişini hamda functools.wraps, lru_cache va partial qayerda işlatilişini örganasiz."
---

# Closure va dekoratorlar

![Rasm: Closure va dekoratorlar](/images/topics-webp-uzb/closures-and-decorators.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- **Closure** nima va içki funksiyaga qaçon `nonlocal` kerak
- `*args`, `**kwargs` va `functools.wraps` bilan **dekoratorni** (decorator) qadamma-qadam qanday yoziş
- Dekoratorga argument uzatiş va ketma-ket yozilgan dekoratorlarning qöllaniş tartibi
- `functools.lru_cache` va `functools.partial` dan qanday foydalaniş
- `@dataclass` va `@register` kabi klass dekoratorlarining işlaşi
:::

## Nega bu muhim

*Xossalar va inkapsulyatsiya* darsidagi `@property` ham, *Klass atributlari, klass metodlari va statik metodlar* darsidagi `@classmethod` ham dekorator. Şu yozuv yordamida tayyor funksiyaga çaqiruvlarni qayd etiş, natijalarni keşlaş yoki xatodan söng qayta uriniş kabi imkoniyatlarni qöşiş mumkin. Bu darsda dekorator yozamiz. Uni funksiya aniqlanganda ham, funksiya çaqirilganda ham kuzatamiz.

## Closurelar va `nonlocal`

*Lambda va yuqori tartibli funksiyalar* darsida funksiyani argument sifatida uzatiş va natija sifatida qaytariş mumkinligini körgan edik. **Closure** deb taşqi funksiyaning özgaruvçilariga u funksiya tugaganidan keyin ham murojaat qila oladigan funksiyaga aytiladi. Quyidagi misolda har bir navbat hisoblagichi öz prefiksini öqiydi va öz raqamini yangilaydi.

```python
def make_ticket_counter(prefix):
    number = 0

    def next_ticket():
        nonlocal number     # taşqi özgaruvçiga qiymat beriş
        number += 1
        return f"{prefix}{number}"

    return next_ticket

bank = make_ticket_counter("A")
print(bank(), bank(), bank())

pharmacy = make_ticket_counter("B")   # yangi, alohida number
print(pharmacy())
```

```text
A1 A2 A3
B1
```

Içki funksiya `prefix` ni bevosita öqiydi. `number` ga yangi qiymat beriş uçun esa *Özgaruvçilarning köriniş sohasi* darsida körganimizdek, `nonlocal` yoziş kerak. `make_ticket_counter()` har safar çaqirilganda alohida `number` yaratiladi. Şu sababli bank va dorixonadagi navbat raqamlari mustaqil ortib boradi.

## Dekoratorni qadamma-qadam yoziş

**Dekorator** funksiya yoki klassni qabul qiladigan çaqiriluvçi obyekt. U qaytargan obyekt asl nomga boğlanadi. Funksiya dekoratorlari köpinça **örovçi funksiya** qaytaradi. Bu misoldagi örovçi funksiya pozitsion va kalit sözli argumentlarni qabul qiladi, ularni asl funksiyaga uzatadi va natijani qaytaradi.

```python
def announce(func):
    def wrapper(*args, **kwargs):
        print(f"{func.__name__} çaqirilmoqda: {args} {kwargs}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} qaytardi: {result!r}")
        return result
    return wrapper

def add(a, b):
    return a + b

add = announce(add)          # qölda dekoratsiya qiliş
add(2, 3)

@announce                    # @ bilan xuddi şu narsa
def total_price(price, quantity=1):
    return price * quantity

total = total_price(15000, quantity=3)
print(total)
```

```text
add çaqirilmoqda: (2, 3) {}
add qaytardi: 5
total_price çaqirilmoqda: (15000,) {'quantity': 3}
total_price qaytardi: 45000
45000
```

`def` ustidagi `@announce` aynan `total_price = announce(total_price)` degani. Endi nom `wrapper` ni körsatadi, `wrapper` esa asl funksiyaga `func` closure özgaruvçisi orqali yetib boradi.

## `functools.wraps`

Dekorator qöllangandan keyin nom örovçi funksiyani bildiradi. Şunda `help()` kabi vositalar örovçi funksiyaning nomi va izoh satrini köradi. `functools.wraps` bu maʼlumotlarni asl funksiyadan köçiradi va unga `__wrapped__` orqali murojaat qiliş imkonini beradi.

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
    """Salomlaşiş matnini qaytaradi."""
    return f"Salom, {name}!"

@careful
def farewell(name):
    """Xayrlaşiş matnini qaytaradi."""
    return f"Xayr, {name}!"

print(greet.__name__, greet.__doc__)
print(farewell.__name__, farewell.__doc__)
```

```text
wrapper None
farewell Xayrlaşiş matnini qaytaradi.
```

`@wraps(func)` ning özi ham argumentli dekorator. Örovçi funksiya asl funksiyaning örnini egallaganda undan foydalaning.

## Argumentli dekoratorlar

Funksiya aniqlanayotganda Python avval `retry(times=3)` ni hisoblaydi. Natijada dekorator hosil böladi va Python unga asl funksiyani uzatadi. Misoldagi uçta funksiyaning vazifasi alohida: `retry` urinişlar sonini belgilaydi, `decorator` asl funksiyani qabul qiladi, `wrapper` esa har bir çaqiruvni boşqaradi.

```python
from functools import wraps

def retry(times):
    if times < 1:
        raise ValueError("urinişlar soni kamida 1 bölişi kerak")

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except ConnectionError as error:
                    print(f"  {attempt}-uriniş muvaffaqiyatsiz: {error}")
                    if attempt == times:
                        raise
        return wrapper
    return decorator

answers = iter(["timeout", "timeout", "1 USD = 12,650 söm"])

@retry(times=3)
def fetch_rate():
    answer = next(answers)
    if answer == "timeout":
        raise ConnectionError(answer)
    return answer

print(fetch_rate())
```

```text
  1-uriniş muvaffaqiyatsiz: timeout
  2-uriniş muvaffaqiyatsiz: timeout
1 USD = 12,650 söm
```

Bu yozuv `fetch_rate = retry(times=3)(fetch_rate)` bilan teng kuçli. Örovçi funksiya `times` qiymatini saqlab qoladi. Barça uriniş muvaffaqiyatsiz tugasa, oxirgi ulaniş xatosini qayta kötaradi.

## Dekoratorlarni ustma-ust qöyiş

Python dekorator ifodalarini yuqoridan pastga qarab hisoblaydi. Hosil bölgan dekoratorlarni esa pastdan yuqoriga qarab qöllaydi. `def` ga eng yaqin dekorator asl funksiyani qabul qiladi. Bu misolda eng yuqoridagi dekorator eng taşqi örovçi funksiyani yaratadi.

![Diagramma: Ustma-ust dekoratorlar](/images/companions-webp-uzb/decorator-stack.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

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

print(city("Samarqand"))     # bold(italic(city))
```

```text
<b><i>Samarqand</i></b>
```

`@retry` ni `@announce` dan yuqoriga yozsak, har bir uriniş alohida qayd etiladi. Örinlarini almaştirsak, `@announce` butun jarayonni bitta çaqiruv sifatida qayd etadi.

## `lru_cache` va `partial`

`lru_cache` natijalarni argumentlariga qarab saqlaydi. Rekursiv Fibonaççi funksiyasida ayni qiymat bir neça bor söraladi. Natija keşda bölsa, funksiya tanasini qayta bajarişga hojat qolmaydi.

```python
from functools import lru_cache

calls = 0

def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(25), "çaqiruvlar:", calls)

calls = 0

@lru_cache(maxsize=None)
def fast_fib(n):
    global calls
    calls += 1
    return n if n < 2 else fast_fib(n - 1) + fast_fib(n - 2)

print(fast_fib(25), "çaqiruvlar:", calls)
print(fast_fib.cache_info())
```

```text
75025 çaqiruvlar: 242785
75025 çaqiruvlar: 26
CacheInfo(hits=23, misses=26, maxsize=None, currsize=26)
```

`functools.cache` va `lru_cache(maxsize=None)` bir xil işlaydi. Argumentlarni xeşlaş mumkin bölişi kerak. Bir xil argumentlarda oldingi natijani qaytariş töğri bölsa va funksiyaning işini ötkazib yuboriş mumkin bölsa, keşdan foydalaning.

*Lambda va yuqori tartibli funksiyalar* darsidagi `partial` ayrim argumentlarni oldindan belgilaydi va keyinroq çaqiriş mumkin bölgan obyekt qaytaradi.

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

## Klass dekoratorlari

Dekorator **klassni** ham qabul qilişi, u bilan biror iş qilişi va uni qaytarişi mumkin. Keng tarqalgan qöllaniş - klasslarni nomi böyiça yiğadigan **registr** (registry):

```python
PAYMENT_METHODS = {}

def register(cls):
    PAYMENT_METHODS[cls.__name__.lower()] = cls
    return cls                  # klassni özgarişsiz qaytarib beriş

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

Yangi tölov usuli uçun yozilgan klass `@register` yordamida röyxatga kiradi. *Dataclasslar* darsidagi `@dataclass` maydonlarning tur izohlarini öqiydi. Odatiy sozlamalarda u `__init__`, `__repr__` va `__eq__` kabi metodlarni yaratadi.

## Özingiz sinab köring

`@count_calls` bilan boşqa funksiyani dekoratsiya qiling yoki örovçi funksiya argumentlarni ham çop etadigan qiling.

<ClientOnly><PythonPlayground :code='"from functools import wraps\n\ndef count_calls(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        wrapper.calls += 1\n        print(f\"[{func.__name__}: {wrapper.calls}-çaqiruv]\")\n        return func(*args, **kwargs)\n    wrapper.calls = 0\n    return wrapper\n\n@count_calls\ndef order_total(price, quantity=1):\n    return price * quantity\n\nprint(order_total(15000))\nprint(order_total(8000, quantity=3))\nprint(\"Jami çaqiruvlar:\", order_total.calls)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Örovçi funksiyani qaytarişni unutiş

```py
def announce(func):
    def wrapper(*args, **kwargs):
        print("Çaqirilmoqda:", func.__name__)
        return func(*args, **kwargs)
    # Yomon: return wrapper yöq

@announce
def greet(name):
    return f"Salom, {name}!"

print(greet("Aziza"))
```

```text
TypeError: 'NoneType' object is not callable
```

Dekorator `None` qaytardi, şuning uçun `greet` `None` ga teng. `return wrapper()` ham xuddi şunday notöğri: u funksiyani dekoratsiya paytidayoq çaqiradi. **Tuzatiş:** dekoratorni qavslarsiz `return wrapper` bilan tugating.

### 2. `@wraps` ni unutiş

```python
def logged(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@logged
def home():
    return "Boş sahifa"

@logged
def about():
    return "Biz haqimizda"

pages = {page.__name__: page for page in [home, about]}
print(list(pages))
print(pages["wrapper"]())
```

```text
['wrapper']
Biz haqimizda
```

Ikkala funksiyaning ham nomi `wrapper`, şuning uçun ikkinçisi birinçisining ustidan yozildi. **Tuzatiş:** `def wrapper` ustiga `@wraps(func)` qöying.

### 3. Qaytariladigan qiymatni yutib yuboriş

```python
def announce(func):
    def wrapper(*args, **kwargs):
        print("Çaqirilmoqda:", func.__name__)
        func(*args, **kwargs)       # Yomon: natija taşlab yuboriladi
    return wrapper

@announce
def total(prices):
    return sum(prices)

print("Jami:", total([15000, 8000]))
```

```text
Çaqirilmoqda: total
Jami: None
```

**Tuzatiş:** `return func(*args, **kwargs)` yozing yoki natijani `result` ga saqlab, oxirida qaytaring.

### 4. Taşqi özgaruvçini `nonlocal` siz özgartiriş

```py
def make_counter():
    count = 0
    def counter():
        count += 1          # Yomon: qiymat beriş count ni lokal qiladi
        return count
    return counter

tick = make_counter()
tick()
```

```text
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

**Tuzatiş:** `counter` ning birinçi qatori sifatida `nonlocal count` qöşing.

## Maşqlar

### 1. Har bir çaqiruvni qayd etiş <Difficulty level="1" />

Har bir çaqiruvdan oldin `log: NOM(ARGUMENTLAR)` ni çop etadigan va natijani qaytaradigan `@log_calls` dekoratorini yozing. `add(a, b)` ni dekoratsiya qiling va `add(2, 3)` ni çop eting.

::: details Yeçim
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

### 2. Joriy qoldiq <Difficulty level="1" />

`spend(amount)` funksiyasini qaytaradigan `make_wallet(balance)` ni yozing. Har bir çaqiruv summani ayiradi va yangi qoldiqni qaytaradi. 100,000 sömdan boşlang, avval 25,000, keyin 40,000 sarflang va har bir yangi qoldiqni çop eting.

::: details Yeçim
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

### 3. Natijalarni luğatda saqlaş <Difficulty level="2" />

`functools` siz natijalarni closure içidagi luğatda saqlaydigan `@memoize` ni yozing. Rekursiv `fib` ni dekoratsiya qiling, uning tanasi neça marta bajarilişini sanang va `fib(30)` hamda sanoqni çop eting.

::: details Yeçim
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
print("tana", runs, "marta bajarildi")
```

```text
832040
tana 31 marta bajarildi
```

Rekursiv çaqiruvlar dekoratsiya qilingan `fib` nomi orqali ötadi, şuning uçun ular ham keşdan foydalanadi.
:::

### 4. Argumentli takrorlaş <Difficulty level="2" />

Funksiyani `n` marta çaqirib, barça natijalar röyxatini qaytaradigan `@repeat(n)` ni yozing. `iter([3, 6, 2])` dan keyingi sonni qaytaradigan `roll()` ni `@repeat(3)` bilan dekoratsiya qiling va natijani çop eting.

::: details Yeçim
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

### 5. Tur tekşiruvlari <Difficulty level="3" />

`@validate_types(**types)` ni yozing, masalan `@validate_types(city=str, price=int)`. Har bir çaqiruvdan oldin har bir nomlangan argumentni (pozitsiya böyiça yoki kalit söz bilan uzatilganini) tekşiring va tur notöğri bölsa, tuşunarli xabar bilan `TypeError` çaqiring. Maslahat: `inspect.signature(func).bind(*args, **kwargs).arguments` nomlardan qiymatlarga luğat beradi. `delivery("Buxoro", 30000)` ni çop eting, keyin uni `("Nukus", "30000")` va `(42, 30000)` bilan çaqiring va har biri uçun `Xato: XABAR` ni çop eting.

::: details Yeçim
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
                    raise TypeError(f"{name} {expected.__name__} bölişi kerak, {actual} berildi")
            return func(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(city=str, price=int)
def delivery(city, price):
    return f"Yetkaziş ({city}): {price:,} söm"

print(delivery("Buxoro", 30000))
for args in [("Nukus", "30000"), (42, 30000)]:
    try:
        delivery(*args)
    except TypeError as error:
        print("Xato:", error)
```

```text
Yetkaziş (Buxoro): 30,000 söm
Xato: price int bölişi kerak, str berildi
Xato: city str bölişi kerak, int berildi
```

`bind` uzatilgan argumentlarni Python qoidalariga muvofiq parametrlarga moslaydi. Uzatilmagan parametrlarning standart qiymatlarini ham tekşiriş uçun `.arguments` ni öqişdan oldin `apply_defaults()` ni çaqiring.
:::

## Xulosa

- **Closure** taşqi funksiyaning özgaruvçilariga murojaat qila oladi. Ularga yangi qiymat beriş uçun `nonlocal` kerak.
- `@deco` dekoratorni funksiya yoki klassga qöllab, qaytgan obyektni uning nomiga boğlaydi.
- Örovçi funksiya `*args, **kwargs` ni uzatadi va asl natijani qaytaradi. `@wraps(func)` funksiya haqidagi maʼlumotlarni saqlaydi.
- `@retry(times=3)` avval dekorator yaratadi. Python ustma-ust yozilgan dekoratorlarni pastdan yuqoriga qarab qöllaydi.
- `lru_cache` natijalarni saqlaydi, `partial` argumentlarni oldindan belgilaydi. Klass dekoratori klassni qabul qilib, uni qaytarişi mumkin.

## Qöşimça manbalar

- [Glossary: decorator](https://docs.python.org/3/glossary.html#term-decorator)
- [`functools`: yuqori tartibli funksiyalar va çaqiriladigan obyektlar ustida amallar](https://docs.python.org/3/library/functools.html)
- [Reference: funksiya taʼriflari va dekoratorlar](https://docs.python.org/3/reference/compound_stmts.html#function-definitions)
- [PEP 318: funksiya va metodlar uçun dekoratorlar](https://peps.python.org/pep-0318/)
