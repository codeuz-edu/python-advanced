---
title: Testlaşni çuqurroq örganiş
description: "Pytest testlarini tartiblaymiz, tayyorgarlik va yakun amallarini yozamiz, natijalarni va jurnal yozuvlarini tekşiramiz."
---

# Testlaşni çuqurroq örganiş

![Rasm: Testlaşni çuqurroq örganiş](/images/topics-webp-uzb/testing-in-depth.webp){.lesson-cover width=1536 height=1024}

::: tip Nimalarni örganasiz
- Testlarni **`tests/` papkasi**, **`conftest.py`** va `-k` bilan qanday tartiblaş
- Tayyorlaş va tozalaş uçun **fixture scopelari** va **`yield` li fixturelar**
- Örnatilgan **`monkeypatch`**, **`capsys`** va **`caplog`** fixturelari
- **`unittest.mock`**: `Mock`, `patch`, `return_value`, `side_effect`
- **Test dubli** (test double) qaçon kerak va yaxşi test qanday böladi
:::

## Nega bu muhim

Yetkazib beriş ilovasi sozlamalarni öqiydi, SMS yuboradi va ötmagan tölovlarni jurnalga yozadi. Test telefon tarmoğiga ulanmasdan ham ilova qanday xabar yuborişini tekşira oladi. *pytest bilan testlaş* darsida örganilgan usullarni bu safar taşqi xizmat bilan işlaydigan kodga qöllaymiz.

::: info pytest ni kompyuteringizda işga tuşiring
pytest fayllarini ("▶ Muharrirda işga tuşiriş" tugmasi yöq bloklarni) kompyuteringizda işga tuşiring. Işga tuşiriladigan bloklar brauzerda işlaydigan `unittest.mock`, `logging` va oddiy `assert` dan foydalanadi.
:::

## Test töplamini tartiblaş

Loyihada bir neçta test fayli bölsa, ularni `tests/` papkasiga joylang. Quyida namuna tuzilma berilgan. Keyingi misollarda qaysi kodni qaysi faylga yoziş körsatiladi.

```text
shop_project/
├── shop.py
├── pytest.ini          # pythonpath = .
└── tests/
    ├── conftest.py     # umumiy fixturelar
    ├── test_orders.py
    └── test_shop.py
```

- pytest `conftest.py` ni özi topadi. Undagi fixturelardan şu papka va uning içki papkalaridagi testlar foydalana oladi.
- Testlarni xatti-harakat böyiça nomlang: `test_discount2` emas, `test_large_discount_logs_warning`.
- Bu tuzilmada `pytest.ini` faylidagi `[pytest]` bölimiga `pythonpath = .` yozsak, pytest loyiha papkasini import yöliga qöşadi.
- `pytest -k "currency or receipt"` faqat nomi mos keladigan testlarni işga tuşiradi (`collected 6 items / 4 deselected / 2 selected`).

## Fixture qamrovi va `yield` bilan yakunlaş

Fixture test uçun resurs tayyorlaşi, uni `yield` orqali berişi va söng resursni böşatişi mumkin. Fixture `yield` ga yetib kelgan bölsa, test ötmasa ham yakun qismi bajariladi. Tayyorlov qismida, `yield` dan oldin xato yuz bersa, undan keyingi qatorlar bajarilmaydi. Bu fixtureni `tests/conftest.py` ga yozing.

![Diagramma: Fixture: tayyorlaş va tozalaş](/images/companions-webp-uzb/fixture-lifecycle.webp){.lesson-diagram width=1536 height=1024 loading=lazy}

```py
import pytest


class FakeDatabase:
    def __init__(self):
        self.orders = []

    def close(self):
        print("yopildi")


@pytest.fixture
def db():
    database = FakeDatabase()   # tayyorlaş
    print("ulandi")
    yield database              # test şu yerda işlaydi
    database.close()            # tozalaş, test yiqilsa ham
```

`db` dan foydalanadigan ikkita test bilan `pytest -q -s` (printlarni körsatadi) quyidagini beradi:

