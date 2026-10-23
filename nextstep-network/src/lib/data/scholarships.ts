import type { Scholarship } from "../types";

// Real, well-known programs linked to their official sites. Award amounts,
// eligibility and deadlines change every cycle, so every record is marked
// "unverified" until an administrator confirms it against the sponsor's site.
// Deadlines are left blank and described in deadlineNote instead of guessed.

const v = (sourceUrl: string) => ({ status: "unverified" as const, source: "Sponsor website — details must be confirmed each cycle", sourceUrl });

type S = Omit<Scholarship, "createdAt" | "verification" | "publishStatus"> & { id: string };
const s = (x: S): Omit<Scholarship, "createdAt"> => ({ ...x, verification: v(x.url), publishStatus: "published" });

export const SCHOLARSHIPS: Omit<Scholarship, "createdAt">[] = [
  s({
    id: "sch-nextnc", name: "Next NC Scholarship", sponsor: "State of North Carolina (NCSEAA / CFNC)",
    amountText: "Varies by school type — see CFNC", amountMax: null,
    eligibility: "North Carolina residents attending eligible NC public colleges and universities who meet income guidelines and file the FAFSA.",
    levels: ["high_school", "college", "transfer"], tags: ["need-based", "north carolina", "state grant"], states: ["NC"],
    essay: false, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Awarded through the FAFSA. File early and check CFNC for current guidance.",
    documents: ["FAFSA", "NC residency determination"], url: "https://www.cfnc.org/",
  }),
  s({
    id: "sch-pell", name: "Federal Pell Grant", sponsor: "U.S. Department of Education",
    amountText: "Varies by financial need — see StudentAid.gov", amountMax: null,
    eligibility: "Undergraduate students with exceptional financial need, determined by the FAFSA.",
    levels: ["high_school", "college", "transfer"], tags: ["federal", "grant", "need-based"], states: [],
    essay: false, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Federal and school deadlines apply — see StudentAid.gov.", documents: ["FAFSA"],
    url: "https://studentaid.gov/understand-aid/types/grants/pell",
  }),
  s({
    id: "sch-gates", name: "The Gates Scholarship", sponsor: "The Gates Scholarship",
    amountText: "Covers unmet need — see sponsor", amountMax: null,
    eligibility: "High-achieving, Pell-eligible high school seniors from minority backgrounds. See the sponsor for full criteria.",
    levels: ["high_school"], tags: ["merit", "need-based", "minority students"], states: [],
    essay: true, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Typically early in the senior year (fall). Confirm the current cycle on the sponsor site.",
    documents: ["Essays", "Transcript", "Recommendations"], url: "https://www.thegatesscholarship.org/",
  }),
  s({
    id: "sch-cocacola", name: "Coca-Cola Scholars Program", sponsor: "Coca-Cola Scholars Foundation",
    amountText: "See sponsor for award amount", amountMax: null,
    eligibility: "High school seniors recognized for leadership and service. See the sponsor for full criteria.",
    levels: ["high_school"], tags: ["leadership", "service", "merit"], states: [],
    essay: true, renewable: false, needBased: false, firstGen: false, deadline: null,
    deadlineNote: "Typically fall of senior year. Confirm on the sponsor site.",
    documents: ["Online application", "Activities list"], url: "https://www.coca-colascholarsfoundation.org/",
  }),
  s({
    id: "sch-dell", name: "Dell Scholars Program", sponsor: "Michael & Susan Dell Foundation",
    amountText: "Scholarship plus support resources — see sponsor", amountMax: null,
    eligibility: "Pell-eligible students who participated in an approved college readiness program. See sponsor.",
    levels: ["high_school"], tags: ["need-based", "first-generation", "support"], states: [],
    essay: true, renewable: true, needBased: true, firstGen: true, deadline: null,
    deadlineNote: "Confirm the current cycle on the sponsor site.", documents: ["Essays", "Financial information"],
    url: "https://www.dellscholars.org/",
  }),
  s({
    id: "sch-jkc", name: "Jack Kent Cooke College Scholarship", sponsor: "Jack Kent Cooke Foundation",
    amountText: "See sponsor for award amount", amountMax: null,
    eligibility: "High-achieving high school seniors with financial need. See sponsor for criteria.",
    levels: ["high_school"], tags: ["merit", "need-based"], states: [],
    essay: true, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Confirm the current cycle on the sponsor site.", documents: ["Essays", "Transcript", "Recommendations"],
    url: "https://www.jkcf.org/",
  }),
  s({
    id: "sch-jkc-transfer", name: "Jack Kent Cooke Undergraduate Transfer Scholarship", sponsor: "Jack Kent Cooke Foundation",
    amountText: "See sponsor for award amount", amountMax: null,
    eligibility: "Community college students with financial need planning to transfer to a four-year institution.",
    levels: ["transfer", "college"], tags: ["transfer", "community college", "need-based"], states: [],
    essay: true, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Confirm the current cycle on the sponsor site.", documents: ["Essays", "College transcript", "Recommendations"],
    url: "https://www.jkcf.org/",
  }),
  s({
    id: "sch-questbridge", name: "QuestBridge National College Match", sponsor: "QuestBridge",
    amountText: "Full four-year scholarships at partner colleges — see sponsor", amountMax: null,
    eligibility: "High-achieving high school seniors from low-income backgrounds. See sponsor.",
    levels: ["high_school"], tags: ["need-based", "merit", "match program"], states: [],
    essay: true, renewable: true, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Typically early fall of senior year. Confirm on the sponsor site.", documents: ["Essays", "Transcript", "Recommendations"],
    url: "https://www.questbridge.org/",
  }),
  s({
    id: "sch-horatio", name: "Horatio Alger National Scholarship", sponsor: "Horatio Alger Association",
    amountText: "See sponsor for award amount", amountMax: null,
    eligibility: "High school students who have overcome adversity and demonstrate financial need.",
    levels: ["high_school"], tags: ["need-based", "adversity"], states: [],
    essay: true, renewable: false, needBased: true, firstGen: false, deadline: null,
    deadlineNote: "Confirm the current cycle on the sponsor site.", documents: ["Essays", "Financial information"],
    url: "https://scholars.horatioalger.org/",
  }),
  s({
    id: "sch-hsf", name: "HSF Scholar Program", sponsor: "Hispanic Scholarship Fund",
    amountText: "See sponsor for award amount", amountMax: null,
    eligibility: "Students of Hispanic heritage. See sponsor for GPA and enrollment requirements.",
    levels: ["high_school", "college", "transfer"], tags: ["hispanic heritage", "merit"], states: [],
    essay: true, renewable: false, needBased: false, firstGen: false, deadline: null,
    deadlineNote: "Confirm the current cycle on the sponsor site.", documents: ["Online application", "Transcript"],
    url: "https://www.hsf.net/",
  }),
  s({
    id: "sch-uncf", name: "UNCF Scholarships", sponsor: "UNCF (United Negro College Fund)",
    amountText: "Many programs; amounts vary", amountMax: null,
    eligibility: "Multiple scholarship programs, many supporting students attending HBCUs. See each listing on UNCF.",
    levels: ["high_school", "college", "transfer"], tags: ["hbcu", "multiple programs"], states: [],
    essay: true, renewable: false, needBased: false, firstGen: false, deadline: null,
    deadlineNote: "Deadlines vary by program.", documents: ["Varies by program"], url: "https://uncf.org/scholarships",
  }),
  s({
    id: "sch-ptk", name: "Phi Theta Kappa Transfer Scholarships", sponsor: "Phi Theta Kappa Honor Society",
    amountText: "Varies by partner institution", amountMax: null,
    eligibility: "Community college students, including Phi Theta Kappa members, transferring to four-year institutions.",
    levels: ["transfer", "college"], tags: ["transfer", "community college", "honor society"], states: [],
    essay: false, renewable: false, needBased: false, firstGen: false, deadline: null,
    deadlineNote: "Varies by partner institution.", documents: ["Membership", "College transcript"], url: "https://www.ptk.org/",
  }),
];
