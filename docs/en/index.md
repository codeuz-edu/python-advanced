---
layout: page
sidebar: false
title: Advanced Python
description: "A course for people who already write Python: decorators, the data model, async, testing and the SOLID principles, with code you can run in the browser."
home:
  title: Go deeper into Python
  lead: Build on the Python you already know. Follow examples of decorators, asynchronous code, testing, and class design, then try the exercises. Most examples run on the page.
  start: Start the first lesson
  resume: Continue
  browse: See all lessons
  demoLabel: Try it now. Change the code and press Run.
  code: |
    import functools

    def logged(func):
        @functools.wraps(func)
        def wrapper(*args):
            result = func(*args)
            print(f"{func.__name__}{args} -> {result}")
            return result
        return wrapper

    @logged
    def add(a, b):
        return a + b

    add(2, 3)
    print("Now decorate a function of your own.")
  stats:
    lessons: lessons
    modules: units
    projects: guided project
    projectCount: 1
  path:
    title: What you will learn
    lead: The first unit explains Python's tools and brings them together in a log-analysis project. The second uses five design principles to show how classes can accommodate new requirements.
    progress: "{done} of {total} lessons opened"
    opened: opened
    levels:
      - name: Advanced Python
        track: true
        text: Decorators, the data model, context managers, async, threads and processes, performance, design patterns and deeper testing, with a project at the end.
        modules: ["01"]
        link: /advanced
        linkText: Unit overview
      - name: SOLID Principles
        track: true
        text: Five design principles, each with a wrong and a right example and a UML diagram.
        modules: ["02"]
        link: /solid
        linkText: Unit overview
  closing:
    title: Start with the first lesson
    text: It covers closures and decorators, the idea behind many of the tools you already use.
    playground: Open the playground
---

<CourseHome />