```text
ulandi
.yopildi
ulandi
.yopildi

2 passed in 0.01s
```

Fixture **qamrovi** (`scope`) pytest uning bitta obyektini qança vaqt saqlaşini belgilaydi. Quyida köp uçraydigan uç qamrov berilgan.

| Scope | Bir marta yaratiladi | Nima uçun |
|---|---|---|
| `function` (standart) | har bir testda | test özgartiradigan har qanday narsa |
| `module` | har bir test faylida | sekin, faqat öqiladigan tayyorgarlik |
| `session` | har bir işga tuşirişda | test serveri |

Keng qamrov tayyorgarlik işlarini kamroq takrorlaydi. Bir obyektni bölişgan testlar uning qiymatlarini özgartirsa, bir-biriga taʼsir qilişi mumkin.

## Örnatilgan fixturelar: `monkeypatch`, `capsys`, `caplog`

Bu pytest misolini kompyuteringizda sinang. Keyingi mustaqil misoldagi tört funksiyani `shop.py` ga, şu blokni esa `tests/test_shop.py` ga yozing. Loyiha papkasida `python -m pytest` ni bajaring.

```py
import shop


def test_currency_from_env(monkeypatch):
    monkeypatch.setenv("SHOP_CURRENCY", "USD")
    assert shop.get_currency() == "USD"


def test_ask_quantity(monkeypatch):
    monkeypatch.setattr("builtins.input", lambda prompt: "3")
    assert shop.ask_quantity() == 3


def test_receipt(capsys):
    shop.print_receipt({"somsa": 8000})
    captured = capsys.readouterr()
    assert captured.out == "somsa: 8000 söm\n"


def test_large_discount_logs(caplog):
    assert shop.apply_discount(100000, 60) == 40000
    assert "katta çegirma 60%" in caplog.text
```

- **`monkeypatch`** muhit özgaruvçilarini (`setenv`, `delenv`) va atributlarni (`setattr`) örnatadi hamda testdan keyin **har bir özgarişni bekor qiladi**.
- **`capsys`** Pythonning standart çiqiş va xato oqimlariga yozilgan matnni yozib oladi. **`caplog`** jurnal yozuvlarini saqlaydi. Pastroq darajadagi xabarlarni ham oliş kerak bölsa, `caplog.set_level(...)` ni çaqiring.

Keyingi blokda tört funksiya va ularni tekşiradigan standart kutubxona kodi bor. Butun blokni brauzerda işga tuşiriş mumkin.

```python
from contextlib import redirect_stdout
from io import StringIO
import logging
import os
import unittest
from unittest.mock import patch

logger = logging.getLogger("shop")

def get_currency():
    return os.environ.get("SHOP_CURRENCY", "söm")

def ask_quantity():
    return int(input("Neçta? "))

def print_receipt(items):
    for name, price in items.items():
        print(f"{name}: {price} söm")

def apply_discount(price, percent):
    if percent > 100:
        raise ValueError("foiz köpi bilan 100 bölişi kerak")
    if percent > 50:
        logger.warning("katta çegirma %s%%", percent)
    return price * (100 - percent) // 100

with patch.dict(os.environ, {"SHOP_CURRENCY": "USD"}):
    assert get_currency() == "USD"

with patch("builtins.input", return_value="3"):
    assert ask_quantity() == 3

output = StringIO()
with redirect_stdout(output):
    print_receipt({"somsa": 8000})
assert output.getvalue() == "somsa: 8000 söm\n"

case = unittest.TestCase()
with case.assertLogs("shop", level="WARNING") as logs:
    assert apply_discount(100000, 60) == 40000
print(logs.output)

with case.assertRaisesRegex(ValueError, "köpi bilan 100"):
    apply_discount(100000, 150)
print("barça tekşiruvlar ötdi")
```

```text
['WARNING:shop:katta çegirma 60%']
barça tekşiruvlar ötdi
```

Heç narsa logga yozilmasa, `assertLogs` yiqiladi; `assertRaisesRegex` esa `pytest.raises(..., match=...)` kabi işlaydi.

