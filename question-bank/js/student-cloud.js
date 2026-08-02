(async () => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    X = window.ECHSExperience;
  const esc = X.escapeHTML;
  const dailyGoal = Number(
      localStorage.getItem("echs_student_daily_goal") || 10,
    ),
    weeklyGoal = Number(
      localStorage.getItem("echs_student_weekly_minutes") || 120,
    );
  $("dailyGoal").textContent = dailyGoal;
  $("weeklyGoal").textContent = weeklyGoal;

  const previewData = {
    student: { display_name: "Amina Hassan", grade: "11" },
    counters: {
      mastery: 74,
      accuracy: 86,
      questions_today: 7,
      streak: 12,
      review_due: 4,
      open_mistakes: 6,
      mastered_topics: 9,
      total_topics: 16,
      weekly_minutes: 94,
      attempts: 186,
    },
    mastery: [
      {
        title: "Polynomial and Rational Functions",
        course: "AP Precalculus",
        unit: "1",
        level: "Mastered",
        score: 89,
      },
      {
        title: "Exponential and Logarithmic Functions",
        course: "AP Precalculus",
        unit: "2",
        level: "Proficient",
        score: 77,
      },
      {
        title: "Trigonometric and Polar Functions",
        course: "AP Precalculus",
        unit: "3",
        level: "Developing",
        score: 58,
      },
      {
        title: "Limits and Continuity",
        course: "AP Calculus",
        unit: "1",
        level: "Proficient",
        score: 71,
      },
      {
        title: "Differentiation",
        course: "AP Calculus",
        unit: "2",
        level: "Developing",
        score: 63,
      },
    ],
    priorities: [
      {
        title: "Trigonometric equations",
        course: "AP Precalculus",
        unit: "3",
        level: "Developing",
        score: 48,
      },
      {
        title: "Derivative definition",
        course: "AP Calculus",
        unit: "2",
        level: "Developing",
        score: 57,
      },
    ],
    strengths: [
      {
        title: "Polynomial modelling",
        course: "AP Precalculus",
        unit: "1",
        level: "Mastered",
        score: 93,
      },
      {
        title: "Exponential transformations",
        course: "AP Precalculus",
        unit: "2",
        level: "Mastered",
        score: 88,
      },
    ],
    assignments: [
      {
        id: "preview-a1",
        title: "Unit 3 Targeted Review",
        description: "Strengthen trigonometric equations before Thursday.",
        activity_type: "adaptive",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        configuration: { count: 12, course: "ap-precalculus", unit: "3" },
        result: { status: "not_started" },
      },
      {
        id: "preview-a2",
        title: "Derivative Definition Check",
        description: "Short mastery check.",
        activity_type: "exam",
        due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        configuration: { count: 8, minutes: 15 },
        result: { status: "submitted" },
      },
    ],
    recent_sessions: [
      {
        mode: "adaptive",
        started_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        course: "AP Precalculus",
        unit: "3",
        correct: 8,
        total: 10,
        duration_minutes: 18,
      },
      {
        mode: "review",
        started_at: new Date(Date.now() - 86400000).toISOString(),
        course: "AP Calculus",
        unit: "1",
        correct: 5,
        total: 6,
        duration_minutes: 11,
      },
      {
        mode: "lesson",
        started_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        course: "AP Precalculus",
        unit: "2",
        correct: 0,
        total: 0,
        duration_minutes: 22,
      },
    ],
  };

  function assignmentHref(row) {
    const c = row.configuration || {},
      firstRoute = Array.isArray(c.routes) ? c.routes[0] : null,
      params = new URLSearchParams({ assignment: row.id || "" });
    if (row.title) params.set("title", row.title);
    if (c.course) params.set("course", c.course);
    if (c.banks?.[0] || c.bank) params.set("bank", c.banks?.[0] || c.bank);
    if (c.scope) params.set("scope", c.scope);
    if (firstRoute?.unit || c.unit) params.set("unit", firstRoute?.unit || c.unit);
    if (firstRoute?.topic || c.topic)
      params.set("topic", firstRoute?.topic || c.topic);
    if (c.count) params.set("count", c.count);
    if (row.activity_type === "exam")
      return `exam.html?${params}&minutes=${encodeURIComponent(c.minutes || 20)}`;
    if (row.activity_type === "lesson") return c.url || "../index.html#courses";
    params.set(
      "mode",
      row.activity_type === "review"
        ? "review"
        : row.activity_type === "adaptive"
          ? "adaptive"
          : "manual",
    );
    return `practice.html?${params}`;
  }
  function assignmentRouteSummary(row) {
    const c = row.configuration || {},
      routes = Array.isArray(c.routes) ? c.routes : [],
      banks = new Set(routes.map((route) => route.bank).filter(Boolean)),
      targets = new Set(
        routes.map((route) => `${route.unit || ""}::${route.topic || ""}`),
      );
    if (!routes.length) return "";
    return `${banks.size} assigned bank${banks.size === 1 ? "" : "s"} · ${targets.size} lesson${targets.size === 1 ? "" : "s"}`;
  }
  function skillRows(rows, empty, color = "var(--px-teal)") {
    if (!rows?.length)
      return `<div class="emptyInstitution">${esc(empty)}</div>`;
    return rows
      .map(
        (row) =>
          `<div class="premiumListRow" style="--row-color:${color}"><span class="rowIcon">${X.icon(row.score >= 80 ? "achievement" : "mastery")}</span><div><strong>${esc(row.title || row.topic || row.skill_key)}</strong><small>${esc([row.course, row.unit ? `Unit ${row.unit}` : "", row.level].filter(Boolean).join(" · "))}</small><div class="progressMini"><i style="width:${X.safePercent(row.score)}%"></i></div></div><span class="rowValue">${Math.round(Number(row.score || 0))}%</span></div>`,
      )
      .join("");
  }
  function weekData(data) {
    const days = [...Array(7)].map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        date: key(date),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        short: date.toLocaleDateString(undefined, { weekday: "narrow" }),
        value: 0,
        today: index === 6,
      };
    });
    (data.recent_sessions || []).forEach((row) => {
      const found = days.find(
        (day) => day.date === key(new Date(row.started_at)),
      );
      if (found)
        found.value += Number(
          row.duration_minutes || Math.max(8, (row.total || 0) * 2) || 0,
        );
    });
    return days;
  }
  function key(date) {
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }
  function renderJourney(mastery) {
    const groups = new Map();
    (mastery || []).forEach((row) => {
      const id = `${row.course || "Mathematics"}::${row.unit || "General"}`,
        group = groups.get(id) || {
          course: row.course || "Mathematics",
          unit: row.unit || "General",
          rows: [],
        };
      group.rows.push(row);
      groups.set(id, group);
    });
    const rows = [...groups.values()].sort(
      (a, b) =>
        String(a.course).localeCompare(String(b.course)) ||
        String(a.unit).localeCompare(String(b.unit), undefined, {
          numeric: true,
        }),
    );
    $("knowledgeBadge").textContent =
      `${mastery.length} topic${mastery.length === 1 ? "" : "s"}`;
    $("journeyUnits").innerHTML = rows.length
      ? rows
          .map((group, index) => {
            const score = Math.round(
                group.rows.reduce(
                  (sum, row) => sum + Number(row.score || 0),
                  0,
                ) / group.rows.length,
              ),
              colors = [
                "var(--px-teal)",
                "var(--px-gold)",
                "var(--px-maroon)",
                "var(--px-navy-2)",
              ];
            return `<div class="journeyUnit" style="--unit-color:${colors[index % colors.length]}"><span class="journeyNode">U${esc(group.unit)}</span><div><h4>${esc(group.course)} · Unit ${esc(group.unit)}</h4><p>${group.rows.length} mapped skill${group.rows.length === 1 ? "" : "s"} · ${score >= 85 ? "Mastered" : score >= 65 ? "Proficient" : score >= 40 ? "Developing" : "Starting"}</p><div class="progressMini" style="--row-color:${colors[index % colors.length]}"><i style="width:${score}%"></i></div></div><span class="journeyPercent">${score}%</span></div>`;
          })
          .join("")
      : `<div class="emptyInstitution"><h3>Your knowledge map is ready to grow</h3><p>Complete your first adaptive set to place the first skill.</p></div>`;
    $("masteryList").innerHTML = skillRows(mastery, "No mastery evidence yet.");
  }
  function renderAchievements(data) {
    const local = window.ECHSLearning?.earnedAchievements?.() || [],
      earned = local
        .filter((row) => row.earned)
        .slice(-4)
        .reverse();
    const fallback = [
      {
        icon: "🔥",
        title: `${data.counters?.streak || 0}-day momentum`,
        description: "Learned on consecutive days.",
        earned: true,
      },
      {
        icon: "★",
        title: "Topic master",
        description: `${data.counters?.mastered_topics || 0} topics currently mastered.`,
        earned: (data.counters?.mastered_topics || 0) > 0,
      },
      {
        icon: "↻",
        title: "Recovery mindset",
        description: "Returned to a mistake and improved it.",
        earned: (data.counters?.attempts || 0) > 20,
      },
      {
        icon: "100",
        title: "Century",
        description: "Completed more than 100 responses.",
        earned: (data.counters?.attempts || 0) >= 100,
      },
    ];
    const rows = earned.length
      ? earned.map((row) => ({
          icon: row.icon,
          title: row.title,
          description: row.description,
          earned: true,
        }))
      : fallback;
    $("achievementList").innerHTML = rows
      .map(
        (row) =>
          `<article class="achievementCard ${row.earned ? "" : "locked"}"><span class="achievementIcon">${esc(row.icon || "★")}</span><strong>${esc(row.title)}</strong><small>${esc(row.description)}</small></article>`,
      )
      .join("");
  }
  function render(data, current) {
    const c = data.counters || {},
      mastery = data.mastery || [],
      firstName = (
        data.student?.display_name ||
        current.display_name ||
        "Student"
      ).split(/\s+/)[0];
    $("welcomeTitle").textContent = `${X.greeting()}, ${firstName}`;
    $("heroGreeting").innerHTML =
      `${esc(X.greeting())}, ${esc(firstName)}.<span>${c.review_due ? `${c.review_due} reviews are ready today.` : "Your next skill is ready."}</span>`;
    $("heroMessage").textContent =
      `You have mastered ${c.mastered_topics || 0} topic${c.mastered_topics === 1 ? "" : "s"}. Complete the next focused step to keep your journey moving.`;
    $("heroMastery").textContent = `${c.mastery || 0}%`;
    $("heroToday").textContent = c.questions_today || 0;
    $("heroStreak").textContent = c.streak || 0;
    $("heroDue").textContent = c.review_due || 0;
    $("masteryTrend").textContent =
      c.mastery >= 80 ? "Mastery level" : "Growing steadily";
    $("goalTrend").textContent = `Goal ${dailyGoal}`;
    $("streakTrend").textContent = c.streak ? "Keep it going" : "Start today";
    $("reviewTrend").textContent = c.review_due ? "Ready now" : "Up to date";
    const missionPercent = X.safePercent(
      ((c.questions_today || 0) / dailyGoal) * 100,
    );
    X.setRing("missionProgress", missionPercent);
    $("missionValue").textContent = `${missionPercent}%`;
    $("missionStatus").textContent =
      `${Math.min(c.questions_today || 0, dailyGoal)} of ${dailyGoal} questions`;
    $("missionTitle").textContent =
      missionPercent >= 100 ? "Mission complete" : "Build today’s momentum";
    $("missionText").textContent =
      missionPercent >= 100
        ? "Excellent work. Choose a challenge or continue your lesson pathway."
        : `Complete ${Math.max(0, dailyGoal - (c.questions_today || 0))} more question${dailyGoal - (c.questions_today || 0) === 1 ? "" : "s"} and clear one review item.`;
    $("missionSteps").innerHTML = [
      {
        icon: "✦",
        text: `${Math.max(0, dailyGoal - (c.questions_today || 0))} questions to daily goal`,
      },
      { icon: "↻", text: `${c.review_due || 0} spaced reviews ready` },
      {
        icon: "✓",
        text: `${(data.assignments || []).filter((row) => (row.result?.status || "not_started") !== "submitted").length} open assignments`,
      },
    ]
      .map(
        (row) =>
          `<div class="missionStep"><i>${row.icon}</i><span>${row.text}</span></div>`,
      )
      .join("");
    X.setRing("masteryMeter", c.mastery);
    X.setRing(
      "topicsMeter",
      c.total_topics ? (c.mastered_topics / c.total_topics) * 100 : 0,
    );
    X.setRing("goalMeter", missionPercent);
    X.setRing("timeMeter", ((c.weekly_minutes || 0) / weeklyGoal) * 100);
    $("masteredCount").textContent = c.mastered_topics || 0;
    $("totalTopicCount").textContent = c.total_topics || 0;
    $("todayCount").textContent = c.questions_today || 0;
    $("weeklyMinutes").textContent = c.weekly_minutes || 0;
    $("weeklyTimeBadge").textContent = `${c.weekly_minutes || 0} min`;
    $("accuracyMetric").textContent = `${c.accuracy || 0}%`;
    $("dueMetric").textContent = c.review_due || 0;
    $("mistakeMetric").textContent = c.open_mistakes || 0;
    $("streakMetric").textContent = c.streak || 0;
    const next = (data.priorities || [])[0];
    $("nextSkillTitle").textContent =
      next?.title || "Adaptive practice pathway";
    $("nextSkillMeta").textContent = next
      ? `${next.course || "Mathematics"}${next.unit ? ` · Unit ${next.unit}` : ""} · current mastery ${Math.round(Number(next.score || 0))}%`
      : "Complete practice to generate your first evidence-based recommendation.";
    $("nextSkillScore").textContent =
      `${Math.round(Number(next?.score || c.mastery || 0))}%`;
    $("nextSkillTags").innerHTML = [
      next?.level || "Personalised",
      c.review_due ? `${c.review_due} reviews due` : "Review clear",
      `${c.open_mistakes || 0} mistakes open`,
    ]
      .map((tag) => `<span>${esc(tag)}</span>`)
      .join("");
    $("priorityList").innerHTML = skillRows(
      data.priorities || [],
      "Complete practice to generate recommendations.",
      "var(--px-maroon)",
    );
    $("strengthList").innerHTML = skillRows(
      data.strengths || [],
      "Your strongest areas will appear here.",
      "var(--px-teal)",
    );
    renderJourney(mastery);
    renderAchievements(data);
    X.renderWeekBars("weeklyActivity", weekData(data));
    const assignments = data.assignments || [];
    $("assignmentList").innerHTML = assignments.length
      ? assignments
          .map((row) => {
            const status = row.result?.status || "not_started",
              due = row.due_at ? new Date(row.due_at) : null,
              overdue = due && due < new Date() && status !== "submitted",
              style = overdue
                ? "overdue"
                : status === "submitted"
                  ? "submitted"
                  : "";
            const routeSummary = assignmentRouteSummary(row);
            return `<div class="premiumListRow assignmentPremium ${style}"><span class="rowIcon">${X.icon(row.activity_type === "exam" ? "test" : row.activity_type === "lesson" ? "lesson" : "assignment")}</span><div><strong>${esc(row.title)}</strong><small>${esc((row.activity_type || "practice").replace("_", " ").toUpperCase())}${due ? ` · Due ${due.toLocaleDateString()}` : ""}${routeSummary ? ` · ${esc(routeSummary)}` : ""}${row.description ? ` · ${esc(row.description)}` : ""}</small><div class="progressMini"><i style="width:${status === "submitted" ? 100 : overdue ? 18 : 42}%"></i></div></div><div class="rowActions"><span class="cardBadge ${overdue ? "alert" : status === "submitted" ? "" : "gold"}">${overdue ? "Overdue" : status.replace("_", " ")}</span><a class="iButton small" href="${esc(assignmentHref(row))}">${status === "submitted" ? "Review" : "Open"}</a></div></div>`;
          })
          .join("")
      : `<div class="emptyInstitution"><h3>No assignments yet</h3><p>Continue your adaptive pathway or open an interactive lesson.</p></div>`;
    const sessions = data.recent_sessions || [];
    $("recentSessions").innerHTML = sessions.length
      ? sessions
          .map(
            (row) =>
              `<div class="premiumListRow"><span class="rowIcon">${X.icon(row.mode === "review" ? "review" : row.mode === "exam" ? "test" : "practice")}</span><div><strong>${esc((row.mode || "Learning").replace("_", " "))} session</strong><small>${new Date(row.started_at).toLocaleString()} · ${esc([row.course, row.unit ? `Unit ${row.unit}` : ""].filter(Boolean).join(" · "))}</small></div><span class="rowValue">${row.total ? `${row.correct}/${row.total}` : "✓"}<small>${row.duration_minutes ? `${row.duration_minutes} min` : "Complete"}</small></span></div>`,
          )
          .join("")
      : `<div class="emptyInstitution">Your latest sessions will appear here.</div>`;
    X.setIdentityAvatar(current);
  }

  async function load(current) {
    $("syncStatus").textContent = "Syncing…";
    try {
      await ECHSInstitution.syncLearning();
      const requested = new URLSearchParams(location.search).get("student_id"),
        data = await ECHSInstitution.api(
          "institution-api",
          `/dashboard/student${requested ? `?student_id=${encodeURIComponent(requested)}` : ""}`,
        );
      render(data, current);
      $("syncStatus").textContent = "Cloud connected";
    } catch (error) {
      $("syncStatus").textContent = "Sync unavailable";
      throw error;
    }
  }
  const current = await ECHSInstitution.requireAuth([
    "student",
    "teacher",
    "admin",
    "parent",
  ]);
  if (!current) {
    if (document.documentElement.dataset.institution === "unconfigured") {
      const preview = {
        display_name: previewData.student.display_name,
        username: "amina.hassan",
        role: "student",
        organization_name: "ECHS Mathematics",
      };
      ECHSInstitution.mountIdentity(preview);
      X.setIdentityAvatar(preview);
      X.showPreview();
      render(previewData, preview);
      $("syncStatus").textContent = "Preview mode";
      $("syncNow").disabled = true;
    }
    return;
  }
  ECHSInstitution.mountIdentity(current);
  X.setIdentityAvatar(current);
  $("syncNow").addEventListener("click", () =>
    load(current)
      .then(() => X.toast("Learning progress synchronized."))
      .catch((error) => X.toast(error.message, "danger")),
  );
  await load(current);
})().catch((error) => {
  console.error(error);
  window.ECHSExperience?.toast(error.message, "danger");
});
