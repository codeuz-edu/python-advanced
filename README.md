<img src="assets/banner.png" alt="codeuz: Advanced Python">

# Advanced Python

A course for people who already write Python, in English and Uzbek. Most examples run in the browser. The lessons mark examples that need a local Python installation. For programming videos in Uzbek, see the [codeuz](https://youtube.com/codeuz) YouTube channel.

**[Özbekça](https://codeuz-edu.github.io/python-advanced/uz/)** · **[English](https://codeuz-edu.github.io/python-advanced/en/)**

The first unit covers decorators, the data model, context managers, concurrency, performance, design patterns, and testing. It ends with a project. The second unit works through the five SOLID principles.

New to Python? Start with [Python Foundations](https://codeuz-edu.github.io/python-tutorials/).

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

## Check the lessons

```sh
python3 scripts/examples.py   # checks runnable Python blocks in the lessons
python3 scripts/lint.py       # checks each lesson against the lesson template
```

## SOLID example files

Each SOLID lesson has two companion scripts. One shows the original design, and the other shows the revised design.

```sh
python3 examples/solid/01-srp/violation.py
python3 examples/solid/01-srp/correct.py
```

## License

[MIT](LICENSE)
