---
title: Dependency Inversion tamoyili
description: "Tölov obyektini protsessorga taşqaridan uzatamiz va tölovlarni qayd etadigan obyekt bilan testlaymiz."
---

# Dependency Inversion tamoyili

::: tip Nimalarni örganasiz
- **Dependency Inversion tamoyili** (DIP) nima deydi, **yuqori darajadagi** va **quyi darajadagi** kod nimani anglatadi
- Nega boğliqlikni `__init__` içida yaratiş uni **qattiq boğlab qöyadi** (hard-wired)
- **Dependency injection** boğliqlikni qanday taşqaridan uzatadi va nega bu testlaşni osonlaştiradi
- `abc.ABC`, `typing.Protocol` yoki oddiy funksiya qanday qilib abstraksiya vazifasini bajaradi
- Bitta implementatsiyali abstraksiya qaçon **ortiqça kod** böladi
:::

## Nega bu muhim

Buyurtma kodi tölovni qaçon bajarişni biladi. Tölov xizmati kartadan pul yeçişni yoki naqd tölovni qayd etişni biladi. Buyurtma kodi xizmatni özi yaratsa, xizmat almaşganda buyurtma kodi ham özgaradi. Unga kerakli tölov amalini bering, xizmatni esa dastur qismlarini ulayotganda tanlang.

## Tamoyil

> Yuqori darajadagi modullar quyi darajadagi modullarga boğliq bölmasligi kerak. Ikkalasi ham **abstraksiyalarga** boğliq bölişi kerak. Abstraktsiyalar tafsilotlarga boğliq bölmasligi kerak. Tafsilotlar abstraksiyalarga boğliq bölişi kerak.

Umumiy qoidani çaqiruvçi kodning ehtiyojiga qarab belgilaymiz. Bu yerda protsessorga `pay(amount)` kerak. Har bir tölov xizmati şu amalni bajaradi. Protsessor uni xizmat klassini bilmasdan çaqira oladi.

## Notöğri yondaşuv

<SolidDipViolation />

```python
class CreditCardPayment:
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} kredit karta bilan tölanmoqda")

class PaymentProcessor:
    def __init__(self) -> None:
        self.payment = CreditCardPayment()  # qattiq boğliqlik

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

processor = PaymentProcessor()
processor.process(150.00)
```

```text
$150.00 kredit karta bilan tölanmoqda
```

`PaymentProcessor` `CreditCardPayment` klassini nomi bilan biladi va undan özi obyekt yaratadi. Çaqiruvçi boşqa tölov obyektini uzatişi uçun parametr yöq.

**Özgariş talabi:** dökon naqd pul qabul qila boşlaydi. Buning yagona yöli `PaymentProcessor` ning özini tahrirlaş:

```python
class CreditCardPayment:
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} kredit karta bilan tölanmoqda")

class CashPayment:
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} naqd pul bilan tölanmoqda")

class PaymentProcessor:
    def __init__(self, method: str = "card") -> None:    # tahrirlandi
        if method == "card":
            self.payment = CreditCardPayment()
        elif method == "cash":
            self.payment = CashPayment()
        else:
            raise ValueError(f"nomaʼlum tölov usuli: {method}")

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

PaymentProcessor("cash").process(150.00)
```

```text
$150.00 naqd pul bilan tölanmoqda
```

Har bir yangi tölov usuli protsessorga yana bir şart qöşadi. Test obyekt yaratişni nazorat qiliş uçun hamon protsessor modulidagi nomni almaştirişi kerak.

## Töğri yondaşuv

`Payment` abstraksiyasini qöşing: u protsessorga nima kerakligini, yaʼni `pay(amount)` metodi bor biror obyektni bildiradi. Protsessor uni özi yaratmaydi, konstruktor orqali qabul qiladi. Boğliqlikni şunday taşqaridan uzatiş **dependency injection** deyiladi.

<SolidDipFix />

```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class CashPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} naqd pul bilan tölanmoqda")

class CreditCardPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} kredit karta bilan tölanmoqda")

class CryptoPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} kriptovalyuta bilan tölanmoqda")

class PaymentProcessor:
    def __init__(self, payment: Payment) -> None:
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

for method in (CashPayment(), CreditCardPayment(), CryptoPayment()):
    processor = PaymentProcessor(method)
    processor.process(150.00)
```

```text
$150.00 naqd pul bilan tölanmoqda
$150.00 kredit karta bilan tölanmoqda
$150.00 kriptovalyuta bilan tölanmoqda
```

Naqd tölov uçun çaqiruvçi `CashPayment` yaratib, uni `PaymentProcessor` ga uzatadi. Karta va naqd tölov klasslari `Payment` qoidasiga mos. Boşqa xizmatlarni ham şu tariqa ulaş mumkin.

