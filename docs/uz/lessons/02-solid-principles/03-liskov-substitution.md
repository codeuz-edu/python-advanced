---
title: Liskov Substitution tamoyili
description: "Töğri törtburçak va kvadrat misolida voris tur asosiy tur örnini qaçon bosa olişini köramiz."
---

# Liskov Substitution tamoyili

::: tip Nimalarni örganasiz
- **Örnini bosa oliş** (substitutable) nimani anglatadi va tamoyil qaysi xatolarning oldini oladi
- Nega `Square(Rectangle)` avval işlab turgan kodni buzadi
- `Square` qöşilganda mavjud kod özgarmasligi uçun iyerarxiyani qanday tuzatiş
- Pythonda bu qoida **duck typing, signaturalar va özgarmas klasslarga** qanday taalluqli
- Qaçon umumiy asosiy klass umuman kerak emas
:::

## Nega bu muhim

Funksiya `Rectangle` qabul qilsa, şu tur uçun belgilangan amallarga tayana oladi. Kenglik bilan balandlikni alohida özgartiriş mumkin bölsa, voris klass ham şu qoidaga amal qilişi kerak. Tomonlarini birga özgartiradigan kvadrat bu kelishuv buzilganda nima bölişini körsatadi.

## Tamoyil

> Quyi turlar (subtypeʼlar) asosiy turlar (base typeʼlar) **örnida işlatilganda** dasturning töğri işlaşiga taʼsir qilmasligi kerak.

Voris tur çaqiruvçi tayangan qoidalarni saqlaydi. U asosiy tur qabul qiladigan qiymatlarni qabul qiladi, uning natija haqidagi vaʼdalarini bajaradi va holatining yöl qöyilgan özgarişlariga amal qiladi. Bunday kelishuv umumiy ota klassi bölmagan, bir xil metodlarga ega obyektlarga ham tegişli.

## Notöğri yondaşuv

<SolidLspViolation />

`Rectangle` width va heightʼni mustaqil ravişda örnatişga imkon beradi. `Square` undan meros oladi va tomonlari teng bölib qolişi uçun ikkala setterʼni ham override qiladi:

```python
class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self._width = width
        self._height = height

    def set_width(self, width: float) -> None:
        self._width = width

    def set_height(self, height: float) -> None:
        self._height = height

    def area(self) -> float:
        return self._width * self._height

class Square(Rectangle):
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

    def set_width(self, width: float) -> None:
        self._width = width
        self._height = width  # nojöya taʼsir: Rectangle şartnomasini buzadi

    def set_height(self, height: float) -> None:
        self._width = height  # nojöya taʼsir: Rectangle şartnomasini buzadi
        self._height = height

def resize_rectangle(rect: Rectangle, width: float, height: float) -> float:
    rect.set_width(width)
    rect.set_height(height)
    expected = width * height
    actual = rect.area()
    assert actual == expected, f"LSP buzildi! {expected} kutilgandi, {actual} çiqdi"
    return actual

print(f"Rectangle: {resize_rectangle(Rectangle(2, 3), 5, 10)}")
try:
    print(f"Square: {resize_rectangle(Square(5), 5, 10)}")
except AssertionError as error:
    print(f"Square: {error}")
```

```text
Rectangle: 50
Square: LSP buzildi! 50 kutilgandi, 100 çiqdi
```

**Özgariş talabi:** çizmaçilik ilovasiga kvadratlar kerak, `resize_rectangle` esa allaqaçon bor va töğri törtburçaklar bilan test qilingan. Geometriyaga köra kvadrat töğri törtburçak, şuning uçun `Square(Rectangle)` tabiiy körinadi. Lekin `set_height(10)` widthʼni ham özgartirdi: yuza 50 emas, 100 çiqdi. Kvadrat tomonlarini teng saqlaşi kerak; klass faqat `Rectangle` *sifatida* notöğri, çunki `Rectangle` `set_height` widthʼga tegmasligini vaʼda qiladi. Bu dizayn içidagi har qanday tuzatiş yomon: ölçamni özgartiradigan har bir funksiyada `isinstance(rect, Square)` tekşiruvi yoki heç narsani vaʼda qilmaydigan `Rectangle`.

## Töğri yondaşuv

<SolidLspFix />

Ikkala klass ham umumiy `Shape` abstraksiyasidan meros oladi, u esa faqat ikkalasi bajara oladigan narsani vaʼda qiladi: `area()`.

