#!/usr/bin/env python3
"""Regression checks for the authoritative combined Grade 9/10 scope."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G9 = json.loads((ROOT / "curriculum/pathways/grade-9-2026-2027.json").read_text(encoding="utf-8"))
G10 = json.loads((ROOT / "curriculum/pathways/grade-10-2026-2027.json").read_text(encoding="utf-8"))


def lesson_ids(path):
    return [[lesson["id"] for lesson in unit["lessons"]] for unit in path["units"]]


def main() -> None:
    g9 = G9["paths"]["common"]
    path_a = G10["paths"]["pathA"]
    path_b = G10["paths"]["pathB"]

    assert G9["schemaVersion"] == G10["schemaVersion"] == 2
    assert "Full_Year_at_a_Glance_and_Detailed_Course_Outline" in G9["sourceDocument"]
    assert "Full_Year_at_a_Glance_and_Detailed_Course_Outline" in G10["sourceDocument"]

    assert [len(ids) for ids in lesson_ids(g9)] == [3, 6, 6, 6, 7, 5, 4, 4, 4, 4]
    assert [unit["code"] for unit in g9["units"]] == [f"Unit {i}" for i in range(10)]
    assert g9["unitCount"] == 10 and g9["lessonCount"] == 49

    assert [len(ids) for ids in lesson_ids(path_a)] == [14, 15, 15, 4]
    assert [unit["code"] for unit in path_a["units"]] == ["AP Unit 1", "AP Unit 2", "AP Unit 3", "Calculus Bridge"]
    assert lesson_ids(path_a)[0] == [f"1.{i}" for i in range(1, 15)]
    assert lesson_ids(path_a)[1] == [f"2.{i}" for i in range(1, 16)]
    assert lesson_ids(path_a)[2] == [f"3.{i}" for i in range(1, 16)]
    assert lesson_ids(path_a)[3] == [f"E.{i}" for i in range(1, 5)]
    assert path_a["unitCount"] == 4 and path_a["lessonCount"] == 48
    assert [package["id"] for package in path_a["requiredPackages"]] == ["AP-REVIEW"]
    assert path_a["supplementalUnits"][0]["code"] == "AP Unit 4"
    assert path_a["supplementalUnits"][0]["required"] is False

    assert [len(ids) for ids in lesson_ids(path_b)] == [3, 8, 9, 10, 5, 4]
    assert [unit["code"] for unit in path_b["units"]] == [f"R{i}" for i in range(6)]
    assert path_b["unitCount"] == 6 and path_b["lessonCount"] == 39
    assert [package["id"] for package in path_b["requiredPackages"]] == ["R1.G", "R2.G"]

    placement = json.dumps(G9["authoritativeScope"]["placementGuidance"])
    transfer = json.dumps(G10["authoritativeScope"]["transferProtocol"])
    assert "85%+" in placement and "75%" in placement and "not automatic exclusions" in placement.lower()
    assert "End of Week 9" in transfer and "End of Week 17" in transfer and "catch-up" in transfer

    for path in (g9, path_a, path_b):
        for unit in path["units"]:
            for lesson in unit["lessons"]:
                assert lesson["title"] and lesson["subtopics"] and lesson["learningOutcomes"]
                if lesson["deliveryStatus"] == "ready":
                    assert lesson.get("url") != "lessons/pathways/lesson.html"

    print("Authoritative Grade 9/10 curriculum scope: PASS")


if __name__ == "__main__":
    main()
