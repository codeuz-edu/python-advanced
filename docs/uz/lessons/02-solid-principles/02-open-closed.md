---
title: Open/Closed tamoyili
description: "Umumiy metod, funksiya argumenti va singledispatch yordamida yangi imkoniyat qöşamiz."
---

# Open/Closed tamoyili

::: tip Nimalarni örganasiz
- **Kengaytiriş uçun oçiq, özgartiriş uçun yopiq** nimani anglatadi
- Nega `isinstance` zanjiri har bir yangi holat uçun işlab turgan kodni tahrirlaşga majbur qiladi
- **Polimorfizm** yangi holatni boşqa joyda heç qanday tahrirsiz yangi klassga qanday aylantiradi
- Pythonça kengaytiriş nuqtalari: **`functools.singledispatch`**, argument sifatidagi funksiyalar va protokollar
- Qaçon oddiy `if` yaxşiroq tanlov böladi
:::

## Nega bu muhim

Yuzani hisoblaydigan funksiya har bir şaklni nomma-nom bilsa, uçburçak qöşilganda uni tahrirlaymiz. Şu tekşiruv çiziş yoki saqlaş kodida ham bölsa, özgariş bir neça joyga tarqaladi. Bu darsda yuza formulasini şaklga beramiz. Çaqiruvçi esa umumiy metoddan foydalanadi.

## Tamoyil

> Dasturiy tizimlar **kengaytiriş uçun oçiq**, lekin **özgartiriş uçun yopiq** bölişi kerak.

**Kengaytiriş uçun oçiq** degani kodga yangi xatti-harakat qöşiş yölini berişdir. **Özgartiriş uçun yopiq** degani şunday imkoniyat qöşilganda avvalgi kod öz joyida qolişidir. Kengaytiriş yölini kutilayotgan özgarişga qarab tanlaymiz. Yangi şakl qöşiş osonlaşsa ham, barcha şakllarga yangi amal qöşişda ularni tahrirlaşga töğri kelişi mumkin.

## Notöğri yondaşuv

<SolidOcpViolation />

`AreaCalculator` har bir şakldan uning turini söraydi:

```python
import math

class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

class AreaCalculator:
    @staticmethod
    def calculate(shape: object) -> float:
        if isinstance(shape, Rectangle):
            return shape.width * shape.height
        if isinstance(shape, Circle):
            return math.pi * shape.radius**2
        raise TypeError(f"Nomaʼlum şakl: {type(shape).__name__}")

shapes: list[object] = [Rectangle(5, 10), Circle(7)]
for s in shapes:
    print(f"{type(s).__name__}: {AreaCalculator.calculate(s):.2f}")

# Özgariş talabi: uçburçaklarni qöllab-quvvatlaş
class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

try:
    AreaCalculator.calculate(Triangle(6, 8))
except TypeError as error:
    print("Xato:", error)
```

```text
Rectangle: 50.00
Circle: 153.94
Xato: Nomaʼlum şakl: Triangle
```

**Özgariş talabi:** çizmaçilik ilovasiga uçburçaklar kerak. `Triangle` ni yoziş yetarli emas, çunki kalkulyator faqat öz zanjiridagi turlarni biladi. `AreaCalculator` ni oçib, uçinçi tarmoqni qöşişingiz va dastlabki ikkitasini qayta test qilişingiz kerak. Agar `perimeter()` va `draw()` ham turga qarab xuddi şunday tarmoqlansa, har bir yangi şakl uçalasini tahrirlaydi, ularning har biri esa har bir şaklning maydonlariga boğliq böladi.

## Töğri yondaşuv

<SolidOcpFix />

`Shape` abstrakt klassi şartnomani, yaʼni `area()` metodini belgilaydi, har bir şakl esa uni öziça amalga oşiradi:

```python
import math
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius

    def area(self) -> float:
        return math.pi * self.radius**2

class Triangle(Shape):
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

    def area(self) -> float:
        return 0.5 * self.base * self.height

def total_area(shapes: list[Shape]) -> float:
    return sum(s.area() for s in shapes)

shapes: list[Shape] = [Rectangle(5, 10), Circle(7), Triangle(6, 8)]
for s in shapes:
    print(f"{type(s).__name__}: {s.area():.2f}")
print(f"Umumiy yuza: {total_area(shapes):.2f}")
```

