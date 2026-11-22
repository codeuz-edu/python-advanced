---
layout: page
sidebar: false
title: Advanced Python
description: "Python yoza oladiganlar uçun darslik: dekoratorlar, maʼlumot modeli, async, testlaş va SOLID tamoyillari. Kod brauzerda işlaydi."
home:
  title: Pythonni çuqurroq örganing
  lead: Python asoslarini bilsangiz, bu darslikda dekoratorlar, asinxron kod, testlaş va klasslar tuzilişini davom ettirasiz. Misollarning köpini sahifada bajaring, söng maşqlarni özingiz yeçib köring.
  start: Birinçi darsni boşlaş
  resume: Davom etiş
  browse: Barça darslarni köriş
  demoLabel: Hozir sinab köring. Kodni özgartiring va işga tuşiring.
  code: |
    import functools

    def jurnal(func):
        @functools.wraps(func)
        def wrapper(*args):
            natija = func(*args)
            print(f"{func.__name__}{args} -> {natija}")
            return natija
        return wrapper

    @jurnal
    def qoş(a, b):
        return a + b

    qoş(2, 3)
    print("Endi öz funksiyangizga dekorator qöying.")
  stats:
    lessons: dars
    modules: yönaliş
    projects: loyiha
    projectCount: 1
  path:
    title: Nimalarni örganasiz
    lead: Birinçi bölimda Python vositalarini örganib, ularni jurnal tahlili loyihasida birga qöllaymiz. Ikkinçi bölimda klasslarni yangi talablarga moslaşga yordam beradigan beşta tamoyilni köramiz.
    progress: "{total} darsdan {done} tasi oçilgan"
    opened: oçilgan
    levels:
      - name: Advanced Python
        track: true
        text: Dekoratorlar, maʼlumot modeli, kontekst menejerlari, async, oqimlar va jarayonlar, samaradorlik, loyihalaş andozalari va testlaş. Oxirida birgalikda dastur tuzamiz.
        modules: ["01"]
        link: /advanced
        linkText: Yönaliş haqida
      - name: SOLID tamoyillari
        track: true
        text: Beşta tamoyilni kod misollari va UML diagrammalari bilan örganamiz.
        modules: ["02"]
        link: /solid
        linkText: Yönaliş haqida
  note: "Darslik yangi özbek lotin alifbosida yozilgan: ş, ç, ö, ğ harflari oldingi sh, ch, oʻ, gʻ örnida işlatiladi."
  closing:
    title: Birinçi darsdan boşlang
    text: Birinçi dars closure va dekoratorlar haqida. Siz işlatib kelgan köp vositalar şu ğoyaga asoslangan.
    playground: Sinov maydonçasini oçiş
---

<CourseHome />
