---
title: Single Responsibility tamoyili
description: "Narx, çegirma va saqlaş qoidalarini ularning özgariş sabablariga qarab ajratamiz."
---

# Single Responsibility tamoyili

::: tip Nimalarni örganasiz
- **Bitta özgariş sababi** nimani anglatadi va u qaysi muammoning oldini oladi
- **Hisob-kitob, biznes-qoidalar va saqlaşni** aralaştirgan klassni qanday aniqlaş
- Özgariş talabi faqat **bitta klassga** tegişi uçun uni qanday ajratiş
- Kundalik Python kodida bu qanday körinadi: **funksiyalar va modullar**
- Klassni yanada maydalaş qaçon **ortiqça murakkablaştiriş** (over-engineering) böladi
:::

## Nega bu muhim

Buyurtma dasturi narxni hisoblaydi, çegirma beradi va buyurtmani saqlaydi. Bularning hammasi bitta klassda bölsa, reklama qoidasi ham, maʼlumotlar bazasi ham özgarganda bir joyni tahrirlaymiz. [SOLID bölimidagi](/uz/solid) birinçi tamoyil har bir özgariş qayerga tegişli ekanini aniqlaşga yordam beradi.

## Tamoyil

> Har bir klass faqat **bitta özgariş sababiga** ega bölişi kerak.

Masʼuliyatni özgariş sababi orqali bilamiz. Bu misolda moliya bölimi narx formulasini, marketing bölimi çegirma qoidasini, texnik jamoa esa saqlaş usulini belgilaydi. Kodni qaysi talabga xizmat qilişiga qarab guruhlaymiz. Bir xil talabni bajaradigan bir neça metod bitta masʼuliyatga ega bölişi mumkin.

## Notöğri yondaşuv

<SolidSrpViolation />

Bu `Order` uçala vazifani bajaradi, konstruktori esa ularni ketma-ket işga tuşiradi:

```python
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    price: float
    quantity: int

class Order:
    def __init__(self, items: list[Item]) -> None:
        self.items = items
        self.total_price = self.calculate_total()
        self.total_price = self.apply_discount(self.total_price)
        self.save()

    def calculate_total(self) -> float:
        return sum(item.price * item.quantity for item in self.items)

    def apply_discount(self, total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

    def save(self) -> None:
        print(f"[DB] Buyurtma saqlanmoqda, jami: ${self.total_price:.2f}")

items = [Item("Klaviatura", 75.00, 1), Item("Siçqonça", 50.00, 3)]
order = Order(items)
print(f"Buyurtma summasi: ${order.total_price:.2f}")

# Savat sahifasiga faqat son kerak
preview = Order([Item("Siçqonça", 50.00, 1)])
print(f"Savatdagi summa: ${preview.total_price:.2f}")
```

```text
[DB] Buyurtma saqlanmoqda, jami: $202.50
Buyurtma summasi: $202.50
[DB] Buyurtma saqlanmoqda, jami: $50.00
Savatdagi summa: $50.00
```

**Özgariş talabi:** xaridor hali xarid qilayotgan paytda savat sahifasi çegirmali summani körsatişi kerak, buyurtma rasmiylaştirilmagunça esa heç narsa saqlanmasligi lozim. Oxirgi ikki qator şuni sinab köradi va ikkinçi `[DB]` qatori savatdagi summa haqiqiy buyurtma sifatida saqlanganini körsatadi. Narxni hisoblaydigan kod bor, lekin u özini özi saqlaydigan klass içida qamalib qolgan. `save=False` bayroği har bir jamoa tayanadigan klassni tahrirlaşni talab qiladi; formulani savat sahifasiga köçiriş esa vaqt ötib bir-biridan farq qilib ketadigan ikkita çegirma qoidasini qoldiradi. Testlar ham şu muammoga duç keladi: 10% qoidasini tekşirişda bazaga yozuv tuşadi.

## Töğri yondaşuv

<SolidSrpFix />

Uçala işga alohida joy beramiz. `Order` buyurtma maʼlumotlarini saqlaydi va kerakli amallarni navbati bilan çaqiradi.

```python
from dataclasses import dataclass, field

@dataclass
class Item:
    name: str
    price: float
    quantity: int

class PriceCalculator:
    @staticmethod
    def total(items: list[Item]) -> float:
        return sum(item.price * item.quantity for item in items)

class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

class OrderRepository:
    @staticmethod
    def save(order: "Order") -> None:
        print(f"[DB] Buyurtma saqlanmoqda, jami: ${order.total_price:.2f}")

@dataclass
class Order:
    items: list[Item] = field(default_factory=list)
    total_price: float = 0.0

    def finalize(self) -> None:
        self.total_price = PriceCalculator.total(self.items)
        self.total_price = DiscountApplier.apply(self.total_price)
        OrderRepository.save(self)

order = Order(items=[Item("Klaviatura", 75.00, 1), Item("Siçqonça", 50.00, 3)])
order.finalize()
print(f"Buyurtma summasi: ${order.total_price:.2f}")

# Savat sahifasiga faqat son kerak
cart = [Item("Siçqonça", 50.00, 1)]
print(f"Savatdagi summa: ${DiscountApplier.apply(PriceCalculator.total(cart)):.2f}")
```

