---
title: Advanced Python
description: "Python yoza oladiganlar uçun qisqa yönaliş: dekoratorlar, maʼlumot modeli, kontekst menejerlari, async, oqimlar va jarayonlar, samaradorlik, loyihalaş andozalari va testlaşni çuqurroq örganiş."
---

# Advanced Python

<div class="course-intro">Siz <code>@property</code>, <code>with</code> va <code>@pytest.mark.parametrize</code> dan foydalangansiz. Bu yönaliş ular qanday işlaşini va özingiz şunday vositalarni qanday yozişni körsatadi.</div>

Bu bölim [asosiy darslikni](https://codeuz-edu.github.io/python-tutorials/uz/) tugatganlar va Pythonda muntazam kod yozadiganlar uçun. Sakkizta darsdan keyin loyiha bor. Darslarda kodni bajara olasiz, xato xabarlarini öqiysiz va maşqlarni yeçasiz. Bölim oxirida nazorat testi bor.

**[«Closure va dekoratorlar» darsidan boşlaş →](/uz/lessons/closures-and-decorators)** · [Asosiy darslikka qaytiş](https://codeuz-edu.github.io/python-tutorials/uz/)

## Nimalarni biliş kerak

Darslar asosiy darslikdagi quyidagi mavzularga tayanadi. Birortasi notaniş bölsa, avval öşa darsni öqing.

- Funksiyalarni qiymat sifatida uzatiş: *Lambda va yuqori tartibli funksiyalar*
- Klasslar yoziş: *Xossalar va inkapsulyatsiya*, *Obyektlarni ifodalaş va taqqoslaş*, *Operatorlar va konteynerlar*
- *Dataclasslar*
- *with operatori*
- *Iteratorlar va generatorlar*
- *pytest bilan testlaş*

## Darslar

| Dars | Nimalarni qila olasiz |
| --- | --- |
| *Closure va dekoratorlar* | `functools.wraps` bilan dekoratorlar yoziş, ularga argument beriş va ustma-ust qöyiş |
| *Python maʼlumot modeli* | Atribut qidiruvi, `__slots__` va `property` ortidagi deskriptorlar qanday işlaşini tuşuntiriş |
| *Kontekst menejerlarini çuqurroq örganiş* | Klass asosidagi kontekst menejerlarini yoziş va bir neça resursni `ExitStack` bilan boşqariş |
| *Async va await* | Korutinalarni `gather` va `TaskGroup` bilan bir vaqtda işga tuşiriş hamda async qaçon foyda berişini aniqlaş |
| *Xotira va samaradorlik* | Optimallaştirişdan oldin vaqt va xotirani `timeit`, `tracemalloc` va `cProfile` bilan ölçaş |
| *Python tilida loyihalaş andozalari* | Strategiya, obyekt yaratuvçi funksiya, registr va kuzatuvçini Pythonda qöllaş |
| *Oqimlar va jarayonlar* | I/O-bound va CPU-bound işlar uçun oqim, jarayon yoki asyncio ni tanlaş |
| *Testlaşni çuqurroq örganiş* | Test töplamini fixturelar, `monkeypatch` va `unittest.mock` bilan tartiblaş |
| *Loyiha: Log konveyeri* | Generatorlar, dekoratorlar, kontekst menejerlari va async ni testlari bor bitta dasturda birlaştiriş |

Darslarni tartib bilan öqing. Oxirgi loyihada oldingi darslardagi usullarni bir dasturda qöllaysiz.

## Nima kerak

Misollarning köpi brauzerda işlaydi. Kompyuter uçun belgilangan misollarda Python 3.14 dan foydalaning. Brauzer tizim oqimlari va jarayonlarini boşlay olmaydi. Baʼzi pytest misollari terminalda bajariladi. Örnatiş tartibi *Pythonni örnatiş* darsida berilgan.