```text
Rectangle: 50.00
Circle: 153.94
Triangle: 24.00
Umumiy yuza: 227.94
```

`Triangle` öz formulasini beradi. `total_area` har bir şaklning `area()` metodini çaqiraveradi. Python `area()` siz voris klassni aniqlaşga ruxsat beradi. Lekin u abstrakt bölib qoladi, şuning uçun undan obyekt yaratib bölmaydi.

## Kundalik Python kodida

`sorted(items, key=...)` kundalik misol. Çaqiruvçi saralaş kalitini tanlaydigan funksiyani beradi. Saralaşning özi mos argument oladigan istalgan kalit funksiyasi bilan işlaydi.

Klassga `area()` metodini qöşa olmasangiz, `functools.singledispatch` dan foydalaning. Har bir tegişli tur uçun alohida funksiyani röyxatga kiriting. Python birinçi argumentning turiga qarab ulardan birini tanlaydi.

```python
import math
from functools import singledispatch

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

@singledispatch
def area(shape: object) -> float:
    raise TypeError(f"Nomaʼlum şakl: {type(shape).__name__}")

@area.register
def _(shape: Circle) -> float:
    return math.pi * shape.radius**2

# Keyinroq, boşqa modulda: area() ni tahrirlamasdan uçburçaklar
@area.register
def _(shape: Triangle) -> float:
    return 0.5 * shape.base * shape.height

print(f"{area(Circle(7)):.2f} {area(Triangle(6, 8)):.2f}")
```

```text
153.94 24.00
```

`register` turni birinçi parametrning type hintidan öqiydi. Duck typing tufayli `total_area` `area()` metodi bor har qanday obyekt bilan işlaydi, obyektning asosiy klassi bölişi şart emas. `typing.Protocol` bu kutilmani meros olmasdan, tur tekşiruvçilari uçun yozib qöyadi; [Interface Segregation](/uz/lessons/interface-segregation) darsiga qarang.

## Qaçon qöllamaslik kerak

- **Holatlar kam va kamdan-kam özgaradi.** Qisqa şartni öqiş osonroq bölişi mumkin. Çaqiruvçilar yangi holatni özlari qöşişi kerak bölganda kengaytiriş yölini yarating.
- **Faqat kutgan özgarişlaringizga nisbatan yopa olasiz.** `Shape` dizayni yangi şakllarni arzon qiladi, lekin `perimeter()` kabi yangi amal har bir şakl klassini tahrirlaydi; `isinstance` dizaynida esa aksinça. Haqiqatan özgaradigan yönalişni yoping.
- **Sizga tegişli, bir joyda turgan kod.** OCP boşqalar sizning kodingizni kengaytiradigan joylarda: kutubxonalar, plaginlar, umumiy modullarda eng köp foyda beradi. Kiçik ilovada funksiyani va uning testini tahrirlaş köpinça eng soddasi.

## Özingiz sinab köring

`shapes` ga `Square` yoki `Ellipse` qöşing. Boşqa heç narsani tahrirlaş kerak bölmasligi lozim.

<ClientOnly><PythonPlayground :code='"import math\nfrom abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self) -> float: ...\n\nclass Rectangle(Shape):\n    def __init__(self, width: float, height: float) -> None:\n        self.width = width\n        self.height = height\n\n    def area(self) -> float:\n        return self.width * self.height\n\nclass Circle(Shape):\n    def __init__(self, radius: float) -> None:\n        self.radius = radius\n\n    def area(self) -> float:\n        return math.pi * self.radius**2\n\nshapes: list[Shape] = [Rectangle(5, 10), Circle(7)]\nfor s in shapes:\n    print(f\"{type(s).__name__}: {s.area():.2f}\")"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. `isinstance` ni tur satriga almaştiriş