```text
[DB] Buyurtma saqlanmoqda, jami: $202.50
Buyurtma summasi: $202.50
Savatdagi summa: $50.00
```

Savat narxini oldindan körsatiş uçun narx hisoblagiçi va çegirma qoidasini çaqiramiz. Saqlaş alohida amal bölganidan savatni maʼlumotlar bazasiga yozmaymiz. Jadval har bir özgariş qayerga tegişli ekanini körsatadi.

| Klass | Vazifasi | Özgarişni kim söraydi |
| --- | --- | --- |
| `Order` | Buyurtma maʼlumotlarini özida tutadi, qadamlarni işga tuşiradi | buyurtmani rasmiylaştiriş jarayoni |
| `PriceCalculator` | Umumiy narxni hisoblaydi | moliya bölimi |
| `DiscountApplier` | Çegirma qoidalarini qöllaydi | marketing |
| `OrderRepository` | Bazaga saqlaş bilan şuğullanadi | platforma jamoasi |

`Order` hali ham uçala klassni töğridan-töğri nomlaydi; ularni almaştiriladigan qiliş [Dependency Inversion](/uz/lessons/dependency-inversion) ning vazifasi.

## Kundalik Python kodida

Python modulida bir-biriga yaqin funksiyalarni jamlaş mumkin. Bu misoldagi funksiyalar oddiy argumentlar oladi va natija qaytaradi. Vazifalarni alohida klasslarsiz ham ajrata olamiz.

```python
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    price: float
    quantity: int

def order_total(items: list[Item]) -> float:          # pricing.py
    return sum(item.price * item.quantity for item in items)

def apply_discount(total: float) -> float:            # discounts.py
    return total * 0.9 if total > 200 else total

def save_order(total: float) -> None:                 # storage.py
    print(f"[DB] Buyurtma saqlanmoqda, jami: ${total:.2f}")

def checkout(items: list[Item]) -> float:
    total = apply_discount(order_total(items))
    save_order(total)
    return total

checkout([Item("Klaviatura", 75.00, 1), Item("Siçqonça", 50.00, 3)])
assert apply_discount(100) == 100 and apply_discount(300) == 270
print("çegirma qoidasi bazasiz test qilindi")
```

```text
[DB] Buyurtma saqlanmoqda, jami: $202.50
çegirma qoidasi bazasiz test qilindi
```

Izohlar har bir funksiya qaysi modulda turişini körsatadi. Oxirgi ikki qator foydasini körsatadi: `apply_discount` kabi sof funksiya (pure function) tayyorgarliksiz va mocklarsiz bitta `assert` bilan test qilinadi (*Testlaşni çuqurroq örganiş*). Standart kutubxona ham xuddi şunday bölingan: `json` JSON bilan, `pathlib` esa fayl yöllari bilan işlaydi.

## Qaçon qöllamaslik kerak

Har bir böliniş öquvçidan yana bir nom yoki faylni kuzatişni talab qiladi. Bir talabga xizmat qiladigan kod yonma-yon qolsin. Bölimlar turli sabab bilan özgarayotganini körsangiz, ularni ajrating.

- **Uning qismlari doim birga özgarsa.** `x`, `y` va `distance_to()` ga ega `Point` ning bitta özgariş sababi bor.
- **Talablar hali kam.** Kiçik skriptda boğliq amallar bir faylda qolaveradi. Bitta maʼlumotlar bazasi bölsa ham, saqlaş va narx hisoblaş mustaqil özgarsa, ularni ajrating.
- **Kod kiçik va qisqa muddatli bölsa,** masalan bir marta işga tuşiriladigan 50 qatorli skript.

Özgarişni kim, nima sababdan söraşini aytib köring. `OrderManager` kabi keng nomli klassning vazifasi noaniq bölsa, unga boğliq bölmagan işlar ham qöşilib ketadi.

## Özingiz sinab köring

Çegirma qoidasini özgartiring (masalan, $300 dan oşsa 15%) va boşqa heç narsani tahrirlaş kerak emasligiga eʼtibor bering.

