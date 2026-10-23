import type { Course } from "./types";

const POINTS: Record<string, number> = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, F: 0 };
const BONUS: Record<Course["level"], number> = { standard: 0, honors: 0.5, ap: 1, ib: 1, dual_enrollment: 1, college: 1 };

/** Estimates GPA on a 4.0 scale. Ungraded or non-letter grades (e.g. "P") are skipped. */
export function gpa(courses: Pick<Course, "grade" | "credit" | "level">[]): { unweighted: number | null; weighted: number | null; credits: number } {
  let credits = 0, u = 0, w = 0;
  for (const c of courses) {
    const p = POINTS[c.grade.trim().toUpperCase()];
    if (p === undefined || c.credit <= 0) continue;
    credits += c.credit;
    u += p * c.credit;
    w += (p === 0 ? 0 : p + BONUS[c.level]) * c.credit;
  }
  if (!credits) return { unweighted: null, weighted: null, credits: 0 };
  const r = (n: number) => Math.round((n / credits) * 100) / 100;
  return { unweighted: r(u), weighted: r(w), credits };
}