```python
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

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side**2

def print_area(shape: Shape) -> None:
    print(f"{type(shape).__name__}: yuza = {shape.area():.2f}")

shapes: list[Shape] = [Rectangle(5, 10), Square(7)]
for s in shapes:
    print_area(s)
```

```text
Rectangle: yuza = 50.00
Square: yuza = 49.00
```

`Shape` faqat `area()` ni vaʼda qiladi. Ikkala voris ham şu metodni bera oladi. Töğri törtburçakning ölçamini özgartiradigan funksiya hamon `Rectangle` qabul qiladi. Turlarni oldindan tekşiradigan vosita unga alohida `Square` obyekti uzatilganini aniqlay oladi.

## Kundalik Python kodida

**Duck typing ham şu qoidaga böysunadi.** "Fayl" kutadigan funksiya kerakli metodlari bor istalgan obyektni qabul qiladi, demak örnini bosiş baribir saqlanişi kerak. `io.StringIO` `json.dump` yoki `print(..., file=...)` ga kerak bölgan hamma narsada matnli fayl kabi işlaydi, şuning uçun testlar 1-maşqdagidek haqiqiy fayl örniga uni uzatadi.

**Metodning parametrlari ham kelishuvning bir qismi.** Voris metod qöşimça ixtiyoriy parametr qabul qilişi yoki mosroq, aniq turdagi natija qaytarişi mumkin. Asosiy metodda yöq argumentni majburiy qilsak, eski çaqiruvlar buziladi. Buni turlarni tekşiruvçi vosita topadi. Xatti-harakat haqidagi qoidalarni esa test bilan tekşiramiz.

**Yangi obyekt qaytariş muammoni yeçişi mumkin.** Bu misolda `resized()` yangi `Rectangle` qaytaradi va asl ölçamlarga tegmaydi. `Square` ham şu qoidani bajara oladi.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Rectangle:
    width: float
    height: float

    def area(self) -> float:
        return self.width * self.height

    def resized(self, width: float, height: float) -> "Rectangle":
        return Rectangle(width, height)

class Square(Rectangle):
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

for shape in [Rectangle(2, 3), Square(5)]:
    print(shape, "->", shape.resized(5, 10).area())
```

```text
Rectangle(width=2, height=3) -> 50
Square(width=5, height=5) -> 50
```

Natijada ölçamlari 5 va 10 bölgan töğri törtburçak hosil böladi. Asl kvadratning tomonlari 5 ligiça qoladi.

## Qaçon qöllamaslik kerak

Çaqiruvçiga turli obyektlar bilan bir xil qoida böyiça işlaş kerak bölsa, umumiy tur bering. Bu qoida çaqiruvçi kuzata oladigan va tayanadigan natijalarni belgilaydi. İçki algoritmni belgilaş shart emas.

- **Heç qaçon bir-birining örnida işlatilmaydigan narsalar uçun asosiy klass öylab topmang.** Heç bir funksiya "istalgan şakl" ni qabul qilmasa, `Rectangle` va `Square` ga umumiy asosiy klass kerak emas.
- **Har bir tafsilotni şartnoma deb hisoblamang.** Subklass işni *qanday* bajarişini özgartirişi mumkin: tezroq algoritm, qöşimça log, aniqroq qaytariladigan tur.
- **Faqat kodni qayta işlatiş uçun meros olsangiz,** boşqa klass bölişdan köra uning obyektini özida saqlaşni afzal köring (*Kompozitsiya yoki vorislik?*).

## Özingiz sinab köring

Tekşiruvni işga tuşiring, keyin `Square` dagi ikkala overrideʼni öçirib, yana işga tuşiring. Tekşiruv ötadi, lekin obyekt hali ham kvadratmi?

<ClientOnly><PythonPlayground :code='"class Rectangle:\n    def __init__(self, width: float, height: float) -> None:\n        self._width = width\n        self._height = height\n\n    def set_width(self, width: float) -> None:\n        self._width = width\n\n    def set_height(self, height: float) -> None:\n        self._height = height\n\n    def area(self) -> float:\n        return self._width * self._height\n\nclass Square(Rectangle):\n    def __init__(self, side: float) -> None:\n        super().__init__(side, side)\n\n    def set_width(self, width: float) -> None:\n        self._width = self._height = width\n\n    def set_height(self, height: float) -> None:\n        self._width = self._height = height\n\ndef check(rect: Rectangle) -> str:\n    rect.set_width(4)\n    rect.set_height(5)\n    return \"töğri\" if rect.area() == 20 else f\"buzildi, yuza {rect.area()}\"\n\nfor shape in [Rectangle(1, 1), Square(1)]:\n    print(type(shape).__name__, check(shape))"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Meros qilib olingan metodni rad etadigan subklass

```py
class Account:
    def withdraw(self, amount: int) -> str:
        return f"{amount} yeçildi"