Aniq klasslarning nomi obyektlarni yaratib ulaydigan kodda turadi. Odatda bu kod dasturning boşlaniş joyiga yaqin böladi.

## Soxta obyekt bilan testlaş

Dependency injection foydasi avvalo testlarda körinadi. Test protsessorga tölovni amalga oşirmasdan, faqat yozib boradigan soxta obyekt beradi. *Testlaşni çuqurroq örganiş* darsidagi mocklar ortidagi ğoya ham şu:

```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class PaymentProcessor:
    def __init__(self, payment: Payment) -> None:
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

class FakePayment(Payment):
    def __init__(self) -> None:
        self.paid: list[float] = []

    def pay(self, amount: float) -> None:
        self.paid.append(amount)

fake = FakePayment()
processor = PaymentProcessor(fake)
processor.process(150.00)
processor.process(80.50)
assert fake.paid == [150.00, 80.50]
print("test ötdi:", fake.paid)
```

```text
test ötdi: [150.0, 80.5]
```

Bu misolda tölov summasi röyxatga yoziladi. Obyektni özi yaratadigan variantda test xizmat klassining nomini protsessor qidiradigan joyda almaştira oladi.

## Kundalik Python kodida

Boğliqlikni uzatiş uçun konstruktor parametri yetarli. Kutilgan amalni abstrakt klass, protokol yoki funksiya parametrlari bilan belgilay olamiz.

- **`Protocol`** (xuddi şu `pay` metodi bilan `class Payment(Protocol)`) asosiy klass talab qilmaydi, şuning uçun boşqa kutubxonadagi tölov klassi heç narsadan meros olmasdan mos keladi.
- **Funksiya** eng kiçik abstraksiya. Boğliqlikning bitta metodi bölsa, funksiyaning özini uzating:

```python
from typing import Callable

def pay_in_cash(amount: float) -> None:
    print(f"${amount:.2f} naqd pul bilan tölanmoqda")

class PaymentProcessor:
    def __init__(self, pay: Callable[[float], None]) -> None:
        self.pay = pay

    def process(self, amount: float) -> None:
        self.pay(amount)

PaymentProcessor(pay_in_cash).process(150.00)
PaymentProcessor(lambda amount: print(f"test {amount} ni kördi")).process(9.99)
```

```text
$150.00 naqd pul bilan tölanmoqda
test 9.99 ni kördi
```

Odatiy tölov usulini dastur qismlarini ulaydigan joyda tanlang. Masalan, çaqiruvçi usul belgilamaganida yaratuvçi funksiya `PaymentProcessor(CreditCardPayment())` ni qaytaradi.

## Qaçon qöllamaslik kerak

Xizmatlar qoidalardan mustaqil özgarsa, bir neça xizmatdan foydalanilsa yoki testga örinbosar kerak bölsa, umumiy interfeys foydali. Barqaror yordamçi funksiyani esa köpinça bevosita çaqiriş mumkin.

- **Barqaror, arzon va deterministik boğliqliklar.** `math`, `json` va özingizning sof yordamçi funksiyalaringiz almaştirilmaydi. `json.dumps` ni `Serializer` interfeysiga örab qöyiş uni faqat yaşiradi.
- **Bitta implementatsiya, soxta obyekt kerak emas.** Bitta voris klassli ABC öqiladigan kodni ikki barobar köpaytiradi. Konkret klassni uzating va ikkinçi implementatsiya paydo bölganda `Protocol` qöşing; dependency injection allaqaçon bor bölgani uçun bu qadam kiçik böladi.
- **Bitta modul içida.** Bir fayldagi bir-birini çaqiradigan funksiyalar orasiga heç narsa kerak emas.

## Özingiz sinab köring

Röyxatga `BankTransferPayment` ni qöşing va `PaymentProcessor` ga tegmasdan u bilan 99.90 ni tölang.

<ClientOnly><PythonPlayground :code='"from abc import ABC, abstractmethod\n\nclass Payment(ABC):\n    @abstractmethod\n    def pay(self, amount: float) -> None: ...\n\nclass CashPayment(Payment):\n    def pay(self, amount: float) -> None:\n        print(f\"${amount:.2f} naqd pul bilan tölanmoqda\")\n\nclass PaymentProcessor:\n    def __init__(self, payment: Payment) -> None:\n        self.payment = payment\n\n    def process(self, amount: float) -> None:\n        self.payment.pay(amount)\n\nfor method in [CashPayment()]:\n    PaymentProcessor(method).process(99.90)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Obyekt örniga klassni uzatiş

