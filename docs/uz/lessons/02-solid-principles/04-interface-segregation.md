---
title: Interface Segregation tamoyili
description: "Çaqiruvçiga kerakli metodlarni kiçik interfeys, abstrakt klass yoki protokol orqali beramiz."
---

# Interface Segregation tamoyili

::: tip Nimalarni örganasiz
- **Interface Segregation tamoyili** (ISP) nima deydi va u qaysi stub metodlarning oldini oladi
- **Katta interfeysni** (fat interface) `NotImplementedError` çaqiradigan metodlardan qanday taniş
- Bitta interfeysni **kiçik va aniq** interfeyslarga qanday ajratiş va ularni bitta klassda birlaştiriş
- Kundalik Python kodida `typing.Protocol` va `collections.abc` interfeyslarni qanday kiçik saqlaydi
- Interfeysni ajratiş qaçon **haddan oşadi**
:::

## Nega bu muhim

Zavodda odam ham, robot ham işlaydi. Oşxona esa odamlarga xizmat qiladi. Bitta interfeys `work()` bilan birga `eat()` ni ham talab qilsa, robotga faqat istisno kötaradigan metod yozişga töğri keladi. İş taqsimlaştiriş va ovqat beriş kodiga turli qoidalar kerak.

## Tamoyil

> Klientlar özlari **işlatmaydigan** interfeyslarga boğliq bölmasligi kerak.

Interfeys uni işlatadigan kodning ehtiyojiga mos bölsin. İş taqsimlovçiga iş metodi bor interfeysni, oşxonaga ovqatlaniş metodi bor interfeysni bering. Ikkala amal ham kerak bölgan klass ikkala interfeysni qöllay oladi.

## Notöğri yondaşuv

Zavodda odamlar va robotlar işlaydi. Birinçi dizayn işçi bajarişi mumkin bölgan hamma narsani bitta katta abstrakt klassga joylaydi:

<SolidIspViolation />

```python
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> str: ...

    @abstractmethod
    def eat(self) -> str: ...

    @abstractmethod
    def sleep(self) -> str: ...

class Human(Worker):
    def __init__(self, name: str) -> None:
        self.name = name

    def work(self) -> str:
        return f"{self.name} işlamoqda"

    def eat(self) -> str:
        return f"{self.name} ovqatlanmoqda"

    def sleep(self) -> str:
        return f"{self.name} uxlamoqda"

class Robot(Worker):
    def __init__(self, model: str) -> None:
        self.model = model

    def work(self) -> str:
        return f"Robot {self.model} işlamoqda"

    def eat(self) -> str:
        raise NotImplementedError("Robotlar ovqatlanmaydi")

    def sleep(self) -> str:
        raise NotImplementedError("Robotlar uxlamaydi")

aziza, t800 = Human("Aziza"), Robot("T-800")
print(aziza.eat())
print(t800.work())
try:
    print(t800.eat())
except NotImplementedError as error:
    print("Xato:", error)
```

```text
Aziza ovqatlanmoqda
Robot T-800 işlamoqda
Xato: Robotlar ovqatlanmaydi
```

Abstrakt metodlari qolgan klassdan Python obyekt yaratmaydi. Istisno kötaradigan `eat()` metodi qöşilsa, `Robot` obyektini yaratib böladi. Lekin `Worker.eat()` ga tayangan kod robot bilan işlamaydi. Bu [Liskov Substitution](/uz/lessons/liskov-substitution) tamoyiliga ham zid.

**Özgariş talabi:** zavod yuk yetkazadigan dronlar sotib oladi. Dron işlaydi va quvvatlanişi kerak, lekin heç qaçon ovqatlanmaydi va uxlamaydi. Yagona umumiy şartnoma - `Worker`, şuning uçun `charge()` öşa yerga qöşiladi va bu bitta qator batareyaga heç qanday aloqasi yöq klassni buzadi:

```py
class Worker(ABC):
    ...                                # work, eat, sleep avvalgidek

    @abstractmethod
    def charge(self) -> str: ...       # yangi, dronlar uçun

Human("Aziza")                         # Human özgarmagan
```

```text
TypeError: Can't instantiate abstract class Human without an implementation for abstract method 'charge'
```

`Worker` ga `charge()` qöşsak, faqat dronga kerak bölgan metod uçun eski klasslar ham özgaradi. Dron esa baribir `eat()` va `sleep()` metodlariga ega bölişi kerak böladi.

## Töğri yondaşuv

`Worker` ni undan foydalanadiganlar ajratgan çiziqlar böyiça böling: vazifa beriş uçun `work()`, oşxonaga `eat()`, tungi smenaga `sleep()` kerak. Har biri alohida interfeysga aylanadi va har bir klass faqat özi qöllaydigan interfeyslardan meros oladi:

<SolidIspFix />

