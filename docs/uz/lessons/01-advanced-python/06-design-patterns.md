---
title: Python tilida loyihalaş andozalari
description: "Dastur tuzilişida takrorlanadigan masalalarni funksiyalar, luğatlar, klasslar va generatorlar bilan yeçamiz."
---

# Python tilida loyihalaş andozalari

![Rasm: Python uslubidagi dizayn andozalari](/images/topics-webp-uzb/design-patterns.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- Dastur tuzilişida takrorlanadigan masalani taniş va uning yeçimini atama bilan ifodalaş
- **Strategy** (strategiya), **Factory** (fabrika) va **Registry** (registr) patternlarini funksiyalar, classmethodlar, luğatlar va dekoratorlar bilan qanday yoziş
- **Observer** (kuzatuvçi) patternini qanday quriş va generator konveyerlarini pattern sifatida köriş
- **Template Method** (şablon metod) ğoyasi va abstrakt klasslar hali ham qayerda örinli
- Umumiy obyektni modulda saqlaş
:::

## Nega bu muhim

Dastur tuzayotganda ayrim masalalarga qayta-qayta duç kelamiz. Masalan, dökonda çegirma qoidasi almaşadi, buyurtmani hisoblaş tartibi esa qoladi. Qoidani alohida funksiya qilib uzatiş mumkin. Bu yondaşuv **strategiya** deb ataladi. Darsda şunday yeçimlarni sodda misollar bilan köramiz.

## Strategy: funksiya uzating

**Strategiya** (*Strategy*) biror qoidani tanlaşga imkon beradi. Bu misolda har bir çegirma qoidasi alohida funksiya. `checkout` tanlangan funksiyani qabul qilib, uni çaqiradi. Funksiyani argument qilib uzatişni *Lambda va yuqori tartibli funksiyalar* darsida körgan edik.

```python
from functools import partial

def no_discount(total):
    return total

def percent_off(percent, total):
    return total * (100 - percent) / 100

def holiday(total):
    return max(total - 20000, 0)

def checkout(prices, discount=no_discount):
    return round(discount(sum(prices)))

cart = [45000, 15000, 30000]
print(checkout(cart))
print(checkout(cart, holiday))
print(checkout(cart, partial(percent_off, 15)))
```

```text
90000
70000
76500
```

`checkout` ga faqat çaqiriladigan biror narsa kerak. `partial` sozlamali qoidani bitta argumentli strategiyaga aylantiradi. Strategiyaga bir neça metod yoki holat kerak bölsa, klass işlating.

## Factory: classmethodlar va luğatlar

**Obyekt yaratuvçi funksiya** (*factory*) çaqiruvçi uçun obyekt yasaydi. Misoldagi muqobil konstruktor matn qatorini tahlil qilib, undan obyekt yasaydi. Bunda *Klass atributlari, klass metodlari va statik metodlar* darsidagi `@classmethod` dan foydalanamiz.

```python
class Payment:
    def __init__(self, method, amount):
        self.method = method
        self.amount = amount

    @classmethod
    def from_string(cls, text):
        method, amount = text.split(":")
        return cls(method.strip(), int(amount))

payment = Payment.from_string("card: 150000")
print(payment.method, payment.amount)
```

```text
card 150000
```

**Qaysi klassni** yaratişni tanlaş uçun `if`/`elif` zanjiri örniga luğat işlating:

```python
class Courier:
    days = 1

class Post:
    days = 5

DELIVERY_TYPES = {"courier": Courier, "post": Post}

def make_delivery(kind):
    try:
        return DELIVERY_TYPES[kind]()
    except KeyError:
        raise ValueError(f"nomaʼlum yetkaziş turi: {kind!r}") from None

print(type(make_delivery("post")).__name__)
try:
    make_delivery("drone")
except ValueError as error:
    print(error)
```

```text
Post
nomaʼlum yetkaziş turi: 'drone'
```

## Registry: luğatni dekorator bilan töldiring

**Röyxatga oliş** (*registry*) funksiyalarni keyinroq nomi bilan topişga yordam beradi. Bu misolda *Closure va dekoratorlar* darsidagi dekorator yordamida Python har bir funksiyani aniqlagan paytda luğatga qöşamiz.

```python
EXPORTERS = {}

def exporter(name):
    def decorator(func):
        EXPORTERS[name] = func
        return func
    return decorator

@exporter("csv")
def to_csv(rows):
    return "\n".join(f"{name},{score}" for name, score in rows)

@exporter("text")
def to_text(rows):
    return "\n".join(f"{name:<6}{score:>3}" for name, score in rows)

rows = [("Aziza", 92), ("Bobur", 85)]
print(sorted(EXPORTERS))
print(EXPORTERS["text"](rows))
```

```text
['csv', 'text']
Aziza  92
Bobur  85
```

Yangi format - bitta dekoratsiya qilingan funksiya. Flaskdagi `@app.route` ham xuddi şunday işlaydi.

## Observer: callbacklar

**Kuzatuvçi** (*Observer*) usulida obyekt hodisa yuz berganini qiziquvçi kodga bildiradi. Misolda xabar oliş uçun yozilgan funksiyalar röyxatda saqlanadi va buyurtma berilganda çaqiriladi.

```python
from collections import defaultdict

class EventEmitter:
    def __init__(self):
        self._listeners = defaultdict(list)

    def subscribe(self, event, callback):
        self._listeners[event].append(callback)

    def notify(self, event, data):
        for callback in self._listeners[event]:
            callback(data)

def send_sms(order):
    print(f"SMS ({order['customer']}): #{order['id']} buyurtma tölandi")

def update_stock(order):
    print(f"Ombordan ayirildi: {', '.join(order['items'])}")

events = EventEmitter()
events.subscribe("paid", send_sms)
events.subscribe("paid", update_stock)
events.notify("paid", {"id": 17, "customer": "Dilnoza", "items": ["çoy", "somsa"]})
```

```text
SMS (Dilnoza): #17 buyurtma tölandi
Ombordan ayirildi: çoy, somsa
```

Buyurtma kodi SMS yoki ombor kodini heç qaçon import qilmaydi.

## Iterator va konveyer: generatorlar

Pythonning `for` sikli navbatdagi elementni iteratordan oladi. Generator ham iterator bölib, har safar bittadan element bera oladi. Şu tariqa bir generatorning natijasi keyingisiga ötadi. Bu mavzuni *Iteratorlar va generatorlar* darsida körgan edik.

```python
def strip(lines):
    return (line.strip() for line in lines)

def non_empty(lines):
    return (line for line in lines if line)

def titled(lines):
    return (line.title() for line in lines)

def pipeline(source, *steps):
    for step in steps:
        source = step(source)
    return source

raw = ["  toşkent ", "", "samarqand", "   ", "buxoro"]
print(list(pipeline(raw, strip, non_empty, titled)))
```

```text
['Toşkent', 'Samarqand', 'Buxoro']
```

Har bir qadam kiçik, qadamlarning özi esa tartibini özgartiriş mumkin bölgan maʼlumot.

## Template Method va abstrakt klasslar

**Şablon metod** (*Template Method*) usulida asosiy klass amallar tartibini belgilaydi, voris klass esa özgaradigan qadamlarni yozadi. Quyidagi hisobotda şu qadam uçun *Polimorfizm, duck typing va abstrakt klasslar* darsidagi abstrakt metoddan foydalanamiz.

```python
from abc import ABC, abstractmethod

class Report(ABC):
    def render(self):                       # şablon: tartib qatʼiy
        return "\n".join([self.header(), *self.lines(), "-- tugadi --"])

    def header(self):
        return "Hisobot"

    @abstractmethod
    def lines(self): ...

class SalesReport(Report):
    def header(self):
        return "Savdo: Toşkent"

    def lines(self):
        return ["çoy    15,000", "somsa   8,000"]

print(SalesReport().render())
```

```text
Savdo: Toşkent
çoy    15,000
somsa   8,000
-- tugadi --
```

Faqat bitta qadam özgarsa, uni funksiya sifatida uzatiş soddaroq.

## Singleton: modul işlating

**Singleton** bir muhit doirasida bitta umumiy obyektni taqdim etadi. Bitta Python interpretatorida hamma joydan bir xil sozlamani öqiş kerak bölsa, uni modulda saqlaş yetarli. Ayni nom bilan odatiy import `sys.modules` dagi modulni qayta oladi. Boşqa jarayonda yoki modul qayta yuklanganda holat boşqaça bölişi mumkin.

```py
# settings.py
class Settings:
    def __init__(self):
        self.city = "Toşkent"
        self.currency = "söm"

settings = Settings()

# istalgan boşqa fayl
from settings import settings
```

Importlar bitta modul obyektidan birgalikda foydalanadi:

```python
import json
import json as again

print(json is again)
```

```text
True
```

## Pythonda odatiy yeçimlar

| GoF patterni | Python odatda uning örniga nima qiladi |
|---|---|
| Strategy | qiymat sifatida uzatiladigan funksiyalar, `partial` |
| Factory | `@classmethod` konstruktorlar, klasslar luğati |
| Iterator | `for`, generatorlar |
| Decorator | dekoratorlar, kompozitsiya |
| Command | funksiyalar, `partial` |
| Singleton | modul darajasidagi nusxaga ega modul |
| Builder | kalit söz argumentlari, dataclasslar |

## Özingiz sinab köring

Yangi çegirma qoidasini qöşing va turli savatlar uçun qaysi biri yutişini köring.

<ClientOnly><PythonPlayground :code='"def standard(total):\n    return total\n\ndef student(total):\n    return total * 0.9\n\ndef big_order(total):\n    return total - 30000 if total >= 300000 else total\n\ndef checkout(prices, discount):\n    return round(discount(sum(prices)))\n\ncart = [120000, 95000, 110000]\nfor rule in [standard, student, big_order]:\n    print(f\"{rule.__name__:<10} {checkout(cart, rule):>8,} söm\")\n\nbest = min([standard, student, big_order], key=lambda rule: checkout(cart, rule))\nprint(\"Bu savat uçun eng yaxşisi:\", best.__name__)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Luğat bajaradigan iş uçun klasslar iyerarxiyasi

```python
# Yomon: faqat bitta sonni saqlaydigan har bir hudud uçun alohida klass
class TashkentRate:
    def rate(self):
        return 15000

class SamarkandRate:
    def rate(self):
        return 25000

print(SamarkandRate().rate())

# Yaxşi: maʼlumotning joyi luğatda
DELIVERY_RATES = {"Toşkent": 15000, "Samarqand": 25000}
print(DELIVERY_RATES["Samarqand"])
```

```text
25000
25000
```

Bu misolda luğat yetarli, çunki har bir nom bitta qiymatni tanlaydi. Obyekt öz holati yoki xatti-harakatiga ega bölişi kerak bölsa, klassdan foydalaning.

### 2. Tasodifan umumiy bölib qolgan özgaruvçan Registry

```python
class EventEmitter:
    listeners = []          # Yomon: barça emitterlar uçun bitta röyxat

    def subscribe(self, callback):
        self.listeners.append(callback)

    def notify(self, message):
        for callback in self.listeners:
            callback(message)

shop = EventEmitter()
bank = EventEmitter()
shop.subscribe(lambda message: print("dökon qabul qildi:", message))
bank.notify("maoş tölandi")
```

```text
dökon qabul qildi: maoş tölandi
```

Klass atributi barça nusxalar uçun umumiy. **Tuzatiş:** röyxatni `__init__` içida `self.listeners = []` bilan yarating.

### 3. `__new__` li singleton baribir `__init__` ni işga tuşiradi

```python
class Settings:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        print("__init__ işladi")
        self.city = "Toşkent"

first = Settings()
first.city = "Samarqand"
second = Settings()
print(first is second, first.city)
```

```text
__init__ işladi
__init__ işladi
True Toşkent
```

`__new__` söralgan klassning obyektini qaytarsa, Python `__init__` ni çaqiradi. Avvalgi obyekt qaytarilganda ham şu qoida amal qiladi. Misolda ikkinçi çaqiruv `city` ni özgartiradi. Bitta umumiy obyekt kerak bölsa, uni modulda saqlang.

### 4. Xabar berayotganda tinglovçilar röyxatini özgartiriş

```python
listeners = []

def welcome_once(name):
    print("Xuş kelibsiz,", name)
    listeners.remove(welcome_once)

def log_signup(name):
    print("log: röyxatdan ötdi", name)

listeners.extend([welcome_once, log_signup])
for callback in listeners:
    callback("Jasur")
```

```text
Xuş kelibsiz, Jasur
```

Sikl davomida elementni öçirsak, undan keyingi elementlar siljiydi. Şunda sikl bir tinglovçini ötkazib yuborişi mumkin. Xabar yuboriş boşlanganda röyxatda bölgan tinglovçilarni çaqiriş uçun röyxat nusxasi böylab yuring.

## Maşqlar

### 1. Yetkaziş narxi uçun Strategy <Difficulty level="1" />

Kilogrammdagi vaznni qabul qiladigan Strategy funksiyalarini yozing: `standard` (10,000 söm + har bir kg uçun 2,000), `express` (standartning ikki barobari) va `pickup` (bepul). `shipping_cost(weight, strategy)` ni yozing va 3 kg uçun har bir narxni çop eting.

::: details Yeçim
```python
def standard(weight):
    return 10000 + 2000 * weight

def express(weight):
    return 2 * standard(weight)

def pickup(weight):
    return 0

def shipping_cost(weight, strategy):
    return strategy(weight)

for strategy in [standard, express, pickup]:
    print(f"{strategy.__name__}: {shipping_cost(3, strategy):,} söm")
```

```text
standard: 16,000 söm
express: 32,000 söm
pickup: 0 söm
```
:::

### 2. Plaginlar uçun Registry <Difficulty level="1" />

Matn funksiyasini `PLUGINS` ga qöşib, uni qaytaradigan `@plugin` ni yozing. `strip` va `no_commas` ni röyxatdan ötkazing, keyin ularni `"  Toşkent, Çilonzor  "` ustida tartib bilan işga tuşiring va natijaning `repr` ini çop eting.

::: details Yeçim
```python
PLUGINS = []

def plugin(func):
    PLUGINS.append(func)
    return func

@plugin
def strip(text):
    return text.strip()

@plugin
def no_commas(text):
    return text.replace(",", "")

text = "  Toşkent, Çilonzor  "
for func in PLUGINS:
    text = func(text)
print(repr(text))
```

```text
'Toşkent Çilonzor'
```
:::

### 3. Obunani bekor qiliş mumkin bölgan hodisa tarqatuvçi <Difficulty level="2" />

`subscribe(event, callback)` metodi şu callbackning obunasini bekor qiladigan **funksiya qaytaradigan** `EventEmitter` ni yozing. `"sale"` ga ikki tinglovçini obuna qiling, xabar bering, bittasining obunasini bekor qiling va yana xabar bering.

::: details Yeçim
```python
from collections import defaultdict

class EventEmitter:
    def __init__(self):
        self._listeners = defaultdict(list)

    def subscribe(self, event, callback):
        self._listeners[event].append(callback)

        def unsubscribe():
            self._listeners[event].remove(callback)
        return unsubscribe

    def notify(self, event, data):
        for callback in list(self._listeners[event]):
            callback(data)

emitter = EventEmitter()
stop_email = emitter.subscribe("sale", lambda amount: print(f"email: {amount:,} söm"))
emitter.subscribe("sale", lambda amount: print(f"hisobot: {amount:,} söm"))

emitter.notify("sale", 150000)
stop_email()
emitter.notify("sale", 80000)
```

```text
email: 150,000 söm
hisobot: 150,000 söm
hisobot: 80,000 söm
```

`unsubscribe` - `event` va `callback` ustidagi closure.
:::

### 4. Buyurtma holatlari maşinasi <Difficulty level="2" />

Buyurtma `created → paid → shipped` yölidan ötadi; `cancel` faqat jönatilişdan oldin işlaydi. Qoidalarni `{(state, action): new_state}` jadvalida saqlang va taqiqlangan amallar uçun `ValueError` çaqiradigan `Order.apply(action)` ni yozing. `pay`, `ship`, `cancel` ni bajaring va `AMAL: endi HOLAT` yoki `Xato: XABAR` ni çop eting.

::: details Yeçim
```python
TRANSITIONS = {
    ("created", "pay"): "paid",
    ("created", "cancel"): "cancelled",
    ("paid", "ship"): "shipped",
    ("paid", "cancel"): "cancelled",
}

class Order:
    def __init__(self):
        self.state = "created"

    def apply(self, action):
        key = (self.state, action)
        if key not in TRANSITIONS:
            raise ValueError(f"{self.state} holatidagi buyurtmaga {action} amalini bajarib bölmaydi")
        self.state = TRANSITIONS[key]

order = Order()
for action in ["pay", "ship", "cancel"]:
    try:
        order.apply(action)
        print(f"{action}: endi {order.state}")
    except ValueError as error:
        print("Xato:", error)
```

```text
pay: endi paid
ship: endi shipped
Xato: shipped holatidagi buyurtmaga cancel amalini bajarib bölmaydi
```

Yangi qadam - yangi `if` emas, jadvaldagi bitta qator.
:::

### 5. Narxlaş plaginlari <Difficulty level="3" />

Registry va Strategy ni birlaştiring: `@pricing("vip")` mijoz turi uçun narx funksiyasini röyxatdan ötkazadi. `Order.from_string("vip:120000,80000")` Factory metodini va öz turi uçun Strategy dan, nomaʼlum turlar uçun esa `"regular"` dan foydalanadigan `order.total()` ni qöşing. `vip:120000,80000`, `student:50000` va `tourist:30000,20000` uçun tur va jami summani çop eting.

::: details Yeçim
```python
PRICING = {}

def pricing(customer_type):
    def decorator(func):
        PRICING[customer_type] = func
        return func
    return decorator

@pricing("regular")
def regular(total):
    return total

@pricing("student")
def student(total):
    return total * 0.9

@pricing("vip")
def vip(total):
    return total * 0.8

class Order:
    def __init__(self, customer_type, prices):
        self.customer_type = customer_type
        self.prices = prices

    @classmethod
    def from_string(cls, text):
        customer_type, prices = text.split(":")
        return cls(customer_type, [int(p) for p in prices.split(",")])

    def total(self):
        strategy = PRICING.get(self.customer_type, PRICING["regular"])
        return round(strategy(sum(self.prices)))

for text in ["vip:120000,80000", "student:50000", "tourist:30000,20000"]:
    order = Order.from_string(text)
    print(order.customer_type, order.total())
```

```text
vip 160000
student 45000
tourist 50000
```

Yangi narx qoidasi uçun yana bir funksiyani röyxatga kiritamiz. `Order` uni mijoz turi böyiça topaveradi.
:::

## Xulosa

- Loyiha andozasi takrorlanadigan masalaning yeçim usulini bildiradi.
- Strategiya funksiya bölişi mumkin. Yaratuvçi funksiya obyekt yasaydi. Registr obyektlarni keyinroq topiş uçun saqlaydi.
- **Observer** callbacklar röyxatini saqlaydi; xabarni uning nusxasi böylab tarqating.
- **Iterator** patterni `for` sikllari va generatorlarga örnatilgan, generatorlar esa konveyerga zanjir qilinadi. **Template Method** abstrakt asosiy klasslarga mos keladi.
- Modul bir interpretator doirasida umumiy obyektni saqlay oladi. `__new__` eski obyektni qaytarsa ham, `__init__` yana çaqirilişi mumkin.

## Qöşimça manbalar

- [Python qöllanmasi: Klasslar](https://docs.python.org/3/tutorial/classes.html)
- [`functools`: yuqori tartibli funksiyalar](https://docs.python.org/3/library/functools.html)
- [`abc`: abstrakt asosiy klasslar](https://docs.python.org/3/library/abc.html)
- [Brandon Rhodes: Python Design Patterns qöllanmasi](https://python-patterns.guide/)
