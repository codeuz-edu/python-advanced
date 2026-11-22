---
title: Python maʼlumot modeli
description: "Python obyektlari, atributlarni qidiriş, çaqiriladigan obyektlar, __slots__, deskriptorlar va klass yaratiş qoidalarini örganasiz."
---

# Python maʼlumot modeli

![Rasm: Python maʼlumotlar modeli](/images/topics-webp-uzb/python-data-model.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- Nega **hamma narsa obyekt**: `type()`, `__class__` va `__dict__`
- `__getattr__`, `__getattribute__`, `__setattr__` va `__delattr__` atributga murojaatni qanday boşqaradi
- `__call__` bilan obyektni çaqiriş va `__slots__` bilan xotirani tejaş
- **Deskriptorlar** (`__get__`/`__set__`) `property` ni qanday işlatadi
- `__init_subclass__` qanday qilib voris klasslarni röyxatga oladi, qisqaça `__class_getitem__` va metaklasslar
:::

## Nega bu muhim

*Obyektlarni ifodalaş va taqqoslaş* hamda *Operatorlar va konteynerlar* darslarida maxsus metodlar yordamida obyektni chop etiş, taqqoslaş va elementlarini aylanib çiqişni kördik. **Maʼlumot modeli** atribut öqilganda, obyekt çaqirilganda yoki klass yaratilganda Python nima qilişini ham belgilaydi. Masalan, kutubxona qiymat berilayotgan maydonni tekşirişi yoki yangi klassni plaginlar röyxatiga kiritişi mumkin.

## Hamma narsa obyekt

Son, funksiya va klassning har biri obyekt. Klassning turi **metaklass** deyiladi. Odatda u `type` böladi. Siz yozgan oddiy klassning obyekti öz atributlarini `__dict__` nomli luğatda saqlaydi.

```python
class City:
    country = "Özbekiston"

    def __init__(self, name, population):
        self.name = name
        self.population = population

tashkent = City("Toşkent", 3_000_000)

print(type(tashkent), tashkent.__class__ is City)
print(type(42), type(len), type(City))
print(tashkent.__dict__)
print("country" in tashkent.__dict__, tashkent.country)
```

```text
<class '__main__.City'> True
<class 'int'> <class 'builtin_function_or_method'> <class 'type'>
{'name': 'Toşkent', 'population': 3000000}
False Özbekiston
```

Bu misolda `country` obyekt luğatida yöq, şuning uçun Python klassdagi qiymatni oladi. Qidiruv asosiy klasslarda ham davom etişi mumkin. Quyida köradigan maʼlumot deskriptorlari obyekt luğatidan oldin tekşiriladi.

## Atributga murojaatni boşqariş

`obj.method` kabi odatiy murojaatda Python **`__getattribute__`** dan foydalanadi. Qidiruv `AttributeError` bilan tugasa va klassda **`__getattr__`** bölsa, Python uni çaqiradi. `len(obj)` kabi maxsus metodlar obyektning `__getattribute__` metodi çaqirilmasdan ham topilişi mumkin.

```python
class Settings:
    def __init__(self):
        self.language = "uz"

    def __getattr__(self, name):              # faqat mavjud bölmagan atributlar uçun
        print(f"  __getattr__({name!r})")
        return f"<standart {name}>"

class Logged:
    def __init__(self, city):
        self.city = city

    def __getattribute__(self, name):         # har bir atributni öqişda
        print(f"  öqilmoqda: {name!r}")
        return super().__getattribute__(name)

settings = Settings()
print(settings.language)
print(settings.theme)
print(Logged("Buxoro").city)
```

```text
uz
  __getattr__('theme')
<standart theme>
  öqilmoqda: 'city'
Buxoro
```

`__getattribute__` içida odatdagi qidiruvni bajariş uçun `super().__getattribute__(name)` ni çaqiring. U yerda `self.something` ni öqisangiz, şu metod yana çaqiriladi va oxiri `RecursionError` kelişi mumkin. Faqat topilmagan atributlar bilan işlaş kerak bölsa, `__getattr__` yetarli.

**`__setattr__`** har bir qiymat berişda, jumladan `__init__` içidagilarda ham işlaydi. Uning jufti **`__delattr__`** har bir `del obj.attr` da işlaydi (Maşqlarda undan foydalanasiz):

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price                    # bu ham __setattr__ orqali ötadi

    def __setattr__(self, name, value):
        if name == "price" and value < 0:
            raise ValueError(f"narx manfiy bölişi mumkin emas: {value}")
        super().__setattr__(name, value)      # haqiqiy qiymat beriş

tea = Product("Çoy", 15000)
tea.price = 18000
print(tea.__dict__)

try:
    tea.price = -5
except ValueError as error:
    print("ValueError:", error)
```

```text
{'name': 'Çoy', 'price': 18000}
ValueError: narx manfiy bölişi mumkin emas: -5
```

Bitta atribut uçun *Xossalar va inkapsulyatsiya* darsidagi `@property` tuşunarliroq. `__setattr__` esa bitta qoida **barça** atributlarni qamrab olganda, masalan faqat öqiş uçun möljallangan obyektda qöl keladi.

## `__call__`: çaqiriş mumkin bölgan obyektlar

Klassda **`__call__`** metodi bölsa, uning obyektini `obj(...)` shaklida çaqira olamiz. Bunday obyekt öz holatini atributlarida saqlaydi. Uni mos argumentlar bilan çaqiriladigan obyekt kutuvchi funksiyaga uzatiş ham mumkin.

```python
class MinLength:
    def __init__(self, minimum):
        self.minimum = minimum
        self.rejected = 0

    def __call__(self, text):
        ok = len(text) >= self.minimum
        if not ok:
            self.rejected += 1
        return ok

valid_name = MinLength(3)
names = ["Aziza", "Bo", "Jasur", "", "Dilnoza"]

print(list(filter(valid_name, names)))
print(valid_name("Li"), valid_name.rejected, callable(valid_name))
```

```text
['Aziza', 'Jasur', 'Dilnoza']
False 3 True
```

*Closure va dekoratorlar* darsidagi closure ham xuddi şunday qila oladi; holat yoki metodlar köpaysa, klass yaxşiroq öqiladi.

## `__slots__` va atributlar uçun xotira

**`__slots__`** obyektning sanab ötilgan atributlari uçun alohida joy ajratadi. Slotli klass obyektida odatda `__dict__` bölmaydi. Luğat kerak bölsa, `"__dict__"` ni slotlar röyxatiga qöşiş mumkin. Asosiy klassdan meros qolgan obyekt luğati ham saqlanadi. *Xotira va samaradorlik* darsida köp sonli kiçik obyektlarda qancha xotira tejalişini ölçaymiz.

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class SlotPoint:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

print(hasattr(Point(1, 2), "__dict__"), hasattr(SlotPoint(1, 2), "__dict__"))
try:
    SlotPoint(1, 2).z = 3
except AttributeError as error:
    print("AttributeError:", error)
```

```text
True False
AttributeError: 'SlotPoint' object has no attribute 'z' and no __dict__ for setting new attributes
```

Endi `point.zz = 3` kabi imlo xatosi darhol aniqlanadi.

## `property` qanday işlaydi: deskriptorlar

**Deskriptor** — `__get__`, `__set__` yoki `__delete__` metodlaridan kamida bittasi bor obyekt. U klass atributi sifatida saqlansa, şu nomdagi atributni öqiş, unga qiymat beriş yoki uni öçirişni boşqara oladi. `__set__` yoki `__delete__` metodi bor obyekt **maʼlumot deskriptori** deyiladi. Setter yozilmagan `property` ham şunday deskriptor.

```python
class Positive:
    def __set_name__(self, owner, name):      # "quantity" yoki "price" ni oladi
        self.name = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:                       # klassning özi orqali murojaat
            return self
        return getattr(obj, self.name)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name[1:]} musbat bölişi kerak, berilgan: {value}")
        setattr(obj, self.name, value)

class Order:
    quantity = Positive()
    price = Positive()

    def __init__(self, item, quantity, price):
        self.item = item
        self.quantity = quantity              # Positive.__set__ ni çaqiradi
        self.price = price

order = Order("somsa", 4, 8000)
print(order.quantity * order.price, order.__dict__)

try:
    order.price = 0
except ValueError as error:
    print("ValueError:", error)

print(hasattr(property, "__get__"), hasattr(property, "__set__"))
```

```text
32000 {'item': 'somsa', '_quantity': 4, '_price': 8000}
ValueError: price musbat bölişi kerak, berilgan: 0
True True
```

Bitta `Positive` klassi nusxalab yozilgan ikkita property örnini bosadi. Funksiyalar ham deskriptor: metodlar `self` ni aynan şu tarzda oladi.

## Klass yaratilganda çaqiriladigan metodlar

Yangi klass yaratilayotganda Python metod qidiriş tartibidagi bevosita ota klassning **`__init_subclass__`** metodini çaqiradi. Unga yangi klass `cls` sifatida uzatiladi. `class` qatoridagi `metaclass` dan boşqa kalit sözli argumentlar ham şu metodga keladi. Ortiqça argumentlarni `super().__init_subclass__(**kwargs)` orqali meros zanjiri böylab uzating.

```python
class Exporter:
    registry = {}

    def __init_subclass__(cls, fmt, **kwargs):
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "export"):
            raise TypeError(f"{cls.__name__} export() ni aniqlaşi kerak")
        Exporter.registry[fmt] = cls

class CsvExporter(Exporter, fmt="csv"):
    def export(self, cities):
        return ",".join(cities)

print(Exporter.registry["csv"]().export(["Toşkent", "Buxoro"]))

try:
    class XmlExporter(Exporter, fmt="xml"):
        pass
except TypeError as error:
    print("TypeError:", error)
```

```text
Toşkent,Buxoro
TypeError: XmlExporter export() ni aniqlaşi kerak
```

*Type hintlar* darsidagi `list[int]` **`__class_getitem__`** tufayli işlaydi: `list[int]` `list.__class_getitem__(int)` ni çaqiradi, u esa `list` ni ham, `int` ni ham eslab qoladigan `types.GenericAlias` obyektini qaytaradi. Uni özingiz kamdan-kam yozasiz: `class Box[T]:` kabi tur parametri (type parameter) bilan eʼlon qilingan generic klass uni avtomatik oladi.

**Metaklass** (metaclass) - klassning klassi: standart metaklass `type`, maxsus metaklass esa klasslar qanday qurilişini özgartiradi. Deyarli barça ehtiyojlarni `__init_subclass__` va klass dekoratorlari soddaroq qoplaydi; metaklassga duç kelganingizda [metaklasslar bölimini](https://docs.python.org/3/reference/datamodel.html#metaclasses) öqing.

## Özingiz sinab köring

`MinLength` 8 harfdan uzun ismlarni ham rad etsin va ularni ham sanasin.

<ClientOnly><PythonPlayground :code='"class MinLength:\n    def __init__(self, minimum):\n        self.minimum = minimum\n        self.rejected = 0\n\n    def __call__(self, text):\n        ok = len(text) >= self.minimum\n        if not ok:\n            self.rejected += 1\n        return ok\n\ncheck = MinLength(3)\nnames = [\"Aziza\", \"Bo\", \"Muhammadali\", \"Jasur\"]\nprint(list(filter(check, names)), check.rejected)"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. `__setattr__` dagi çeksiz rekursiya

```py
class Account:
    def __setattr__(self, name, value):
        if name == "owner":
            value = value.title()
        setattr(self, name, value)    # Yomon: __setattr__ ni yana çaqiradi

Account().owner = "aziza"
```

```text
RecursionError: maximum recursion depth exceeded
```

`__setattr__` içidagi `setattr(self, ...)` yoki `self.x = ...` ayni hookni qayta çaqiradi. **Tuzatiş:** `super().__setattr__(name, value)` dan foydalaning. Xuddi şu tuzoq `__getattribute__` da ham bor, u yerda tuzatiş - `super().__getattribute__(name)`.

### 2. Imlo xatolarini jimgina yaşiradigan `__getattr__`

```python
class User:
    def __init__(self, email):
        self.email = email

    def __getattr__(self, name):
        return None                   # Yomon: har qanday yöq nom "mavjud"

user = User("bobur@example.uz")
print(user.emial)
```

```text
None
```

Imlo xatosi istisno çaqirmaydi, `None` qaytaradi. **Tuzatiş:** faqat kutgan nomlaringizni qayta işlang, qolganlari uçun `raise AttributeError(name)` qiling.

### 3. `__slots__` siz voris klass

```python
class Point:
    __slots__ = ("x", "y")

class ColorPoint(Point):
    pass                              # bu yerda __slots__ yöq

p = ColorPoint()
p.colour = "qizil"                    # imlo xatosi qabul qilindi
print(hasattr(p, "__dict__"), p.colour)
```

```text
True qizil
```

Voris klass yana `__dict__` ga ega böladi. **Tuzatiş:** har bir voris klassga faqat yangi nomlari bor öz `__slots__` ini bering, masalan `__slots__ = ("color",)`.

### 4. `__hash__` siz `__eq__`

```py
class Coordinate:
    def __init__(self, lat, lon):
        self.lat, self.lon = lat, lon

    def __eq__(self, other):
        if not isinstance(other, Coordinate):
            return NotImplemented
        return (self.lat, self.lon) == (other.lat, other.lon)

visits = {Coordinate(41.31, 69.28): "Toşkent"}

```text
TypeError: unhashable type: 'Coordinate'
```

Faqat `__eq__` ni aniqlasak, bu klassning obyektlarini xeşlab bölmaydi. `lat` va `lon` özgarar ekan, bu holatni saqlang. Taqqoslaşda qatnaşadigan maydonlar özgarmaydigan bölsa, *Obyektlarni ifodalaş va taqqoslaş* darsidagidek `(self.lat, self.lon)` ni xeşlaş mumkin.

## Maşqlar

### 1. Köpaytiruvçi <Difficulty level="1" />

Nusxalari son bilan çaqirilganda uni `factor` ga köpaytirib qaytaradigan `Multiplier(factor)` klassini yozing. `double(21)` va `triple(5)` ni, keyin `list(map(double, [1, 2, 3]))` ni çop eting.

::: details Yeçim
```python
class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, number):
        return number * self.factor

double = Multiplier(2)
triple = Multiplier(3)
print(double(21), triple(5))
print(list(map(double, [1, 2, 3])))
```

```text
42 15
[2, 4, 6]
```
:::

### 2. Nuqta orqali murojaatli sozlamalar <Difficulty level="1" />

`__getattr__` yordamida `config.city` `data["city"]` ni qaytaradigan `Config(data)` klassini yozing. Yöq kalit `'port' sozlamasi yöq` xabarli `AttributeError` çaqirsin. `{"city": "Samarqand", "debug": False}` uçun `city` va `debug` ni çop eting, keyin `config.port` ni sinab köring.

::: details Yeçim
```python
class Config:
    def __init__(self, data):
        self._data = dict(data)

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(f"{name!r} sozlamasi yöq") from None

config = Config({"city": "Samarqand", "debug": False})
print(config.city, config.debug)
try:
    config.port
except AttributeError as error:
    print("AttributeError:", error)
```

```text
Samarqand False
AttributeError: 'port' sozlamasi yöq
```
:::

### 3. Faqat öqiş uçun nuqta <Difficulty level="2" />

`__setattr__` va `__delattr__` metodlari `AttributeError("FrozenPoint faqat öqiş uçun")` çaqiradigan `FrozenPoint(x, y)` klassini yozing. `p.x, p.y` ni çop eting, `p.x = 10` va `del p.y` ni sinab köring (har bir xatoni çop eting), keyin `p.x, p.y` ni yana çop eting.

::: details Yeçim
```python
class FrozenPoint:
    def __init__(self, x, y):
        object.__setattr__(self, "x", x)      # özimizning __setattr__ ni aylanib ötamiz
        object.__setattr__(self, "y", y)

    def __setattr__(self, name, value):
        raise AttributeError("FrozenPoint faqat öqiş uçun")

    def __delattr__(self, name):
        raise AttributeError("FrozenPoint faqat öqiş uçun")

p = FrozenPoint(3, 4)
print(p.x, p.y)
try:
    p.x = 10
except AttributeError as error:
    print("özgartiriş:", error)
try:
    del p.y
except AttributeError as error:
    print("öçiriş:", error)
print(p.x, p.y)
```

```text
3 4
özgartiriş: FrozenPoint faqat öqiş uçun
öçiriş: FrozenPoint faqat öqiş uçun
3 4
```

:::

### 4. Oraliq deskriptori <Difficulty level="2" />

`grade 1 va 11 oraliğida bölişi kerak, berilgan: 12` kabi `ValueError` çaqiradigan `InRange(low, high)` deskriptorini yozing. Uni `Student(grade, score)` da `grade` (1-11) va `score` (0-100) uçun işlating. Öquvçining sinfi va ballini (9, 87) çop eting, keyin 12-sinf va 101 ballni sinab köring.

::: details Yeçim
```python
class InRange:
    def __init__(self, low, high):
        self.low, self.high = low, high

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__[self.name]

    def __set__(self, obj, value):
        if not self.low <= value <= self.high:
            raise ValueError(f"{self.name} {self.low} va {self.high} oraliğida bölişi kerak, berilgan: {value}")
        obj.__dict__[self.name] = value

class Student:
    grade = InRange(1, 11)
    score = InRange(0, 100)

    def __init__(self, grade, score):
        self.grade = grade
        self.score = score

dilnoza = Student(9, 87)
print(dilnoza.grade, dilnoza.score)
for field, value in [("grade", 12), ("score", 101)]:
    try:
        setattr(dilnoza, field, value)
    except ValueError as error:
        print("ValueError:", error)
```

```text
9 87
ValueError: grade 1 va 11 oraliğida bölişi kerak, berilgan: 12
ValueError: score 0 va 100 oraliğida bölişi kerak, berilgan: 101
```
:::

### 5. Buyruq plaginlari registri <Difficulty level="3" />

`__init_subclass__` metodi har bir bola klassni `Command.commands` ga kiçik harfli, `command` qöşimçasisiz nom bilan röyxatga oladigan `Command` asosiy klassini yozing (`HelloCommand` - `hello`). `run(args)` metodli `HelloCommand` va `AddCommand` ni qöşing. Saralangan nomlarni çop eting, keyin `"hello Jasur"`, `"add 2 3 10"` va `"sing Lazgi"` ni bajaring (`nomaʼlum buyruq: sing` ni çop eting).

::: details Yeçim
```python
class Command:
    commands = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        name = cls.__name__.lower().removesuffix("command")
        Command.commands[name] = cls

class HelloCommand(Command):
    def run(self, args):
        return f"Salom, {args[0]}!"

class AddCommand(Command):
    def run(self, args):
        return sum(int(n) for n in args)

print(sorted(Command.commands))
for line in ["hello Jasur", "add 2 3 10", "sing Lazgi"]:
    name, *args = line.split()
    if name in Command.commands:
        print(Command.commands[name]().run(args))
    else:
        print(f"nomaʼlum buyruq: {name}")
```

```text
['add', 'hello']
Salom, Jasur!
15
nomaʼlum buyruq: sing
```

:::

## Xulosa

- Klass ham obyekt. Uning metaklassi odatda `type`. Oddiy obyekt öz atributlarini `__dict__` da saqlaydi.
- `__getattr__` topilmagan atributlar uçun işlaydi. Maxsus metod içida odatdagi qidiruv yoki qiymat beriş uçun `super()` dan foydalaning.
- `__call__` obyektni çaqiriş imkonini beradi. `__slots__` obyektning `__dict__` siz işlaşiga imkon yaratadi.
- **Deskriptor** klass atributi orqali murojaatni boşqaradi. `property` bunga misol.
- `__init_subclass__` yordamida yangi voris klassni tekşiriş yoki röyxatga oliş mumkin. `__class_getitem__` `list[int]` kabi yozuvlarni qöllaydi.

## Qöşimça manbalar

- [Data model: customizing attribute access](https://docs.python.org/3/reference/datamodel.html#customizing-attribute-access)
- [Descriptor HowTo Guide](https://docs.python.org/3/howto/descriptor.html)
- [Data model: customizing class creation](https://docs.python.org/3/reference/datamodel.html#customizing-class-creation)