## `Mock`: çaqiruvlarni yozib boradigan soxta obyekt

Odatiy **`Mock`** söralgan oddiy atribut uçun yangi mock hosil qiladi va çaqiruvlarni yozib boradi. Ruxsat etilgan atributlarni `spec` bilan çegaralaş mumkin. Çaqiruv natijasini **`return_value`** bilan belgilang.

```python
from unittest.mock import Mock

sms = Mock()
sms.send.return_value = "yetkazildi"

print(sms.send("+998901234567", "Palovingiz yölda"))
print("çaqiruvlar:", sms.send.call_count)
sms.send.assert_called_once_with("+998901234567", "Palovingiz yölda")
print("assert_called_once_with ötdi")
```

```text
yetkazildi
çaqiruvlar: 1
assert_called_once_with ötdi
```

**`side_effect`** yordamida funksiya bajariş, istisno kötariş yoki natijalarni ketma-ket beriş mumkin. Ketma-ketlikdagi element istisno bölsa, navbati kelganda u kötariladi.

```python
from unittest.mock import Mock

def notify(sms, phone):
    try:
        return sms.send(phone, "Buyurtma tayyor")
    except ConnectionError:
        return "keyinroq qayta urinamiz"

sms = Mock()
sms.send.side_effect = ConnectionError("tarmoq işlamayapti")
print(notify(sms, "+998901234567"))

sms.send.side_effect = ["xato", "yetkazildi"]
print(sms.send(), sms.send())
```

```text
keyinroq qayta urinamiz
xato yetkazildi
```

## `patch`: nomni bitta test uçun almaştiriş

Nomni aynan kod uni qidiradigan joyda **`patch("module.name")`** bilan almaştiring. Odatiy holda `patch` mock yaratadi. Kontekst menejeri yoki dekorator tugaganda, avvalgi obyektni tiklaydi.

```python
import random
from unittest.mock import patch

def pick_winner(names):
    return random.choice(names)

with patch("random.choice", return_value="Dilnoza") as fake_choice:
    print(pick_winner(["Aziza", "Bobur", "Dilnoza"]))
fake_choice.assert_called_once_with(["Aziza", "Bobur", "Dilnoza"])

@patch("random.choice")
def test_winner(fake_choice):
    fake_choice.return_value = "Jasur"
    assert pick_winner(["Jasur", "Bobur"]) == "Jasur"

test_winner()
print("test_winner ötdi")
```

```text
Dilnoza
test_winner ötdi
```

Dekorator mockni argument sifatida uzatadi. Bu işlaydi, çunki `pick_winner` `random.choice` ni **işlayotgan paytda** qidiradi (Köp uçraydigan xatolarga qarang).

## Testda boğliqlikni almaştiriş

**Test örinbosari** (*test double*) SMS xizmati yoki soat kabi boğliqlikning örnini bosadi. *Stub* tayyor javob beradi, *fake* soddalaştirilgan amalga ega, *mock* esa çaqiruvlarni qayd qila oladi. Haqiqiy obyekt yordamida tez va işonçli tekşiriş mumkin bölsa, undan foydalaning.

Vaqt yoki tasodifiy sonlarni tekşirişda soat funksiyasini yoki boşlanğiç qiymat berilgan tasodifiy son generatorini argument qilib uzating. Şunda test kiriş maʼlumotini özi belgilaydi.

```python
import random
from datetime import datetime

def greeting(now=datetime.now):
    return "Xayrli tong" if now().hour < 12 else "Xayrli kun"

assert greeting(lambda: datetime(2026, 9, 16, 9, 0)) == "Xayrli tong"
assert greeting(lambda: datetime(2026, 9, 16, 15, 0)) == "Xayrli kun"

rng = random.Random(42)
print([rng.randint(1, 6) for _ in range(5)])
```

```text
[6, 1, 1, 6, 3]
```