<ClientOnly><PythonPlayground :code='"class PriceCalculator:\n    @staticmethod\n    def total(prices: list[float]) -> float:\n        return sum(prices)\n\nclass DiscountApplier:\n    @staticmethod\n    def apply(total: float) -> float:\n        if total > 200:\n            return total * 0.9\n        return total\n\nclass OrderRepository:\n    @staticmethod\n    def save(total: float) -> None:\n        print(f\"[DB] Buyurtma saqlanmoqda, jami: ${total:.2f}\")\n\nfor prices in [[50.0], [75.0, 150.0], [120.0, 250.0]]:\n    total = DiscountApplier.apply(PriceCalculator.total(prices))\n    OrderRepository.save(total)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. `__init__` içiga yaşirilgan nojöya taʼsir

```python
class Order:
    def __init__(self, total: float) -> None:
        self.total = total
        print(f"[DB] Buyurtma saqlanmoqda, jami: ${total:.2f}")   # Yomon: saqlaş ikkinçi vazifa

orders = [Order(t) for t in (20.0, 35.5)]   # faqat hisobot uçun
print(len(orders), "ta buyurtma yaratildi")
```

```text
[DB] Buyurtma saqlanmoqda, jami: $20.00
[DB] Buyurtma saqlanmoqda, jami: $35.50
2 ta buyurtma yaratildi
```

Hisobot yoki test uçun obyekt yaratiş heç narsa yozmasligi kerak. **Tuzatiş:** konstruktor faqat obyektni tayyorlasin, saqlaş esa `OrderRepository.save(order)` kabi aniq çaqiruv bilan bajarilsin.

### 2. Har bir metod uçun alohida klass

```python
from dataclasses import dataclass

@dataclass
class Item:
    price: float
    quantity: int

    @property
    def total(self) -> float:       # Yaxşi: mahsulot öz summasini biladi
        return self.price * self.quantity

class ItemTotalCalculator:          # Yomon: Item ga tegişli bitta qator uçun butun klass
    @staticmethod
    def total(item: Item) -> float:
        return item.price * item.quantity

mouse = Item(50.00, 3)
print(mouse.total, ItemTotalCalculator.total(mouse))
```

```text
150.0 150.0
```

Har bir metod uçun klass oçiş bitta talabga xizmat qiladigan kodni yoyib yuboradi. Ikki qism ayni sababga köra birga özgarsa, ularni yonma-yon saqlaşni öylab köring.

## Maşqlar

### 1. Çop etişni ajratib çiqaring <Difficulty level="1" />

`Student` klassi ism va baholarni saqlaydi, `average()` ni hisoblaydi va `ISM: ÖRTAÇA` ni bitta kasr xonasi bilan çop etadigan `print_report()` metodiga ham ega. Çop etişni `ReportPrinter.show(student)` statik metodiga köçiring, şunda yangi körinişdagi hisobot `Student` ga tegmaydi. Aziza `[5, 4, 5]` va Bobur `[3, 4, 4]` uçun hisobotlarni çop eting.

::: details Yeçim
```python
class Student:
    def __init__(self, name: str, grades: list[int]) -> None:
        self.name = name
        self.grades = grades

    def average(self) -> float:
        return sum(self.grades) / len(self.grades)

class ReportPrinter:
    @staticmethod
    def show(student: Student) -> None:
        print(f"{student.name}: {student.average():.1f}")

for student in [Student("Aziza", [5, 4, 5]), Student("Bobur", [3, 4, 4])]:
    ReportPrinter.show(student)
```

```text
Aziza: 4.7
Bobur: 3.7
```
:::

### 2. Yangi çegirma qoidasi <Difficulty level="1" />

Marketing qoidani özgartiradi: summa $300 dan oşsa 15%, $200 dan oşsa 10% çegirma. `DiscountApplier` ni qayta yozing va 150, 250 hamda 400 uçun natijani çop eting. Darsdagi qaysi boşqa klasslarni özgartiriş kerak böldi?

::: details Yeçim
```python
class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 300:
            return total * 0.85
        if total > 200:
            return total * 0.9
        return total

for total in [150, 250, 400]:
    print(f"${DiscountApplier.apply(total):.2f}")
```

```text
$150.00
$225.00
$340.00
```

Heç qaysi: `Order`, `PriceCalculator` va `OrderRepository` avvalgidek qoladi.
:::

### 3. Yangiliklarga obunani ajratiş <Difficulty level="2" />

`Newsletter.subscribe(email)` metodi manzilda `@` borligini tekşiradi, uni röyxatga qöşadi va xuş kelibsiz xabarini tuzadi. `is_valid(email)` va `welcome(email)` ni, şuningdek ulardan foydalanib xuş kelibsiz matnini yoki `notöğri manzil: EMAIL` ni qaytaradigan `subscribe(subscribers, email)` ni yozing. `aziza@mail.uz` va `bobur-at-mail` ni obuna qiling, har bir natijani, keyin röyxatni çop eting.

