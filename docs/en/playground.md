---
title: Playground
description: "Run Python in your browser: an editor for quick experiments."
---

# Playground

Try out small ideas here. Press **Ctrl + Enter** (Mac: **⌘ + Enter**) to run your code. **Stop** restarts the Python session.

<ClientOnly><PythonPlayground /></ClientOnly>

## Good to know

- Each run starts with fresh variables.
- When your code calls `input()`, the editor shows the prompt. Enter an answer to rerun the program with the answers collected so far.
- Files you create exist only in the browser and disappear when the session restarts.
- The editor includes the standard library, with browser limits on OS features such as native threads and processes. Ordinary runs time out after 15 seconds.
- The first import of NumPy, pandas, or Matplotlib downloads the package and gets more time to finish. Call `plt.show()` to display a chart below the output.