```py
processor = PaymentProcessor(CreditCardPayment)   # Yomon: () yöq
processor.process(150.00)
```

```text
TypeError: CreditCardPayment.pay() missing 1 required positional argument: 'amount'
```

`self.payment.pay(amount)` metodni klassning özida çaqiradi, şuning uçun `amount` `self` ning örniga tuşadi. **Tuzatiş:** obyektni uzating: `PaymentProcessor(CreditCardPayment())`.

### 2. Barça protsessorlar uçun umumiy standart obyekt

```python
class CreditCardPayment:
    def __init__(self) -> None:
        self.history: list[float] = []

    def pay(self, amount: float) -> None:
        self.history.append(amount)

class PaymentProcessor:
    def __init__(self, payment: CreditCardPayment = CreditCardPayment()) -> None:   # Yomon
        self.payment = payment

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

shop, cafe = PaymentProcessor(), PaymentProcessor()
shop.process(150.00)
print("kafe tarixi:", cafe.payment.history)
```

```text
kafe tarixi: [150.0]
```

Python standart argumentni funksiya aniqlanganda hisoblaydi. `payment` ni uzatmagan protsessorlar bitta obyektni bölişadi. Tölov obyektini argument sifatida talab qiling yoki dasturni tuzadigan funksiyada har safar yangisini yarating.

### 3. Qoidalar içida konkret klassni tekşiriş

```py
class PaymentProcessor:
    ...
    def process(self, amount: float) -> None:
        if isinstance(self.payment, CreditCardPayment):   # Yomon
            amount *= 1.02                                # karta komissiyasi
        self.payment.pay(amount)

PaymentProcessor(CreditCardPayment()).process(150.00)
```

```text
$153.00 kredit karta bilan tölanmoqda
```

Klass turini tekşiriş protsessorni yana aniq xizmatga boğlab qöyadi. Komissiyani karta xizmati belgilasa, uni şu xizmatda hisoblang. Komissiya buyurtma qoidasi bölsa, qoidaning özini argument qilib uzating.

## Maşqlar

### 1. Yuboruvçini taşqaridan uzating <Difficulty level="1" />

`OrderService` `__init__` içida `EmailSender()` ni yaratadi. Uni yuboruvçini taşqaridan qabul qiladigan qiling (`send(text)` metodi bor `Sender` protokoli), `SmsSender` ni qöşing va ikkalasi bilan 17-buyurtmani tasdiqlang.

::: details Yeçim
```python
from typing import Protocol

class Sender(Protocol):
    def send(self, text: str) -> None: ...

class EmailSender:
    def send(self, text: str) -> None:
        print(f"Email: {text}")

class SmsSender:
    def send(self, text: str) -> None:
        print(f"SMS: {text}")

class OrderService:
    def __init__(self, sender: Sender) -> None:
        self.sender = sender

    def confirm(self, order_id: int) -> None:
        self.sender.send(f"#{order_id} buyurtma tasdiqlandi")

for sender in [EmailSender(), SmsSender()]:
    OrderService(sender).confirm(17)
```

```text
Email: #17 buyurtma tasdiqlandi
SMS: #17 buyurtma tasdiqlandi
```
:::

### 2. Test uçun soxta obyekt <Difficulty level="1" />

`Checkout(payment)` ning `pay_cart(prices)` metodi yaxlitlangan yiğindini tölaydi. Uni va oxirgi summani saqlaydigan `FakePayment` ni yozing, keyin 45.00 va 15.50 dan iborat savat uçun 60.50 tölanganini `assert` bilan tekşiring.

::: details Yeçim
```python
class Checkout:
    def __init__(self, payment) -> None:
        self.payment = payment

    def pay_cart(self, prices: list[float]) -> None:
        self.payment.pay(round(sum(prices), 2))

class FakePayment:
    def __init__(self) -> None:
        self.last: float | None = None

    def pay(self, amount: float) -> None:
        self.last = amount

fake = FakePayment()
Checkout(fake).pay_cart([45.00, 15.50])
assert fake.last == 60.50
print("tölandi:", fake.last)
```

```text
tölandi: 60.5
```
:::

### 3. Funksiya uzating <Difficulty level="2" />

`send` funksiyasini (`Callable[[str], None]`) qabul qiladigan va `remind(name, event)` metodi bor `Notifier` ni yozing. Azizaga `print` bilan eslatma yuboring, keyin Boburga `outbox` röyxatining `append` metodi bilan yuboring va röyxatni çop eting.

::: details Yeçim
```python
from typing import Callable

class Notifier:
    def __init__(self, send: Callable[[str], None]) -> None:
        self.send = send

    def remind(self, name: str, event: str) -> None:
        self.send(f"{name}, unutmang: {event}")

Notifier(print).remind("Aziza", "duşanba kuni imtihon")
outbox: list[str] = []
Notifier(outbox.append).remind("Bobur", "duşanba kuni imtihon")
print(outbox)
```