::: details Yeçim
```python
def is_valid(email: str) -> bool:
    return "@" in email

def welcome(email: str) -> str:
    name = email.split("@")[0]
    return f"Xuş kelibsiz, {name}!"

def subscribe(subscribers: list[str], email: str) -> str:
    if not is_valid(email):
        return f"notöğri manzil: {email}"
    subscribers.append(email)
    return welcome(email)

subscribers: list[str] = []
for email in ["aziza@mail.uz", "bobur-at-mail"]:
    print(subscribe(subscribers, email))
print(subscribers)
```

```text
Xuş kelibsiz, aziza!
notöğri manzil: bobur-at-mail
['aziza@mail.uz']
```

Endi qattiqroq tekşiruv faqat `is_valid` ni özgartiradi.
:::

### 4. Qoidani bazasiz test qiling <Difficulty level="2" />

Töğri yondaşuvdagi `DiscountApplier` ni köçirib oling va `assert` bilan tekşiring: 200 ga çegirma berilmaydi, 300 esa 270 ga, 1000 esa 900 ga aylanadi. `barça tekşiruvlar ötdi` deb çop eting. Notöğri yondaşuvdagi `Order` bilan xuddi şu tekşiruvlar nega noqulay bölardi?

::: details Yeçim
```python
class DiscountApplier:
    @staticmethod
    def apply(total: float) -> float:
        if total > 200:
            return total * 0.9
        return total

assert DiscountApplier.apply(200) == 200
assert DiscountApplier.apply(300) == 270
assert DiscountApplier.apply(1000) == 900
print("barça tekşiruvlar ötdi")
```

```text
barça tekşiruvlar ötdi
```

U yerda qoida `Order.__init__` içida işlaydi, u esa saqlaşni ham bajaradi, şuning uçun har bir tekşiruv bazaga buyurtma yozadi.
:::

### 5. Ikki formatdagi hisobot <Difficulty level="3" />

`report(lines)` funksiyasi `"ERROR disk töldi"` kabi log qatorlarini tahlil qiladi, ularni daraja (level) böyiça sanaydi va saralangan `LEVEL: N` qatorlarini qaytaradi, hammasini bitta siklda. Uni `parse_level(line)`, `count_levels(levels)` va `format_text(counts)` körinişida yozing. Keyin şu uçtasini tahrirlamasdan `json.dumps(..., sort_keys=True)` dan foydalanadigan `format_json(counts)` ni qöşing. `["ERROR disk töldi", "INFO işga tuşdi", "ERROR vaqt tugadi"]` uçun ikkala hisobotni çop eting.

::: details Yeçim
```python
import json
from collections import Counter

def parse_level(line: str) -> str:
    return line.split()[0]

def count_levels(levels: list[str]) -> dict[str, int]:
    return dict(Counter(levels))

def format_text(counts: dict[str, int]) -> str:
    return "\n".join(f"{level}: {n}" for level, n in sorted(counts.items()))

def format_json(counts: dict[str, int]) -> str:
    return json.dumps(counts, sort_keys=True)

lines = ["ERROR disk töldi", "INFO işga tuşdi", "ERROR vaqt tugadi"]
counts = count_levels([parse_level(line) for line in lines])
print(format_text(counts))
print(format_json(counts))
```

```text
ERROR: 2
INFO: 1
{"ERROR": 2, "INFO": 1}
```

Uçinçi format - yana bitta funksiya, xolos.
:::

## Xulosa

- Klassning **bitta özgariş sababi** bölişi kerak: talablarning bitta manbai.
- Hisoblaydigan, qoidalarni qöllaydigan va saqlaydigan klass uçta vazifani aralaştiradi, ulardan biridagi özgariş qolganlarini xavf ostiga qöyadi.
- Metod böyiça emas, **özgariş sababi** böyiça ajrating: `PriceCalculator`, `DiscountApplier`, `OrderRepository` va maʼlumotlarni özida tutadigan `Order`.
- Pythonda bu ajratiş köpinça **alohida modullardagi funksiyalar** böladi, ularni oddiy `assert` bilan test qiliş mumkin.
- Birga özgaradigan narsalarni birga saqlang; heç kim söramagan talablar uçun ajratmang.

## Qöşimça manbalar

- [Robert C. Martin: The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
- [Python qöllanmasi: Modullar](https://docs.python.org/3/tutorial/modules.html)
- [`dataclasses`: dataclasslar](https://docs.python.org/3/library/dataclasses.html)
- [Pythonda SOLID tamoyillari: manba misollar](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/01-srp)