```python
from abc import ABC, abstractmethod

class Workable(ABC):
    @abstractmethod
    def work(self) -> str: ...

class Eatable(ABC):
    @abstractmethod
    def eat(self) -> str: ...

class Sleepable(ABC):
    @abstractmethod
    def sleep(self) -> str: ...

class Human(Workable, Eatable, Sleepable):
    def __init__(self, name: str) -> None:
        self.name = name

    def work(self) -> str:
        return f"{self.name} işlamoqda"

    def eat(self) -> str:
        return f"{self.name} ovqatlanmoqda"

    def sleep(self) -> str:
        return f"{self.name} uxlamoqda"

class Robot(Workable):
    def __init__(self, model: str) -> None:
        self.model = model

    def work(self) -> str:
        return f"Robot {self.model} işlamoqda"

def assign_task(worker: Workable) -> None:
    print(worker.work())

assign_task(Human("Aziza"))
assign_task(Robot("T-800"))
```

```text
Aziza işlamoqda
Robot T-800 işlamoqda
```

`Robot` da birorta ham stub qolmadi. `assign_task` özi çaqiradigan metodga ega eng kiçik turni, `Workable` ni söraydi, şuning uçun odamlarni ham, robotlarni ham birdek qabul qiladi.

Dron uçun `Chargeable` interfeysini yarating. Eski işçilar öz interfeyslari bilan qoladi. Misol mustaqil işlaşi uçun `Workable` va `assign_task` bu yerda qayta berilgan.

```python
from abc import ABC, abstractmethod

class Workable(ABC):                  # özgarmagan
    @abstractmethod
    def work(self) -> str: ...

class Chargeable(ABC):                # yangi
    @abstractmethod
    def charge(self) -> str: ...

class Drone(Workable, Chargeable):    # yangi
    def __init__(self, code: str) -> None:
        self.code = code

    def work(self) -> str:
        return f"Dron {self.code} yuk yetkazmoqda"

    def charge(self) -> str:
        return f"Dron {self.code} quvvatlanmoqda"

def assign_task(worker: Workable) -> None:    # özgarmagan
    print(worker.work())

drone = Drone("D-7")
assign_task(drone)
print(drone.charge())
```

```text
Dron D-7 yuk yetkazmoqda
Dron D-7 quvvatlanmoqda
```

## Kundalik Python kodida

Abstrakt asosiy klass talab qilinadigan metodlarni meros orqali belgilaydi. Pythonda ayrim interfeyslarni metod nomlari va parametrlari orqali ham tekşiriş mumkin.

**`typing.Protocol`** çaqiruvçiga kerakli metodlarni belgilaydi. Statik tur tekşiruvi mos `work()` metodiga ega obyektni qabul qiladi. Obyektning klassi protokoldan meros olişi şart emas.

```python
from typing import Protocol

class CanWork(Protocol):
    def work(self) -> str: ...

class Volunteer:                 # asosiy klass yöq
    def work(self) -> str:
        return "Köngilli Bobur işlamoqda"

def assign_task(worker: CanWork) -> None:
    print(worker.work())

assign_task(Volunteer())
```

```text
Köngilli Bobur işlamoqda
```

**`collections.abc`** ham ISP ga amal qiladi. `Sized` ga faqat `__len__`, `Iterable` ga faqat `__iter__`, `Container` ga faqat `__contains__` kerak, `Collection` esa uçalasini birlaştiradi, xuddi `Human` `Workable`, `Eatable` va `Sleepable` ni birlaştirgani kabi.

## Qaçon qöllamaslik kerak

Interfeysni çaqiruvçi birgalikda işlatadigan amallarga qarab ajrating. Barcha mos klasslar bir neça metodni bajara olsa, ularni bitta interfeysda saqlaş qulay.

- **Har bir klass har bir metoddan foydalanadi.** Zavodda faqat odamlar işlaganda bitta `Worker` töğri bölardi. Birinçi klassga stub kerak bölganda ajrating.
- **Har bir metod uçun alohida interfeys.** Bir metodli yettita asosiy klass bitta katta interfeys kabi qiyin öqiladi; bitta çaqiruvçi birga işlatadigan metodlarni birga saqlang.
- **Bitta çaqiruvçi.** Faqat bir joyda işlatiladigan yordamçi funksiya uçun oddiy duck typing yetarli.

## Özingiz sinab köring

Tuşlik tanaffusiga `work()` va `eat()` metodlari bor `Cook` ni qöşing. Keyin robotni ham qöşing va xatoni öqing.

<ClientOnly><PythonPlayground :code='"from typing import Protocol\n\nclass CanEat(Protocol):\n    def eat(self) -> str: ...\n\nclass Human:\n    def eat(self) -> str:\n        return \"Aziza ovqatlanmoqda\"\n\nclass Robot:\n    def work(self) -> str:\n        return \"Robot T-800 işlamoqda\"\n\ndef lunch_break(eaters: list[CanEat]) -> None:\n    for eater in eaters:\n        print(eater.eat())\n\nlunch_break([Human()])"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Jimgina heç narsa qilmaydigan stub