```py
class Shape:
    def __init__(self, kind: str, size: float) -> None:
        self.kind = kind
        self.size = size

def area(shape: Shape) -> float:
    if shape.kind == "kvadrat":         # Yomon: öşa zanjir, endi satrlar ustida
        return shape.size**2
    if shape.kind == "doira":
        return 3.14159 * shape.size**2
    raise ValueError(f"nomaʼlum tur: {shape.kind}")

print(area(Shape("oltiburçak", 2)))
```

```text
ValueError: nomaʼlum tur: oltiburçak
```

`kind` maydoni va `if` zanjiri baribir kengaytirişga yopiq: oltiburçak `area` ni tahrirlaşni talab qiladi. **Tuzatiş:** har bir turga `area()` metodli alohida klass bering yoki har bir turni luğat orqali funksiyaga boğlang.

### 2. Şartnomani bajarmagan subklass

```py
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Hexagon(Shape):
    def get_area(self) -> float:        # Yomon: şartnoma area() ni talab qiladi
        return 10.39

Hexagon()
```

```text
TypeError: Can't instantiate abstract class Hexagon without an implementation for abstract method 'area'
```

Misol klassdan obyekt yaratmoqçi bölganda Python yetişmayotgan abstrakt metodni körsatadi. Asosiy klassdagi metod nomi va parametrlariga mos yozing.

### 3. Öz subklasslarini tekşiradigan asosiy klass

```py
class Shape(ABC):
    def describe(self) -> str:
        if isinstance(self, Circle):    # Yomon: asosiy klass öz subklasslarini biladi
            return "dumaloq"
        return "burçakli"
```

Endi har bir yangi dumaloq şakl eng köp işlatiladigan klass, `Shape` ni tahrirlaydi. **Tuzatiş:** `Shape` ga standart `describe()` bering va `Circle` uni qayta yozsin (override).

## Maşqlar

### 1. Kvadrat qöşing <Difficulty level="1" />

Töğri yondaşuvdagi `Shape` va `total_area` dan foydalanib, `side` atributli `Square` qöşing. `total_area([Square(3), Square(4)])` ni çop eting.

::: details Yeçim
```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side**2

def total_area(shapes: list[Shape]) -> float:
    return sum(s.area() for s in shapes)

print(total_area([Square(3), Square(4)]))
```

```text
25
```
:::

### 2. Zanjir örniga luğat <Difficulty level="1" />

`shipping(kind, weight)` `if`/`elif` dan foydalanadi: kuryer 10 + har bir kg uçun 2, poçta 5 + har bir kg uçun 1 turadi. Uni har bir turdan vaznga boğliq funksiyaga olib boradigan `RATES` luğati bilan qayta yozing. `"pickup"` ni (doim 0) bitta yangi qator sifatida qöşing va har bir tur uçun 3 kg narxini çop eting.

::: details Yeçim
```python
RATES = {
    "courier": lambda weight: 10 + 2 * weight,
    "post": lambda weight: 5 + weight,
}

def shipping(kind: str, weight: float) -> float:
    return RATES[kind](weight)

RATES["pickup"] = lambda weight: 0

for kind in RATES:
    print(kind, shipping(kind, 3))
```

```text
courier 16
post 8
pickup 0
```
:::

### 3. Istalgan şaklni tasvirlaş <Difficulty level="2" />

`Circle(7)` uçun `doira r=7`, boşqa har qanday narsa uçun `nomaʼlum şakl` qaytaradigan `describe(shape)` `singledispatch` funksiyasini yozing. Keyin uning ostida `Triangle` ni aniqlang va yuqoridagi heç narsani tahrirlamasdan `uçburçak 6/8` ni röyxatdan ötkazing. `Circle(7)`, `Triangle(6, 8)` va `"oltiburçak"` uçun natijani çop eting.

::: details Yeçim
```python
from functools import singledispatch

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

@singledispatch
def describe(shape: object) -> str:
    return "nomaʼlum şakl"

@describe.register
def _(shape: Circle) -> str:
    return f"doira r={shape.radius}"

class Triangle:
    def __init__(self, base: float, height: float) -> None:
        self.base = base
        self.height = height

@describe.register
def _(shape: Triangle) -> str:
    return f"uçburçak {shape.base}/{shape.height}"

for shape in [Circle(7), Triangle(6, 8), "oltiburçak"]:
    print(describe(shape))
```

