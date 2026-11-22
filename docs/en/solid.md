---
title: SOLID Principles
description: "Five design principles for classes that stay easy to change, each shown in Python with a violation, a fix, UML class diagrams, runnable examples and exercises."
---

# SOLID Principles

<div class="course-intro">SOLID is an acronym for five design principles collected and popularized by Robert C. Martin (Uncle Bob); Michael Feathers coined the acronym around 2004. They guide you toward code that is maintainable, flexible and easy to extend.</div>

Each lesson starts with an existing class design, then introduces a requirement that exposes a problem with it. The lesson works through a revised design. UML diagrams show the structure of both versions. Each lesson includes examples and exercises with solutions. A checkpoint quiz closes the unit.

**[Start with Single Responsibility →](/en/lessons/single-responsibility)** · [Back to the course overview](/en/)

## What you should already know

The lessons build on these topics from the main course and the first unit. If one is unfamiliar, read that lesson first.

- Inheritance and object design: *Inheritance and super()*, *Composition vs. Inheritance*
- Abstract base classes and duck typing: *Polymorphism, Duck Typing, and Abstract Classes*
- *Type Hints* and *Dataclasses*, which the examples use throughout
- From the first unit: *Pythonic Design Patterns* and *Testing in Depth*

## Lessons

| Lesson | You'll be able to |
| --- | --- |
| **S** · [Single Responsibility](/en/lessons/single-responsibility) | Split a class that changes for several reasons into classes with one reason each |
| **O** · [Open/Closed](/en/lessons/open-closed) | Add a new case by writing a new class instead of editing an `if`/`isinstance` chain |
| **L** · [Liskov Substitution](/en/lessons/liskov-substitution) | Tell when a subclass breaks the promises of its base class, as `Square` does to `Rectangle` |
| **I** · [Interface Segregation](/en/lessons/interface-segregation) | Shape interfaces around the methods their callers need |
| **D** · [Dependency Inversion](/en/lessons/dependency-inversion) | Pass dependencies in through an abstraction, so you can swap them and test with fakes |

Go in order if you can. Each lesson stands on its own, but later ones point back to earlier ones: Interface Segregation builds on Liskov Substitution, and Dependency Inversion finishes what Single Responsibility starts.

## What you need

Examples with a Run button use the standard library and run in the browser. In the class diagrams, a box is a class (an abstract one is marked «abstract» and has its name in italics), a solid line with a hollow triangle means "inherits from", a dashed arrow means "uses", and red marks the part that causes trouble. To run the examples on your own computer you need Python 3.10 or newer, for type hints such as `Payment | None`; *Installing Python* covers the setup. The original short pages, with each example as a standalone script, are on the [SOLID Principles in Python](https://codeuz-edu.github.io/solid-python/) site.
