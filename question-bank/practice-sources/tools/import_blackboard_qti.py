#!/usr/bin/env python3
"""Import Blackboard QTI-style .dat pools into private practice-bank staging.

This tool intentionally writes teacher-only staging records. It does not promote
items into the public student bank and does not assign student-ready status.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)


def clean_html(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = TAG_RE.sub(" ", value)
    return WS_RE.sub(" ", value).strip()


def formatted_text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    values = [x.text or "" for x in node.iter() if x.tag.endswith("mat_formattedtext")]
    return "\n".join(values)


def normalise_for_hash(text: str) -> str:
    text = clean_html(text).lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return WS_RE.sub(" ", text).strip()


def stable_id(source_id: str, pool_name: str, item_index: int, prompt: str) -> str:
    seed = f"{source_id}|{pool_name}|{item_index}|{normalise_for_hash(prompt)}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16].upper()
    return f"PRACTICE-{source_id}-{digest}"


def parse_dat(data: bytes, source_id: str, dat_name: str) -> list[dict]:
    root = ET.fromstring(data)
    assessment = next((x for x in root.iter() if x.tag.endswith("assessment")), None)
    pool_title = assessment.attrib.get("title", dat_name) if assessment is not None else dat_name
    records: list[dict] = []

    for index, item in enumerate((x for x in root.iter() if x.tag.endswith("item")), start=1):
        presentation = next((x for x in item if x.tag.endswith("presentation")), None)
        raw_prompt = formatted_text(presentation)
        prompt = clean_html(raw_prompt)
        media_paths = sorted(set(IMG_RE.findall(html.unescape(raw_prompt))))

        choices = []
        ident_to_label: dict[str, str] = {}
        for choice_index, label in enumerate((x for x in item.iter() if x.tag.endswith("response_label"))):
            ident = label.attrib.get("ident", "")
            letter = chr(65 + choice_index)
            text = clean_html(formatted_text(label))
            choices.append({"label": letter, "text": text, "sourceIdent": ident, "mediaIds": []})
            ident_to_label[ident] = letter

        correct_idents = []
        for varequal in (x for x in item.iter() if x.tag.endswith("varequal")):
            if varequal.text and varequal.text.strip():
                correct_idents.append(varequal.text.strip())
        correct_labels = [ident_to_label[x] for x in correct_idents if x in ident_to_label]

        feedback = []
        for node in (x for x in item.iter() if x.tag.endswith("itemfeedback")):
            text = clean_html(formatted_text(node))
            if text:
                feedback.append(text)

        record = {
            "id": stable_id(source_id, pool_title, index, prompt),
            "bank": "ECHS Practice Bank",
            "sourceId": source_id,
            "sourcePool": pool_title,
            "sourceFile": dat_name,
            "sourceItemIndex": index,
            "type": "mcq" if choices else "constructed-response",
            "format": "single-select" if choices else "open-response",
            "prompt": prompt,
            "rawSourceHtml": raw_prompt,
            "choices": choices,
            "answer": correct_labels[0] if len(correct_labels) == 1 else correct_labels,
            "acceptedAnswers": correct_labels,
            "sourceFeedback": feedback,
            "media": [
                {
                    "id": f"MEDIA-{hashlib.sha1(path.encode()).hexdigest()[:12].upper()}",
                    "sourcePath": path,
                    "path": "",
                    "mime": "image/jpeg",
                    "alt": "Source figure; accessibility description pending review.",
                    "verificationStatus": "source-asset-unreviewed"
                }
                for path in media_paths
            ],
            "classification": {
                "course": "",
                "unit": None,
                "topic": "",
                "lessonIds": [],
                "keywords": []
            },
            "quality": {
                "status": "teacher-only-staging",
                "needsReview": True,
                "duplicateStatus": "unchecked",
                "transcriptionVerified": False,
                "answerVerified": False,
                "katexVerified": False,
                "mediaVerified": False,
                "mappingVerified": False,
                "studentReady": False
            },
            "rights": {
                "rightsStatus": "permission-required",
                "publicPublicationAllowed": False,
                "accessLevel": "school-internal"
            }
        }
        if prompt or choices:
            records.append(record)
    return records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--media-output", type=Path)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.media_output:
        args.media_output.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    with zipfile.ZipFile(args.archive) as archive:
        dat_names = sorted(x for x in archive.namelist() if x.lower().endswith(".dat"))
        for dat_name in dat_names:
            for record in parse_dat(archive.read(dat_name), args.source_id, dat_name):
                if args.limit and len(records) >= args.limit:
                    break
                if args.media_output:
                    for media in record["media"]:
                        source_path = media["sourcePath"].lstrip("/")
                        try:
                            payload = archive.read(source_path)
                        except KeyError:
                            continue
                        ext = Path(source_path).suffix.lower() or ".jpg"
                        target_name = f'{record["id"]}-{media["id"]}{ext}'
                        target = args.media_output / target_name
                        target.write_bytes(payload)
                        media["path"] = target_name
                records.append(record)
            if args.limit and len(records) >= args.limit:
                break

    payload = {
        "schemaVersion": "1.0.0",
        "sourceId": args.source_id,
        "recordCount": len(records),
        "visibility": "teacher-only-staging",
        "questions": records
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