```text
Aziza, unutmang: duşanba kuni imtihon
['Bobur, unutmang: duşanba kuni imtihon']
```

`outbox.append` kabi boğlangan metod (bound method) ham funksiya.
:::

### 4. Xavfsiz standart qiymat <Difficulty level="2" />

`PaymentProcessor` ga `None` bölganda yangi `CreditCardPayment` yaratadigan `payment: Payment | None = None` parametrini qöşing. Argumentsiz yaratilgan ikki protsessor turli obyektlar olişini körsating, keyin standart qiymat bilan va uzatilgan `CashPayment` bilan 20.00 ni tölang.

::: details Yeçim
```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None: ...

class CreditCardPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} kredit karta bilan tölanmoqda")

class CashPayment(Payment):
    def pay(self, amount: float) -> None:
        print(f"${amount:.2f} naqd pul bilan tölanmoqda")

class PaymentProcessor:
    def __init__(self, payment: Payment | None = None) -> None:
        self.payment = payment if payment is not None else CreditCardPayment()

    def process(self, amount: float) -> None:
        self.payment.pay(amount)

first, second = PaymentProcessor(), PaymentProcessor()
print(first.payment is second.payment)
first.process(20.00)
PaymentProcessor(CashPayment()).process(20.00)
```

```text
False
$20.00 kredit karta bilan tölanmoqda
$20.00 naqd pul bilan tölanmoqda
```
:::

### 5. Kiçik ilovani yiğiş <Difficulty level="3" />

`ReportService` savdolarni `Source` (`load()`) dan yuklaydi va xulosani `Storage` (`save(name, text)`) ga saqlaydi. Ikkala protokolni, `ListSource` ni, `MemoryStorage` ni, servisni va konkret klasslarni nomlaydigan yagona funksiya `build_app()` ni yozing. Hisobotni işga tuşiring va saqlangan maʼlumotni çop eting.

::: details Yeçim
```python
from typing import Protocol

class Source(Protocol):
    def load(self) -> list[int]: ...

class Storage(Protocol):
    def save(self, name: str, text: str) -> None: ...

class ReportService:
    def __init__(self, source: Source, storage: Storage) -> None:
        self.source = source
        self.storage = storage

    def run(self) -> None:
        sales = self.source.load()
        self.storage.save("xulosa", f"{len(sales)} ta savdo, jami {sum(sales):,}")

class ListSource:
    def __init__(self, sales: list[int]) -> None:
        self.sales = sales

    def load(self) -> list[int]:
        return self.sales

class MemoryStorage:
    def __init__(self) -> None:
        self.files: dict[str, str] = {}

    def save(self, name: str, text: str) -> None:
        self.files[name] = text

def build_app() -> tuple[ReportService, MemoryStorage]:
    storage = MemoryStorage()
    return ReportService(ListSource([120000, 45000, 80000]), storage), storage

service, storage = build_app()
service.run()
print(storage.files)
```

```text
{'xulosa': '3 ta savdo, jami 245,000'}
```

Keyinçalik maʼlumotlar bazasi yoki CSV faylga ötiş faqat `build_app` ni özgartiradi.
:::

## Xulosa

- DIP: qoidalar ham, tafsilotlar ham qoidalarga nima kerakligi asosida tuzilgan abstraksiyaga boğliq böladi.
- Boğliqlikni `__init__` içida yaratiş uni qattiq boğlab qöyadi.
- **Dependency injection** obyektni, odatda konstruktor orqali, taşqaridan uzatadi; konkret klasslarni kiriş nuqtasi yonidagi bitta joy ulaydi.
- Abstraktsiya `ABC`, `Protocol` yoki oddiy çaqiriladigan obyekt bölişi mumkin, testlarda esa uning örnini soxta obyekt bosa oladi.
- Barqaror yordamçilar va yagona implementatsiyalar uçun abstraksiya yozmang; ikkinçisi paydo bölganda qöşing.

## Qöşimça manbalar

- [`abc`: abstrakt asosiy klasslar](https://docs.python.org/3/library/abc.html)
- [`typing.Protocol`](https://docs.python.org/3/library/typing.html#typing.Protocol)
- [Çaqiriladigan obyektlarni annotatsiya qiliş](https://docs.python.org/3/library/typing.html#annotating-callable-objects)
- [`unittest.mock`](https://docs.python.org/3/library/unittest.mock.html)
- [Pythonda SOLID tamoyillari: manba misollar](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/05-dip)
