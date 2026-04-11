import urllib.request
import os

models = [
    (
        "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx",
        "models/emotion-ferplus-8.onnx",
    ),
]

os.makedirs("models", exist_ok=True)

for url, path in models:
    if not os.path.exists(path):
        print(f"Downloading {path}...")
        urllib.request.urlretrieve(url, path)
        print(f"Done: {path}")
    else:
        print(f"Already exists: {path}")