Asosiy dastur odatiy soatdan foydalanadi. Testlar unga oldindan belgilangan vaqtni beradi. Ayni Python versiyasida bir xil boşlanğiç qiymat bilan yaratilgan `random.Random` bir xil ketma-ketlikni beradi.

**Qamrov** test paytida qaysi bajariladigan qatorlardan ötilganini körsatadi. `pytest-cov` ni örnatib, `pytest --cov=shop` ni bajaring. Qamrov 100 foiz bölsa ham, tekşirişlar kerakli xatti-harakatni tekşirganiga alohida qarang.

Yaxşi test:

- **bitta xatti-harakatni** tekşiradi va şu böyiça nomlanadi;
- **tez** va **deterministik** (har safar bir xil natija);
- **mustaqil**: yolğiz ham, istalgan tartibda ham ötadi;
- içki tafsilotlarni emas, **natijalarni** tekşiradi;
- kod buzilganda **yiqiladi** (tekşiriş uçun uni bir marta buzib köring).

## Özingiz sinab köring

Bu funksiya kerakli miqdorda qayta urinmayapti. Xatoning sababini toping va testni ötkazing.

<ClientOnly><PythonPlayground :code='"from unittest.mock import Mock\n\ndef fetch_rate(api, attempts=2):\n    for attempt in range(attempts):\n        try:\n            return api.get_rate(\"USD\")\n        except ConnectionError:\n            print(f\"{attempt + 1}-uriniş muvaffaqiyatsiz\")\n    return None\n\napi = Mock()\napi.get_rate.side_effect = [ConnectionError(), ConnectionError(), 12650]\n\nrate = fetch_rate(api)\nprint(\"kurs:\", rate, \"çaqiruvlar:\", api.get_rate.call_count)\nassert rate == 12650, \"uçinçi çaqiruv muvaffaqiyatli bölişi kutilgandi\"\nprint(\"test ötdi\")"' /></ClientOnly>

## Köp uçraydigan xatolar

### 1. Nomni işlatilgan joyda emas, aniqlangan joyda patch qiliş

`rates.py` `fetch_rate()` ni aniqlaydi, `prices.py` esa `from rates import fetch_rate` qilib, **ikkinçi nom** yaratadi. `rates.fetch_rate` ni patch qiliş unga taʼsir qilmaydi:

`rates.py`

```py
def fetch_rate():
    raise ConnectionError("testlarda internet yöq")
```

`prices.py`

```py
from rates import fetch_rate

def price_in_som(amount):
    return amount * fetch_rate()
```

`tests/test_prices.py`

```py
from unittest.mock import patch

from prices import price_in_som


def test_price_wrong_path():
    with patch("rates.fetch_rate", return_value=12500):  # Yomon
        assert price_in_som(2) == 25000
```

```text
    def fetch_rate():
>       raise ConnectionError("testlarda internet yöq")
E       ConnectionError: testlarda internet yöq
```

**Tuzatiş:** nomni kod uni qidiradigan joyda patch qiling: `patch("prices.fetch_rate", return_value=12500)`.

### 2. Özgaruvçan holatli module scopedagi fixture

Yuqoridagi `db` fixture, endi `scope="module"` bilan (Yomon: butun fayl uçun bitta röyxat):

```py
def test_add_order(db):
    db.orders.append("palov")
    assert db.orders == ["palov"]


def test_no_orders_yet(db):
    assert db.orders == []
```

```text
E       AssertionError: assert ['palov'] == []
E         
E         Left contains one more item: 'palov'
```

`test_no_orders_yet` yolğiz işga tuşirilsa ötadi, lekin `test_add_order` dan keyin yiqiladi. **Tuzatiş:** özgaruvçan obyektlar uçun standart `function` scopedan foydalaning.

### 3. Testlanayotgan narsaning özini mock qiliş

```python
from unittest.mock import Mock

class Cart:
    def __init__(self, prices):
        self.prices = prices

    def total(self):
        return sum(self.prices) * 2   # xato

cart = Cart([15000, 8000])
cart.total = Mock(return_value=23000)   # Yomon: haqiqiy metodni almaştiradi
assert cart.total() == 23000
print("test ötdi, lekin haqiqiy jami", Cart.total(cart))
```