class Deposit(Account):
    def withdraw(self, amount: int) -> str:     # Yomon: asosiy klass bu işlaşini vaʼda qilgan
        raise NotImplementedError("omonat bir yilga yopilgan")

for account in [Account(), Deposit()]:
    print(account.withdraw(100))
```

```text
100 yeçildi
NotImplementedError: omonat bir yilga yopilgan
```

`Account` uçun yozilgan kod hisobdan pul yeçiş mumkin deb hisoblaydi. Pul yeçiş amalini şu imkoniyatga ega hisoblarning turiga köçiring. [Interface Segregation](/uz/lessons/interface-segregation) darsida bu fikr batafsil yoritiladi.

### 2. Signaturasi boşqaça override

```py
class Shape:
    def area(self) -> float:
        return 0.0

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius

    def area(self, digits: int) -> float:       # Yomon: asosiy klassda argument yöq
        return round(3.14159 * self.radius**2, digits)

for shape in [Shape(), Circle(2)]:
    print(shape.area())
```

```text
0.0
TypeError: Circle.area() missing 1 required positional argument: 'digits'
```

**Tuzatiş:** yangi parametrga standart qiymat bering, `digits: int = 2`, şunda asosiy klassda işlaydigan har bir çaqiruv subklassda ham işlaydi.

### 3. Boşqa tur qaytariş

```py
class Shape:
    def area(self) -> float:
        return 49.0

class Triangle(Shape):
    def area(self) -> str:  # çaqiruvçi son kutadi
        return "24.0 cm2"

print(sum(shape.area() for shape in [Shape(), Triangle()]))
```

```text
TypeError: unsupported operand type(s) for +: 'float' and 'str'
```

`sum()` son kutadi, lekin şakllardan biri satr qaytaradi. `area()` dan son qaytaring. Ölçov birligini natijani körsatayotganda qöşing.

## Maşqlar

### 1. Fayl örnini bosuvçi <Difficulty level="1" />

Har bir qatorni `"\n"` bilan birga `file.write` orqali yozadigan `write_report(lines, file)` ni yozing. Haqiqiy fayl örniga `io.StringIO` uzating va `["Rectangle 50", "Square 49"]` uçun nima yozilganini çop eting.

::: details Yeçim
```python
import io

def write_report(lines: list[str], file: io.TextIOBase) -> None:
    for line in lines:
        file.write(line + "\n")

buffer = io.StringIO()
write_report(["Rectangle 50", "Square 49"], buffer)
print(buffer.getvalue(), end="")
```

```text
Rectangle 50
Square 49
```
:::

### 2. Signaturani tuzating <Difficulty level="1" />

`Notifier.send(message)` `log: XABAR` ni qaytaradi. Uning subklassi `SmsNotifier` da `send(self, message, phone)` bor, şuning uçun har bir notifierda `send(message)` ni çaqiriş xato beradi. `phone` ni `SmsNotifier.__init__` ga köçiring va `Buyurtma jönatildi` xabarini `Notifier()` hamda `SmsNotifier("+998901234567")` orqali yuboring.

::: details Yeçim
```python
class Notifier:
    def send(self, message: str) -> str:
        return f"log: {message}"

class SmsNotifier(Notifier):
    def __init__(self, phone: str) -> None:
        self.phone = phone

    def send(self, message: str) -> str:
        return f"SMS ({self.phone}): {message}"

for notifier in [Notifier(), SmsNotifier("+998901234567")]:
    print(notifier.send("Buyurtma jönatildi"))
```

```text
log: Buyurtma jönatildi
SMS (+998901234567): Buyurtma jönatildi
```
:::

### 3. Vaʼdasini bajaradigan hisoblar <Difficulty level="2" />

1-xatoni balanslar bilan tuzating: `Account` faqat `balance` ni saqlaydi, `WithdrawableAccount(Account)` `withdraw` ni qöşadi, `Deposit` esa `Account` dan meros oladi. Har bir hisobdan 100 yeçadigan `pay_bills(accounts)` ni yozing. Uni `WithdrawableAccount(500)` bilan işga tuşiring, keyin uning va `Deposit(1000)` ning balansini çop eting.

::: details Yeçim
```python
class Account:
    def __init__(self, balance: int) -> None:
        self.balance = balance

class WithdrawableAccount(Account):
    def withdraw(self, amount: int) -> None:
        self.balance -= amount