```python
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> str: ...

    @abstractmethod
    def eat(self) -> str: ...

class Robot(Worker):
    def work(self) -> str:
        return "Robot işlamoqda"

    def eat(self) -> str:
        pass                      # Yomon: None qaytaradi

print("Tuşlik:", Robot().eat())
```

```text
Tuşlik: None
```

Vaqtinçalik metod `None` qaytaradi, çaqiruvçi esa satr kutadi. Faqat ayrim obyektlar PDF yarata olsa, ular uçun alohida interfeys bering.

### 2. Bitta interfeysni yozib, boşqasini çaqiriş

```py
def lunch_break(workers: list[Workable]) -> None:
    for worker in workers:
        print(worker.eat())       # Yomon: eat() Workable ga kirmaydi

lunch_break([Human("Aziza"), Robot("T-800")])
```

```text
Aziza ovqatlanmoqda
AttributeError: 'Robot' object has no attribute 'eat'
```

Funksiya signaturasi faqat `work()` ni vaʼda qiladi, şuning uçun çaqiruvçilar robotlarni ham uzatadi. **Tuzatiş:** metodlarini çaqirayotgan interfeysni sörang, yaʼni `list[Eatable]`; şunda tiplarni tekşiruvçi vosita robotni oldindan belgilab beradi.

### 3. Oddiy protokol bilan `isinstance`

```py
from typing import Protocol

class CanWork(Protocol):
    def work(self) -> str: ...

print(isinstance(Robot("T-800"), CanWork))
```

```text
TypeError: Instance and class checks can only be used with @runtime_checkable protocols
```

**Tuzatiş:** `typing` dan `@runtime_checkable` ni qöşing; şunda tekşiruv metodlarning signaturasini emas, faqat ular mavjudligini tasdiqlaydi.

## Maşqlar

### 1. Ofis qurilmasini ajratiş <Difficulty level="1" />

`print_doc(text)` va `scan()` metodlari bor `Machine` ABC oddiy printerni `scan()` uçun stub yozişga majbur qiladi. Uni `Printer` va `Scanner` ga ajrating, `SimplePrinter` va `OfficeCombo` ni yozing, ikkalasi bilan `"Hisob-faktura #12"` ni çop eting va `OfficeCombo` bilan skanerlang.

::: details Yeçim
```python
from abc import ABC, abstractmethod

class Printer(ABC):
    @abstractmethod
    def print_doc(self, text: str) -> str: ...

class Scanner(ABC):
    @abstractmethod
    def scan(self) -> str: ...

class SimplePrinter(Printer):
    def print_doc(self, text: str) -> str:
        return f"SimplePrinter: {text}"

class OfficeCombo(Printer, Scanner):
    def print_doc(self, text: str) -> str:
        return f"OfficeCombo: {text}"

    def scan(self) -> str:
        return "OfficeCombo: 1 sahifa skanerlandi"

for machine in [SimplePrinter(), OfficeCombo()]:
    print(machine.print_doc("Hisob-faktura #12"))
print(OfficeCombo().scan())
```

```text
SimplePrinter: Hisob-faktura #12
OfficeCombo: Hisob-faktura #12
OfficeCombo: 1 sahifa skanerlandi
```
:::

### 2. Salomlaşuvçilar uçun protokol <Difficulty level="1" />

`greet(name: str) -> str` metodi bor `Greeter` protokolini, asosiy klassi **bölmagan** ikkita salomlaşuvçini va salomni çop etadigan `welcome(greeter, name)` ni yozing. Ikkalasi bilan Azizani kutib oling.

::: details Yeçim
```python
from typing import Protocol

class Greeter(Protocol):
    def greet(self, name: str) -> str: ...

class UzbekGreeter:
    def greet(self, name: str) -> str:
        return f"Assalomu alaykum, {name}!"

class EnglishGreeter:
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"

def welcome(greeter: Greeter, name: str) -> None:
    print(greeter.greet(name))

for greeter in [UzbekGreeter(), EnglishGreeter()]:
    welcome(greeter, "Aziza")
```

```text
Assalomu alaykum, Aziza!
Hello, Aziza!
```
:::

### 3. Ovqatlanadiganlar uçun tuşlik <Difficulty level="2" />

`Eatable` ABC, undan meros oladigan `Human` va meros olmaydigan `Robot` ni yozing. Keyin faqat `Eatable` aʼzolarni ovqatlantiradigan va neçtasi ötkazib yuborilganini çop etadigan `lunch_break(staff)` ni yozing.