```text
doira r=7
uçburçak 6/8
nomaʼlum şakl
```
:::

### 4. Parol qoidalari maʼlumot sifatida <Difficulty level="2" />

`check(password, rules)` ni yozing: bu yerda `rules` - `(test, message)` juftlari röyxati, funksiya esa ötmagan testlarning xabarlarini qaytaradi. Ikki qoidadan boşlang: "kamida 8 ta belgi" va "raqam kerak". `check` ni tahrirlamasdan uçinçisini, "katta harf kerak" ni qöşing. `"salom"` va `"Salom2026"` uçun natijani çop eting.

::: details Yeçim
```python
def check(password: str, rules: list) -> list[str]:
    return [message for test, message in rules if not test(password)]

rules = [
    (lambda p: len(p) >= 8, "kamida 8 ta belgi"),
    (lambda p: any(c.isdigit() for c in p), "raqam kerak"),
]
rules.append((lambda p: any(c.isupper() for c in p), "katta harf kerak"))

print(check("salom", rules))
print(check("Salom2026", rules))
```

```text
['kamida 8 ta belgi', 'raqam kerak', 'katta harf kerak']
[]
```
:::

### 5. Tölov usullari <Difficulty level="3" />

`pay(method, amount)` funksiyasiga har bir tölov usuli uçun yangi `elif` qöşilib boradi: `"card"` `Karta: AMOUNT yeçib olindi` ni, `"cash"` esa `Naqd: yetkazilganda AMOUNT olinadi` ni qaytaradi. Uni `pay(amount) -> str` metodli abstrakt `PaymentMethod`, `Card` va `Cash` klasslari hamda `method.pay(total)` ni çop etadigan `checkout(total, method)` bilan almaştiring. Keyin `checkout` ni ham, boşqa klasslarni ham tahrirlamasdan `Click` ni (`Click: AMOUNT uçun tölov havolasi yuborildi`) qöşing. Har biri bilan 150 tölang.

::: details Yeçim
```python
from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount: int) -> str: ...

class Card(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Karta: {amount} yeçib olindi"

class Cash(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Naqd: yetkazilganda {amount} olinadi"

def checkout(total: int, method: PaymentMethod) -> None:
    print(method.pay(total))

class Click(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"Click: {amount} uçun tölov havolasi yuborildi"

for method in [Card(), Cash(), Click()]:
    checkout(150, method)
```

```text
Karta: 150 yeçib olindi
Naqd: yetkazilganda 150 olinadi
Click: 150 uçun tölov havolasi yuborildi
```

`checkout` faqat abstraksiyani biladi, şuning uçun keyingi usul ham yana bitta yangi klass böladi.
:::

## Xulosa

- **Kengaytiriş uçun oçiq, özgartiriş uçun yopiq:** yangi holat - yangi kod; test qilingan kodga tegilmaydi.
- `isinstance` yoki `kind` zanjiri har bir yangi tur uçun tahrirlanadi va funksiyalar böylab takrorlanadi.
- **Polimorfizm** buni tuzatadi: `area()` li `Shape` şartnomasi, har bir şakl uçun bitta subklass va faqat şartnomadan foydalanadigan çaqiruvçilar.
- Pythonda kengaytiriş nuqtalari köpinça **argument sifatidagi funksiyalar**, funksiyalar luğati, `singledispatch` yoki duck typing böladi.
- Yangi holatlar kutiladigan joyda kengaytiriş yölini yarating. Barqaror holatlarda qisqa şartni öqiş osonroq.

## Qöşimça manbalar

- [Robert C. Martin: The Open Closed Principle](https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html)
- [`abc`: abstrakt asosiy klasslar](https://docs.python.org/3/library/abc.html)
- [`functools.singledispatch`](https://docs.python.org/3/library/functools.html#functools.singledispatch)
- [Pythonda SOLID tamoyillari: manba misollar](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/02-ocp)
