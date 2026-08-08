#!/usr/bin/env python3
"""Pack or unpack the readable IB AI SL 2.6 V5 source modules.

The browser bundle is a deterministic gzip-compressed JSON archive split into small
JavaScript chunks for reliable static delivery.  No network service or third-party
runtime dependency is required; the lesson uses the browser's built-in
DecompressionStream API.
"""
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
from pathlib import Path

MODULES = {
    "styles": [
        "css/lesson-2.6-v5-core.css",
        "css/lesson-2.6-v5-responsive-ti84.css",
    ],
    "before_engine": [
        "data/lesson-2.6-v5-build.js",
        "data/lesson-2.6-v5-content-a.js",
        "data/lesson-2.6-v5-content-b.js",
        "data/lesson-2.6-v5-finalize.js",
    ],
    "after_engine": [
        "data/lesson-2.6-v5-graphics.js",
        "data/lesson-2.6-v5-interactions.js",
        "data/lesson-2.6-v5-ti84.js",
    ],
}


def build_payload(source_root: Path) -> dict[str, object]:
    def read_many(paths: list[str]) -> list[dict[str, str]]:
        return [
            {"path": path, "source": (source_root / path).read_text(encoding="utf-8")}
            for path in paths
        ]

    return {
        "format": "echs-ib-ai-2.6-v5-source-pack",
        "version": "5.0.0",
        "counts": {"slides": 96, "practice": 80, "quiz": 12, "exam": 6, "visuals": 74},
        "styles": read_many(MODULES["styles"]),
        "beforeEngine": read_many(MODULES["before_engine"]),
        "afterEngine": read_many(MODULES["after_engine"]),
    }


def pack(source_root: Path, output_dir: Path, chunk_size: int) -> None:
    payload = build_payload(source_root)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    compressed = gzip.compress(raw, compresslevel=9, mtime=0)
    encoded = base64.b64encode(compressed).decode("ascii")
    chunks = [encoded[i : i + chunk_size] for i in range(0, len(encoded), chunk_size)]
    output_dir.mkdir(parents=True, exist_ok=True)
    for old in output_dir.glob("lesson-2.6-v5-pack-*.js"):
        old.unlink()
    for index, chunk in enumerate(chunks):
        text = (
            "window.__ECHS_RV5_PACK_CHUNKS=window.__ECHS_RV5_PACK_CHUNKS||[];"
            f"window.__ECHS_RV5_PACK_CHUNKS[{index}]='{chunk}';\n"
        )
        (output_dir / f"lesson-2.6-v5-pack-{index:02d}.js").write_text(text, encoding="utf-8")
    manifest = {
        "format": payload["format"],
        "version": payload["version"],
        "chunkCount": len(chunks),
        "chunkSize": chunk_size,
        "encodedLength": len(encoded),
        "compressedBytes": len(compressed),
        "uncompressedBytes": len(raw),
        "compressedSha256": hashlib.sha256(compressed).hexdigest(),
        "payloadSha256": hashlib.sha256(raw).hexdigest(),
    }
    (output_dir / "lesson-2.6-v5-pack-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2, sort_keys=True))


def unpack(pack_dir: Path, destination: Path) -> None:
    manifest = json.loads((pack_dir / "lesson-2.6-v5-pack-manifest.json").read_text())
    chunks: list[str] = []
    for index in range(manifest["chunkCount"]):
        text = (pack_dir / f"lesson-2.6-v5-pack-{index:02d}.js").read_text()
        marker = "='"
        chunks.append(text.split(marker, 1)[1].rsplit("';", 1)[0])
    compressed = base64.b64decode("".join(chunks), validate=True)
    if hashlib.sha256(compressed).hexdigest() != manifest["compressedSha256"]:
        raise ValueError("Compressed archive SHA-256 mismatch")
    raw = gzip.decompress(compressed)
    if hashlib.sha256(raw).hexdigest() != manifest["payloadSha256"]:
        raise ValueError("Payload SHA-256 mismatch")
    payload = json.loads(raw)
    for group in ("styles", "beforeEngine", "afterEngine"):
        for module in payload[group]:
            path = destination / module["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(module["source"], encoding="utf-8")
    print(f"Unpacked {sum(len(payload[g]) for g in ('styles','beforeEngine','afterEngine'))} modules to {destination}")


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p_pack = sub.add_parser("pack")
    p_pack.add_argument("source_root", type=Path)
    p_pack.add_argument("output_dir", type=Path)
    p_pack.add_argument("--chunk-size", type=int, default=7000)
    p_unpack = sub.add_parser("unpack")
    p_unpack.add_argument("pack_dir", type=Path)
    p_unpack.add_argument("destination", type=Path)
    args = parser.parse_args()
    if args.command == "pack":
        pack(args.source_root, args.output_dir, args.chunk_size)
    else:
        unpack(args.pack_dir, args.destination)


if __name__ == "__main__":
    main()
