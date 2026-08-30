#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  canonicalCourseKey,
  lessonAccessKey,
} from "../supabase/functions/institution-api/lesson-access-policy.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scripts = [
  "data/courses.js",
  "data/ap-calculus-update.js",
  "data/ap-precalculus-update.js",
  "data/ap-precalculus-unit-3-update.js",
  "data/ap-precalculus-unit-4-update.js",
  "data/grade-9-10-pathways.js",
  "data/ib-math-ai-unit-1-update.js",
  "data/ib-math-ai-unit-2-update.js",
  "data/ib-math-ai-unit-4-update.js",
  "data/ib-math-ai-unit-5-update.js",
  "data/ib-math-ai-unit-6-update.js",
];

const head = { appendChild() {} };
const document = {
  head,
  createElement() { return {}; },
  getElementById() { return null; },
  dispatchEvent() {},
};
const context = {
  console,
  document,
  CustomEvent: class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  },
  dispatchEvent() {},
  setTimeout,
  clearTimeout,
};
context.window = context;
vm.createContext(context);
for (const relative of scripts) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  vm.runInContext(source, context, { filename: relative });
}

const rows = [];
const seenCourses = new Set();
for (const course of context.ECHS_COURSES || []) {
  const courseKey = canonicalCourseKey(course.id || course.course || course.title);
  if (!courseKey || seenCourses.has(courseKey)) continue;
  seenCourses.add(courseKey);
  let position = 0;
  for (const [unitIndex, unit] of (course.units || []).entries()) {
    for (const lesson of unit.lessons || []) {
      if (!String(lesson?.url || "").trim()) continue;
      const topic = String(lesson.number || "").trim();
      if (!topic) continue;
      rows.push({
        access_key: lessonAccessKey(courseKey, unitIndex, topic),
        course_key: courseKey,
        unit_index: unitIndex,
        unit_title: String(unit.title || ""),
        topic,
        title: String(lesson.title || topic),
        position: position++,
        url: String(lesson.url || ""),
      });
    }
  }
}

const quote = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const values = rows.map((row) =>
  `    (${[
    quote(row.access_key), quote(row.course_key), row.unit_index,
    quote(row.unit_title), quote(row.topic), quote(row.title),
    row.position, quote(row.url), "true",
  ].join(", ")})`,
).join(",\n");
const sql = `\n-- Seed the current ready-lesson catalog for every existing organization.
insert into public.lesson_catalog (
  organization_id, access_key, course_key, unit_index, unit_title, topic, title, position, url, is_ready
)
select organization.id, seed.*
from public.organizations organization
cross join (values
${values}
) as seed(access_key, course_key, unit_index, unit_title, topic, title, position, url, is_ready)
on conflict (organization_id, access_key) do update set
  course_key = excluded.course_key,
  unit_index = excluded.unit_index,
  unit_title = excluded.unit_title,
  topic = excluded.topic,
  title = excluded.title,
  position = excluded.position,
  url = excluded.url,
  is_ready = excluded.is_ready,
  updated_at = now();
`;

if (process.argv.includes("--append-migration")) {
  const target = path.join(root, "supabase/migrations/202608300001_lesson_visibility_progression.sql");
  const current = fs.readFileSync(target, "utf8").replace(/\n-- Seed the current ready-lesson catalog[\s\S]*$/, "");
  fs.writeFileSync(target, `${current.trimEnd()}\n${sql}`, "utf8");
  console.log(`Seeded ${rows.length} ready lessons across ${seenCourses.size} courses.`);
} else {
  process.stdout.write(sql);
}