```text
test ötdi, lekin haqiqiy jami 46000
```

Tekşirish muvaffaqiyatli, çunki natijani avval mockning öziga berganmiz. Asl funksiyani tekşiriş uçun uni çaqiring va uning işlatadigan taşqi boğliqligini almaştiring.

### 4. Heç qaçon bölmagan çaqiruvni tekşiriş

```py
from unittest.mock import Mock

def place_order(items, sms):
    total = sum(items.values())
    if total > 1_000_000:          # xato: har bir buyurtma SMS yuborişi kerak
        sms.send(f"Buyurtma jami: {total} söm")
    return total

sms = Mock()
place_order({"palov": 35000}, sms)
sms.send.assert_called_with("Buyurtma jami: 35000 söm")
```

```text
AssertionError: expected call not found.
Expected: send('Buyurtma jami: 35000 söm')
  Actual: not called.
```

Test haqiqiy xatoni topdi. **Tuzatiş:** testni emas, kodni tuzating; `call_args` aslida nima bölganini körsatadi.

## Maşqlar

### 1. Soxta valyuta kursi APIsi <Difficulty level="1" />

`amount * api.get_rate("USD")` ni qaytaradigan `usd_to_som(amount, api)` ni yozing. `get_rate` i `12650` qaytaradigan `Mock` bilan 20 USD uçun natijani çop eting, çaqiruvni `assert_called_once_with` bilan tekşiring va `"çaqiruv tekşirildi"` ni çop eting.

::: details Yeçim
```python
from unittest.mock import Mock

def usd_to_som(amount, api):
    return amount * api.get_rate("USD")

api = Mock()
api.get_rate.return_value = 12650

print(usd_to_som(20, api))
api.get_rate.assert_called_once_with("USD")
print("çaqiruv tekşirildi")
```

```text
253000
çaqiruv tekşirildi
```
:::

### 2. `monkeypatch` bilan muhit özgaruvçilari <Difficulty level="1" />

Kompyuteringizda işga tuşiring: `greet.py` da `greeting()` bor, u `f"Salom, {name}!"` ni qaytaradi, bu yerda `name` - `USER_NAME` muhit özgaruvçisi yoki `"döst"`. `monkeypatch` bilan ikkita pytest testi yozing: biri özgaruvçini örnatadi, boşqasi uni olib taşlaydi.

::: details Yeçim
`greet.py`

```py
import os

def greeting():
    name = os.environ.get("USER_NAME", "döst")
    return f"Salom, {name}!"
```

`test_greet.py`

```py
from greet import greeting


def test_name_from_env(monkeypatch):
    monkeypatch.setenv("USER_NAME", "Aziza")
    assert greeting() == "Salom, Aziza!"


def test_default_name(monkeypatch):
    monkeypatch.delenv("USER_NAME", raising=False)
    assert greeting() == "Salom, döst!"
```

```text
..                                                                       [100%]
2 passed in 0.01s
```
:::

### 3. Işlagunça qayta uriniş <Difficulty level="2" />

`send_with_retry(sms, text, attempts=3)` ni yozing: `sms.send(text)` ni u `ConnectionError` çaqirmay qolgunça çaqiring; uriniş raqamini, hammasi muvaffaqiyatsiz bölsa `None` ni qaytaring. `side_effect` bilan ikki marta yiqilib, keyin muvaffaqiyatli böladigan mockni va doim yiqiladigan mockni testlang. Har bir natija va çaqiruvlar sonini çop eting.

::: details Yeçim
```python
from unittest.mock import Mock

def send_with_retry(sms, text, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            sms.send(text)
            return attempt
        except ConnectionError:
            pass
    return None

flaky = Mock()
flaky.send.side_effect = [ConnectionError(), ConnectionError(), "ok"]
print(send_with_retry(flaky, "Salom"), flaky.send.call_count)

broken = Mock()
broken.send.side_effect = ConnectionError("işlamayapti")
print(send_with_retry(broken, "Salom"), broken.send.call_count)
```

