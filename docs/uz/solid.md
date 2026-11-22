---
title: SOLID tamoyillari
description: "Özgartiriş oson bölgan klasslar uçun beşta dizayn tamoyili: har biri Pythonda notöğri va töğri yondaşuv, UML klass diagrammalari, işga tuşiriladigan misollar va maşqlar bilan körsatilgan."
---

# SOLID tamoyillari

<div class="course-intro">SOLID — Robert C. Martin ommalaştirgan beşta loyihalaş tamoyilining qisqa nomi. Ular yangi talab kelganda kodning qaysi qismini özgartiriş kerakligini aniqlaşga yordam beradi.</div>

Bu bölimda har bir tamoyilga bitta dars ajratilgan. Avval klasslarning dastlabki tuzilişini köramiz. Keyin yangi talab qaysi muammoni oçib berganini va uni qanday tuzatiş mumkinligini tahlil qilamiz. UML diagrammasi ikkala tuzilmani körsatadi. Har bir darsda misollar va yeçimli maşqlar, bölim oxirida esa nazorat testi bor.

**[«Single Responsibility» darsidan boşlaş →](/uz/lessons/single-responsibility)** · [Darslik haqida sahifaga qaytiş](/uz/)

## Nimalarni biliş kerak

Darslar asosiy darslik va birinçi yönalişdagi quyidagi mavzularga tayanadi. Birortasi notaniş bölsa, avval öşa darsni öqing.

- Vorislik va obyektlarni loyihalaş: *Vorislik va super()*, *Kompozitsiya yoki vorislik?*
- Abstrakt asosiy klasslar va duck typing: *Polimorfizm, duck typing va abstrakt klasslar*
- Misollarda doim işlatiladigan *Type hintlar* va *Dataclasslar*
- Birinçi yönalişdan: *Python tilida loyihalaş andozalari* va *Testlaşni çuqurroq örganiş*

## Darslar

| Dars | Nimalarni qila olasiz |
| --- | --- |
| **S** · [Single Responsibility](/uz/lessons/single-responsibility) | Bir neça sabab bilan özgaradigan klassni har biri bitta sababga ega klasslarga ajratiş |
| **O** · [Open/Closed](/uz/lessons/open-closed) | `if`/`isinstance` zanjirini tahrirlaş örniga yangi klass yozib, yangi holat qöşiş |
| **L** · [Liskov Substitution](/uz/lessons/liskov-substitution) | Voris klass asosiy klassning vaʼdalarini qaçon buzişini aniqlaş, xuddi `Square` `Rectangle` ga qilgani kabi |
| **I** · [Interface Segregation](/uz/lessons/interface-segregation) | Interfeysni çaqiruvçiga kerakli amallarga qarab ajratiş |
| **D** · [Dependency Inversion](/uz/lessons/dependency-inversion) | Boğliqlikni argument qilib uzatiş va testda uning örinbosaridan foydalaniş |

Iloji bölsa, tartib bilan boring. Har bir dars mustaqil, lekin keyingilari oldingilariga qaytib murojaat qiladi: Interface Segregation Liskov Substitution ga tayanadi, Dependency Inversion esa Single Responsibility boşlagan işni yakunlaydi.

## Nima kerak

Işga tuşiriş tugmasi bor misollar brauzerda işlaydi va standart kutubxonadan foydalanadi. Klass diagrammalarida har bir quti - klass (abstrakt klass «abstract» deb belgilangan va nomi kursivda yozilgan), içi böş uçburçakli tutaş çiziq "meros oladi", uzuq-uzuq strelka "foydalanadi" degani, qizil rang esa muammo tuğdiradigan qismni körsatadi. Misollarni öz kompyuteringizda işga tuşiriş uçun `Payment | None` kabi type hintlar sababli Python 3.10 yoki undan yangi versiya kerak; örnatiş tartibi *Pythonni örnatiş* darsida berilgan. Har bir misol alohida skript bölgan dastlabki qisqa sahifalar [Pythonda SOLID tamoyillari](https://codeuz-edu.github.io/solid-python/) saytida.
