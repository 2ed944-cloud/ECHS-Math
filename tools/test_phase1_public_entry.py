#!/usr/bin/env python3
"""Regression checks for the Phase 1 public entry and role-routed access shell."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        raise AssertionError(f"Missing required file: {path}")
    return target.read_text(encoding="utf-8")


def require(text: str, token: str, label: str) -> None:
    if token not in text:
        raise AssertionError(f"{label} is missing required marker: {token}")


def forbid(text: str, token: str, label: str) -> None:
    if token in text:
        raise AssertionError(f"{label} exposes forbidden public marker: {token}")


def main() -> None:
    public_home = read("index.html")
    library = read("learning-library.html")
    login = read("login.html")
    portal = read("js/institution-portal.js")
    gate = read("js/institution-gate.js")

    for marker in (
        "One secure account.",
        'id="institutionEntry"',
        'href="login.html"',
        "Role-based access",
        "js/institution-client.js",
        "js/institution-portal.js",
    ):
        require(public_home, marker, "public home")

    for marker in (
        'id="courses"',
        "data/courses.js",
        'href="question-bank/practice.html',
        'href="question-bank/exam.html',
        'href="question-bank/dashboard.html',
        'href="question-bank/official/',
        "Publisher questions",
        "Publisher collections",
    ):
        forbid(public_home, marker, "public home")

    for marker in (
        'data-institution-guard="teacher,admin"',
        'name="robots" content="noindex,nofollow"',
        "js/institution-gate.js",
        "data/courses.js",
        'id="courses"',
        'id="courseList"',
        'id="units"',
        "Protected workspace",
    ):
        require(library, marker, "protected course library")

    for marker in ("Publisher questions", "Publisher collections"):
        forbid(library, marker, "protected course library")

    require(login, "routed automatically to the correct workspace", "login page")
    require(login, "No public registration", "login page")
    forbid(login, "Student preview", "login page")
    forbid(login, "Teacher preview", "login page")
    forbid(login, "Admin preview", "login page")

    for marker in (
        'current.role==="teacher"||current.role==="admin"',
        'ECHSInstitution.roleHome(current.role)',
        'document.body.dataset.accessRole=current.role',
        'learning-library.html',
    ):
        require(portal, marker, "institution portal routing")

    for marker in (
        'root.dataset.authGuardState="checking"',
        'ECHSInstitution.requireAuth(requested)',
        'root.dataset.authGuardState="blocked"',
        "Protected learning content remains closed",
        'root.dataset.authGuardState="ready"',
    ):
        require(gate, marker, "institution role guard")

    forbid(gate, "document.documentElement.textContent", "institution role guard")
    forbid(gate, "document.write", "institution role guard")

    print("Phase 1 public entry and role routing: PASS")


if __name__ == "__main__":
    main()