```text
3 3
None 3
```
:::

### 4. `tmp_path` bilan `yield` li fixture <Difficulty level="2" />

Kompyuteringizda işga tuşiring: `orders.py` da fayldagi qatorlar sonini qaytaradigan `count_orders(path)` bor. `tmp_path` da ikki qatorli `orders.csv` yaratadigan, testdan keyin esa `"öçirilmoqda orders.csv"` ni çop etib, faylni öçiradigan `yield` li fixture yozing. `pytest -q -s` ni işga tuşiring.

::: details Yeçim
`orders.py`

```py
def count_orders(path):
    with path.open(encoding="utf-8") as file:
        return sum(1 for line in file)
```

`test_orders.py`

```py
import pytest

from orders import count_orders


@pytest.fixture
def orders_file(tmp_path):
    path = tmp_path / "orders.csv"
    path.write_text("palov,35000\nsomsa,8000\n", encoding="utf-8")
    yield path
    print("öçirilmoqda", path.name)
    path.unlink()


def test_count_orders(orders_file):
    assert count_orders(orders_file) == 2
```

```text
.öçirilmoqda orders.csv

1 passed in 0.01s
```
:::

### 5. Dam oliş kunlaridagi hisobotlar <Difficulty level="3" />

`daily_report(sms, now)` ni yozing: dam oliş kunlarida (`now().weekday() >= 5`) u `"reports"` loggeriga INFO darajasida `"dam oliş kuni, hisobot yöq"` ni yozadi; boşqa kunlarda `sms.send("Kunlik hisobot tayyor")` ni çaqiradi. Ikkala holatni `Mock`, belgilangan soatlar, `assertLogs` va `assert_not_called` bilan testlang, keyin `"2 ta test ötdi"` ni çop eting.

::: details Yeçim
```python
import logging
import unittest
from datetime import datetime
from unittest.mock import Mock

logger = logging.getLogger("reports")

def daily_report(sms, now=datetime.now):
    if now().weekday() >= 5:
        logger.info("dam oliş kuni, hisobot yöq")
        return
    sms.send("Kunlik hisobot tayyor")

def test_weekday_sends():
    sms = Mock()
    daily_report(sms, now=lambda: datetime(2026, 9, 16))  # çorşanba
    sms.send.assert_called_once_with("Kunlik hisobot tayyor")

def test_weekend_logs():
    sms = Mock()
    with unittest.TestCase().assertLogs("reports", level="INFO") as logs:
        daily_report(sms, now=lambda: datetime(2026, 9, 19))  # şanba
    sms.send.assert_not_called()
    assert logs.output == ["INFO:reports:dam oliş kuni, hisobot yöq"]

test_weekday_sends()
test_weekend_logs()
print("2 ta test ötdi")
```

```text
2 ta test ötdi
```
:::

## Xulosa

- Testlarni `tests/` ga joylang, fixturelarni `conftest.py` da ulaşing va bir qismini `-k` bilan işga tuşiring.
- Fixture `yield` dan keyin resurslarni böşata oladi. Qamrovi kengroq bölsa, undan köproq test foydalanadi.
- `monkeypatch`, `capsys` va `caplog` muhit, çiqiş va loglar bilan işlaydi.
- `Mock` çaqiruvlarni yozib boradi; `return_value` va `side_effect` ularni boşqaradi.
- Nomni **işlatilgan joyda** patch qiling va faqat taşqi boğliqliklarni mock qiling: tarmoq, vaqt, tasodifiylik.

## Qöşimça manbalar

- [unittest.mock: boşlaş](https://docs.python.org/3/library/unittest.mock-examples.html)
- [unittest.mock: Qayerda patch qiliş kerak](https://docs.python.org/3/library/unittest.mock.html#where-to-patch)
- [pytest: Fixturelardan qanday foydalaniş](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [pytest: Modullar va muhitni monkeypatch/mock qiliş](https://docs.pytest.org/en/stable/how-to/monkeypatch.html)