::: details Yeçim
```python
from abc import ABC, abstractmethod

class Eatable(ABC):
    @abstractmethod
    def eat(self) -> str: ...

class Human(Eatable):
    def __init__(self, name: str) -> None:
        self.name = name

    def eat(self) -> str:
        return f"{self.name} ovqatlanmoqda"

class Robot:
    pass

def lunch_break(staff: list[object]) -> None:
    eaters = [member for member in staff if isinstance(member, Eatable)]
    for eater in eaters:
        print(eater.eat())
    print("Ötkazib yuborildi:", len(staff) - len(eaters))

lunch_break([Human("Aziza"), Robot(), Human("Bobur")])
```

```text
Aziza ovqatlanmoqda
Bobur ovqatlanmoqda
Ötkazib yuborildi: 1
```
:::

### 4. Asosiy klassi yöq pleylist <Difficulty level="2" />

Qöşiq nomlarini saqlaydigan va faqat `__len__`, `__iter__` hamda `__contains__` ni aniqlaydigan `Playlist` ni yozing. Uning uzunligini, `"Bahor"` unda bor-yöqligini va `isinstance(playlist, Collection)` ni çop eting.

::: details Yeçim
```python
from collections.abc import Collection

class Playlist:
    def __init__(self, songs: list[str]) -> None:
        self.songs = songs

    def __len__(self) -> int:
        return len(self.songs)

    def __iter__(self):
        return iter(self.songs)

    def __contains__(self, title: object) -> bool:
        return title in self.songs

playlist = Playlist(["Bahor", "Yor-yor", "Lazgi"])
print(len(playlist), "Bahor" in playlist)
print(isinstance(playlist, Collection))
```

```text
3 True
True
```

Bu abstrakt klass uçta metodni ularning nomiga qarab taniydi. Murakkabroq abstrakt klasslarda meros oliş yoki röyxatdan ötkaziş kerak bölişi mumkin.
:::

### 5. Faqat öqiladigan arxiv <Difficulty level="3" />

Arxivga heç qaçon yozib bölmaydi. Işlaş vaqtida tekşiriladigan (`@runtime_checkable`) `Readable` (`read(key)`) va `Writable` (`write(key, value)`) protokollarini, faqat öqiydigan `Archive` ni, yozadigan `MemoryStore` ni va `copy(source, target, keys)` ni yozing. Arxivdan omborga ikkita kalitni köçiring, omborni çop eting va arxivni ikkala protokol böyiça tekşiring.

::: details Yeçim
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self, key: str) -> str: ...

@runtime_checkable
class Writable(Protocol):
    def write(self, key: str, value: str) -> None: ...

class MemoryStore:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}

    def write(self, key: str, value: str) -> None:
        self.data[key] = value

class Archive:
    def __init__(self, data: dict[str, str]) -> None:
        self._data = dict(data)

    def read(self, key: str) -> str:
        return self._data[key]

def copy(source: Readable, target: Writable, keys: list[str]) -> None:
    for key in keys:
        target.write(key, source.read(key))

archive = Archive({"2024": "savdo 120", "2025": "savdo 150"})
store = MemoryStore()
copy(archive, store, ["2024", "2025"])
print(store.data)
print(isinstance(archive, Readable), isinstance(archive, Writable))
```

```text
{'2024': 'savdo 120', '2025': 'savdo 150'}
True False
```

`copy` har bir tomondan faqat özi işlatadigan narsani söraydi.
:::

## Xulosa

- ISP: heç bir klass özi işlatmaydigan metodlarni implement qilişga, heç bir çaqiruvçi esa ularga boğliq bölişga majbur bölmasligi kerak.
- `NotImplementedError` çaqiradigan yoki heç narsa qilmaydigan metod katta interfeys belgisi.
- Çaqiruvçi böyiça ajrating; klass özi qöllaydigan kiçik interfeyslarni birlaştiradi.
- Klass majburiy metodni bajara olmasa, interfeysni ajratişga ehtiyoj bölişi mumkin.
- `typing.Protocol` funksiyaga aynan özi çaqiradigan metodlarni nomlaş imkonini beradi; `collections.abc` standart kutubxonadagi namuna.
- Har bir klass har bir metoddan foydalanar ekan, interfeysni ajratmang.

## Qöşimça manbalar

- [`abc`: abstrakt asosiy klasslar](https://docs.python.org/3/library/abc.html)
- [`typing.Protocol`](https://docs.python.org/3/library/typing.html#typing.Protocol)
- [PEP 544: Protocols, structural subtyping](https://peps.python.org/pep-0544/)
- [`collections.abc`: konteynerlar uçun abstrakt asosiy klasslar](https://docs.python.org/3/library/collections.abc.html)
- [Pythonda SOLID tamoyillari: manba misollar](https://github.com/codeuz-edu/python-advanced/tree/main/examples/solid/04-isp)
