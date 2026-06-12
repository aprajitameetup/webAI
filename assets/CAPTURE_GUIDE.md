# Demo capture guide (for README GIFs)

Short, optimized GIFs of the running app, for the README and for Medium/LinkedIn.
Record on your machine — drop the files in this `assets/` folder using the exact names below,
and the README image references will line up.

## Tool

- **ScreenToGif** (Windows, free): record a screen region → trim → export GIF. Best fit for this.
- Or **OBS** to capture MP4 (better for the video / LinkedIn), then convert to GIF with
  `ffmpeg`/`gifski` if you also want a GIF.

## Settings (keep the README fast)

- Width ≤ 800 px, ~12–15 fps, trim to under ~10 seconds.
- Aim for under ~3–5 MB per GIF. ScreenToGif's optimizer or `gifski` helps.

## Shortlist — record these six (high impact); skip the rest

| Filename | Demo | What to capture |
|---|---|---|
| `webllm-chat.gif` | On-device chat (WebLLM) | Ask a question, tokens stream in. Ideally toggle DevTools → Network → Offline first to show it answering with no network. |
| `builtin-prompt.gif` | Built-in AI — Prompt | A prompt streaming back from Gemini Nano. |
| `pyodide.gif` | Pyodide | Tap the NumPy example, the array + result appear. |
| `mediapipe-face.gif` | MediaPipe | Pick a face photo, the mesh draws over it. |
| `onnx-mnist.gif` | ONNX Runtime Web | Draw a digit, it predicts with confidence. |
| `transformers-sentiment.gif` | Transformers.js | Tap the positive then negative chip — label flips. |

## Once the files are here

Paste these where each demo is described in `README.md` (or ask and they'll be inserted):

```md
![On-device chat (WebLLM)](assets/webllm-chat.gif)
![Built-in AI Prompt (Gemini Nano)](assets/builtin-prompt.gif)
![Pyodide — Python in the browser](assets/pyodide.gif)
![MediaPipe face landmarks](assets/mediapipe-face.gif)
![ONNX Runtime Web — draw a digit](assets/onnx-mnist.gif)
![Transformers.js sentiment](assets/transformers-sentiment.gif)
```

A single hero GIF (`webllm-chat.gif`) near the top of the README, with the rest beside their
table rows, reads best.