class Deposit(Account):
    pass

def pay_bills(accounts: list[WithdrawableAccount]) -> None:
    for account in accounts:
        account.withdraw(100)

current, deposit = WithdrawableAccount(500), Deposit(1000)
pay_bills([current])
print(current.balance, deposit.balance)
```

```text
400 1000
```

Endi tur tekşiruvçisi `pay_bills([deposit])` ni rad etadi.
:::

### 4. Çegirmalar uçun şartnoma testi <Difficulty level="2" />

Har bir `Discount.apply(total)` 0 bilan `total` orasidagi natijani vaʼda qiladi. 0, 50 va 250 summalarini sinab köradigan va `töğri` yoki `JAMI da buzildi` ni qaytaradigan `check(discount)` ni yozing. Uni `FlatFifty` (`total - 50` ni qaytaradi) va `SafeFlatFifty` (heç qaçon 0 dan pastga tuşmaydi) bilan işga tuşiring.

::: details Yeçim
```python
class Discount:
    def apply(self, total: float) -> float:
        return total

class FlatFifty(Discount):
    def apply(self, total: float) -> float:
        return total - 50

class SafeFlatFifty(Discount):
    def apply(self, total: float) -> float:
        return max(total - 50, 0)

def check(discount: Discount) -> str:
    for total in [0, 50, 250]:
        if not 0 <= discount.apply(total) <= total:
            return f"{total} da buzildi"
    return "töğri"

for discount in [FlatFifty(), SafeFlatFifty()]:
    print(type(discount).__name__, check(discount))
```

```text
FlatFifty 0 da buzildi
SafeFlatFifty töğri
```
:::

### 5. Çegarani şartnomaning bir qismi qiling <Difficulty level="3" />

`Shipping.cost(weight)` istalgan vaznni qabul qiladi va `5 + weight` ni qaytaradi. `Courier(Shipping)` `10 + 2 * weight` ni qaytaradi, lekin 20 kg dan oşsa `ValueError` çaqiradi, şuning uçun 25 kg uçun barça variantlar narxini hisoblaş xato beradi. `max_weight` ni qöşing (`Shipping` da `math.inf`, `Courier` da 20) va vaznni qabul qiladigan variantlar uçun `NOM: NARX` ni qaytaradigan `quotes(options, weight)` ni yozing. 3 va 25 kg uçun narxlarni çop eting.

::: details Yeçim
```python
import math

class Shipping:
    max_weight = math.inf

    def cost(self, weight: float) -> float:
        return 5 + weight

class Courier(Shipping):
    max_weight = 20

    def cost(self, weight: float) -> float:
        if weight > self.max_weight:
            raise ValueError("kuryer uçun juda oğir")
        return 10 + 2 * weight

def quotes(options: list[Shipping], weight: float) -> list[str]:
    return [f"{type(o).__name__}: {o.cost(weight)}" for o in options if weight <= o.max_weight]

options = [Shipping(), Courier()]
print(quotes(options, 3))
print(quotes(options, 25))
```

```text
['Shipping: 8', 'Courier: 16']
['Shipping: 30']
```

Kuryer hali ham oğir yuklarni rad etadi, lekin endi asosiy klassning özi çegara bölişi mumkinligini aytadi va çaqiruvçilar bunga tayanadi.
:::

## Xulosa

- Subklass **örnini bosa olişi** kerak: asosiy klass uçun yozilgan kod subklass bilan ham işlayveradi.
- Setterʼlari boğlangan `Square(Rectangle)` töğri törtburçakning vaʼdasini buzadi.
- Iyerarxiyani tuzating: umumiy `Shape` faqat barça şakllar bajaradigan narsani vaʼda qiladi, `Square` esa `Rectangle` bölişdan töxtaydi.
- **Signatura va qaytariladigan turlarni** mos saqlang; ularni mypy, xatti-harakatni esa testlar tekşiradi.
- Duck typing ham şu qoidaga böysunadi; özgarmas klasslar köp buzilişlarning oldini oladi.

## Qöşimça manbalar

- [Barbara Liskov va Jeannette Wing: A Behavioral Notion of Subtyping](https://dl.acm.org/doi/10.1145/197320.197383)
- [mypy: Overriding statically typed methods](https://mypy.readthedocs.io/en/stable/class_basics.html#overriding-statically-typed-methods)
- [`io.StringIO`](https://docs.python.org/3/library/io.html#io.StringIO)
- [Pythonda SOLID tamoyillari: manba misollar](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/03-lsp)
