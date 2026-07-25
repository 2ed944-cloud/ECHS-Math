#!/usr/bin/env python3
"""Convert Pearson/TestGen Blackboard QTI `.dat` pools for ECHS Practice Studio.

The publisher source is treated as authoritative. Every source item and duplicate
version is retained and made student-accessible. The importer performs technical
normalisation only; it does not conduct an independent mathematical audit.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
POOL_RE = re.compile(r"Chapter\s+(\d+)\s+-\s+Instructor Test Items\s+-\s+([0-9A-Za-z.]+)\s+(.*?)\s+-\s+(\d+)\s+(.*)")


def clean_html(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = TAG_RE.sub(" ", value)
    return WS_RE.sub(" ", value).strip()


def formatted_text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    values = [x.text or "" for x in node.iter() if x.tag.endswith("mat_formattedtext")]
    return "\n".join(values)


def original_id(item: ET.Element, fallback: str) -> str:
    return item.attrib.get("ident") or fallback


def choice_type(choice_count: int, correct_count: int) -> tuple[str, str]:
    if choice_count == 2:
        return "true_false", "single-select"
    if choice_count:
        return "mcq", "multiple-select" if correct_count > 1 else "single-select"
    return "essay", "open-response"


def section_info(pool_title: str) -> dict:
    match = POOL_RE.search(pool_title)
    if not match:
        return {"chapter": None, "section": "", "section_title": "", "skill_number": None, "skill_title": ""}
    return {
        "chapter": int(match.group(1)),
        "section": match.group(2),
        "section_title": match.group(3).strip(),
        "skill_number": int(match.group(4)),
        "skill_title": match.group(5).strip(),
    }


def stable_question_id(bank_code: str, pool_number: int, item_number: int) -> str:
    return f"{bank_code}-P{pool_number:05d}-Q{item_number:04d}"


def stable_choice_id(source_ident: str, question_id: str, index: int) -> str:
    if source_ident:
        return source_ident
    return hashlib.sha1(f"{question_id}|{index}".encode()).hexdigest()[:32].upper()


def replace_image_sources(raw_html: str, package_path: str) -> tuple[str, list[dict], set[str]]:
    source_html = html.unescape(raw_html or "")
    images: list[dict] = []
    paths: set[str] = set()

    def replacement(match: re.Match) -> str:
        full = match.group(0)
        source_path = match.group(1).lstrip("/")
        paths.add(source_path)
        alt_match = re.search(r'alt=["\']([^"\']*)["\']', full, re.I)
        alt = html.escape(html.unescape(alt_match.group(1)) if alt_match else "Source figure", quote=True)
        images.append({"src": source_path, "alt": html.unescape(alt), "package": package_path})
        return (
            f'<img alt="{alt}" class="question-media bbzip-pending" loading="lazy" '
            f'data-bbzip-package="{package_path}" data-bbzip-path="{html.escape(source_path, quote=True)}" '
            'src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />'
        )

    return IMG_RE.sub(replacement, source_html), images, paths


def parse_pool(data: bytes, config: dict, dat_name: str, pool_number: int, package_path: str) -> tuple[list[dict], set[str]]:
    root = ET.fromstring(data)
    assessment = next((x for x in root.iter() if x.tag.endswith("assessment")), None)
    pool_title = assessment.attrib.get("title", dat_name) if assessment is not None else dat_name
    section = section_info(pool_title)
    questions: list[dict] = []
    media_paths: set[str] = set()

    for item_number, item in enumerate((x for x in root.iter() if x.tag.endswith("item")), start=1):
        question_id = stable_question_id(config["bank_code"], pool_number, item_number)
        presentation = next((x for x in item if x.tag.endswith("presentation")), None)
        raw_prompt = formatted_text(presentation)
        prompt_html, prompt_images, prompt_paths = replace_image_sources(raw_prompt, package_path)
        media_paths.update(prompt_paths)

        source_choices = list(x for x in item.iter() if x.tag.endswith("response_label"))
        correct_idents = [x.text.strip() for x in item.iter() if x.tag.endswith("varequal") and x.text and x.text.strip()]
        ident_to_choice: dict[str, str] = {}
        choices: list[dict] = []
        images = list(prompt_images)
        for choice_index, label in enumerate(source_choices):
            source_ident = label.attrib.get("ident", "")
            choice_id = stable_choice_id(source_ident, question_id, choice_index)
            raw_choice = formatted_text(label)
            choice_html, choice_images, choice_paths = replace_image_sources(raw_choice, package_path)
            media_paths.update(choice_paths)
            images.extend(choice_images)
            choices.append({
                "id": choice_id,
                "label": chr(65 + choice_index),
                "html": choice_html,
                "text": clean_html(raw_choice),
            })
            ident_to_choice[source_ident] = choice_id

        correct_choice_ids = [ident_to_choice[x] for x in correct_idents if x in ident_to_choice]
        q_type, q_format = choice_type(len(choices), len(correct_choice_ids))
        feedback: dict[str, str] = {}
        for node in (x for x in item.iter() if x.tag.endswith("itemfeedback")):
            value = formatted_text(node)
            if value:
                feedback[node.attrib.get("ident", f"feedback-{len(feedback)+1}")] = value

        questions.append({
            "id": question_id,
            "source_object_id": original_id(item, question_id),
            "bank_code": config["bank_code"],
            "pool_id": f"{pool_number:05d}",
            "pool_uid": f'{config["bank_code"]}:{pool_number:05d}',
            "pool_title": pool_title,
            "bank": {
                "code": config["bank_code"],
                "title": config["title"],
                "authors": config.get("authors", "Pearson Education"),
                "edition": config.get("edition", "Blackboard pool export"),
                "isbn": config.get("isbn", ""),
                "resource_isbn": config.get("resource_isbn", ""),
                "format": "Pearson TestGen Blackboard QTI pool export",
            },
            "source": {
                **section,
                "publisher_format": "Pearson TestGen Blackboard QTI pool export",
                "original_question_number": item_number,
                "source_file": dat_name,
            },
            "classification": {
                "ap_unit": config.get("default_ap_unit"),
                "ap_unit_label": config.get("default_ap_unit_label", ""),
                "ap_topic": None,
                "ap_topic_title": None,
                "ap_scope": config.get("ap_scope", "ap-precalculus"),
                "course_scope": config.get("course_scope", "AP Precalculus / Precalculus"),
                "alignment_confidence": "source_chapter_crosswalk",
                "alignment_basis": "source_chapter_and_section",
                "crosswalk_status": "automatic_source_alignment",
                "crosswalk_note": "Imported directly from the publisher Blackboard pool.",
                "framework": config.get("framework", "AP Precalculus Course and Exam Description"),
            },
            "type": q_type,
            "format": q_format,
            "prompt_html": prompt_html,
            "prompt_text": clean_html(raw_prompt),
            "choices": choices,
            "correct_choice_ids": correct_choice_ids,
            "correct_choice_indices": [i for i,c in enumerate(choices) if c["id"] in correct_choice_ids],
            "accepted_answers": [],
            "solution_html": "",
            "solution_text": "",
            "feedback_html": feedback,
            "images": images,
            "metadata": {
                "source_difficulty": "School",
                "difficulty": None,
                "calculator": None,
                "estimated_seconds": 90,
                "shuffle_choices": True,
                "review_status": "publisher_source_authoritative",
                "math_format": "publisher_images_and_html",
                "student_accessible": True,
                "student_ready": True,
                "retain_duplicate": True,
            },
        })
    return questions, media_paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--media-root", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    args.output_root.mkdir(parents=True, exist_ok=True)
    args.media_root.mkdir(parents=True, exist_ok=True)

    chapters: dict[int, list[dict]] = defaultdict(list)
    chapter_media: dict[int, set[str]] = defaultdict(set)
    type_counts: Counter[str] = Counter()
    total = 0

    with zipfile.ZipFile(args.archive) as archive:
        dat_names = sorted(name for name in archive.namelist() if name.lower().endswith(".dat"))
        for pool_number, dat_name in enumerate(dat_names, start=1):
            package_placeholder = ""
            preliminary = section_info(dat_name)
            chapter_guess = preliminary.get("chapter") or 0
            package_path = f'assets/blackboard-packages/{config["bank_slug"]}/chapter_{chapter_guess:02d}.zip'
            questions, paths = parse_pool(archive.read(dat_name), config, dat_name, pool_number, package_path)
            for question in questions:
                chapter = question["source"].get("chapter") or 0
                correct_package = f'assets/blackboard-packages/{config["bank_slug"]}/chapter_{chapter:02d}.zip'
                if correct_package != package_path:
                    question["prompt_html"] = question["prompt_html"].replace(package_path, correct_package)
                    for choice in question["choices"]:
                        choice["html"] = choice["html"].replace(package_path, correct_package)
                    for image in question["images"]:
                        image["package"] = correct_package
                question["classification"]["ap_unit"] = config.get("chapter_to_ap_unit", {}).get(str(chapter), config.get("default_ap_unit"))
                chapters[chapter].append(question)
                type_counts[question["type"]] += 1
                total += 1
                if args.limit and total >= args.limit:
                    break
            for question in questions:
                chapter_media[question["source"].get("chapter") or 0].update(paths)
            if args.limit and total >= args.limit:
                break

        for chapter, questions in sorted(chapters.items()):
            target = args.output_root / f"chapter_{chapter:02d}.json"
            target.write_text(json.dumps({
                "id": f'{config["bank_code"]}_{chapter}',
                "label": f'{config["title"]} · Chapter {chapter}',
                "questions": questions,
            }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            package = args.media_root / f"chapter_{chapter:02d}.zip"
            with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED) as output_zip:
                for source_path in sorted(chapter_media[chapter]):
                    try:
                        output_zip.writestr(source_path, archive.read(source_path))
                    except KeyError:
                        pass

    print(json.dumps({"bank": config["bank_code"], "questions": total, "chapters": len(chapters), "typeCounts": type_counts}, default=dict))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
