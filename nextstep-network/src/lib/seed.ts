// Demonstration data. Every person, employer, post and job below is FICTIONAL and
// flagged `isDemo`. Colleges and scholarships are real institutions/programs with
// details marked "unverified". Set DEMO_MODE=false to hide demo sign-in shortcuts.

import { hashPassword } from "./crypto";
import { COLLEGES } from "./data/colleges";
import { SCHOLARSHIPS } from "./data/scholarships";
import { img } from "./images";
import type { Store } from "./db/store";
import type { Entry, Profile, User } from "./types";
import { FAFSA_STEPS } from "./progress";

export const DEMO_PASSWORD = "demo-password-2027";
export const DEMO_ACCOUNTS = [
  { email: "jordan@demo.nextstep", label: "Jordan Carter — student (under 18)" },
  { email: "sofia@demo.nextstep", label: "Sofia Martinez — transfer student (18+)" },
  { email: "angela@demo.nextstep", label: "Angela Carter — parent" },
  { email: "taylor@demo.nextstep", label: "Taylor Brooks — verified employer" },
  { email: "admin@demo.nextstep", label: "Site Administrator" },
];

const day = 864e5;
const ago = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * day).toISOString().slice(0, 10);

function profile(userId: string, p: Partial<Profile>): Omit<Profile, "id" | "createdAt"> {
  return {
    userId, headline: "", about: "", school: "", schoolLevel: "high_school", gradYear: null, state: "NC", city: "",
    careerInterests: [], skills: [], education: [], experience: [], projects: [], volunteer: [], activities: [], awards: [],
    certifications: [], links: [], avatarUrl: "", bannerUrl: "", visibility: "network", learningFormat: "", residencyStatus: "not_started",
    parentLinkCode: null, ...p,
  };
}

export async function seed(store: Store) {
  const pw = hashPassword(DEMO_PASSWORD);
  const mk = async (id: string, u: Omit<User, "id" | "createdAt" | "passwordHash" | "status" | "isDemo">) =>
    store.insert("users", { id, passwordHash: pw, status: "active", isDemo: true, ...u });

  // ---- Organizations (fictional employers; platform team) ----
  const orgs = [
    { id: "org-team", name: "NextStep Network Team", type: "nonprofit" as const, verified: true, description: "Official updates, guides and safety tips from the NextStep Network team.", website: "/about", location: "Online" },
    { id: "org-carolina-health", name: "Carolina Health Partners (Demo)", type: "employer" as const, verified: true, description: "Fictional demonstration employer: a regional healthcare network offering student internships.", website: "", location: "Raleigh, NC" },
    { id: "org-pinewood-labs", name: "Pinewood BioLabs (Demo)", type: "employer" as const, verified: true, description: "Fictional demonstration employer: a biotech research lab.", website: "", location: "Durham, NC" },
    { id: "org-tarheel-tech", name: "TarHeel Tech Co. (Demo)", type: "employer" as const, verified: false, description: "Fictional demonstration employer awaiting verification.", website: "", location: "Remote" },
  ];
  for (const o of orgs) await store.insert("organizations", { ...o, ownerId: null, isDemo: o.id !== "org-team" });
  for (const c of COLLEGES) {
    await store.insert("colleges", { ...c, createdAt: ago(24 * 30) });
    await store.insert("organizations", {
      id: `org-${c.id}`, name: c.name, type: "college", verified: false, collegeId: c.id,
      description: "Unclaimed institution page built from public information. Official representatives can request verification.",
      website: c.website, location: `${c.city}, ${c.state}`, ownerId: null,
    });
  }
  for (const s of SCHOLARSHIPS) await store.insert("scholarships", { ...s, createdAt: ago(24 * 20) });

  // ---- Users ----
  await mk("u-admin", { email: "admin@demo.nextstep", name: "Site Administrator", role: "admin", ageGroup: "adult", verified: true });
  await mk("u-jordan", { email: "jordan@demo.nextstep", name: "Jordan Carter", role: "student", ageGroup: "minor", verified: false });
  await mk("u-maya", { email: "maya@demo.nextstep", name: "Maya Rodriguez", role: "student", ageGroup: "minor", verified: false });
  await mk("u-aaliyah", { email: "aaliyah@demo.nextstep", name: "Aaliyah Johnson", role: "student", ageGroup: "minor", verified: false });
  await mk("u-sofia", { email: "sofia@demo.nextstep", name: "Sofia Martinez", role: "student", ageGroup: "adult", verified: false });
  await mk("u-daniel", { email: "daniel@demo.nextstep", name: "Daniel Kim", role: "student", ageGroup: "adult", verified: false });
  await mk("u-ethan", { email: "ethan@demo.nextstep", name: "Ethan Nguyen", role: "student", ageGroup: "adult", verified: false });
  await mk("u-denise", { email: "denise@demo.nextstep", name: "Denise Walker", role: "counselor", ageGroup: "adult", verified: true });
  await mk("u-lisa", { email: "lisa@demo.nextstep", name: "Dr. Lisa Monroe", role: "mentor", ageGroup: "adult", verified: true });
  await mk("u-angela", { email: "angela@demo.nextstep", name: "Angela Carter", role: "parent", ageGroup: "adult", verified: false });
  await mk("u-taylor", { email: "taylor@demo.nextstep", name: "Taylor Brooks", role: "employer", ageGroup: "adult", verified: true, orgId: "org-carolina-health" });
  await store.update("organizations", "org-carolina-health", { ownerId: "u-taylor" });

  const e = (title: string, org: string, start: string, end: string, description = ""): Entry => ({ title, org, start, end, description });

  await store.insert("profiles", profile("u-jordan", {
    headline: "Future Biology Student | Class of 2027 | Interested in Healthcare, Science & Research",
    about: "I'm a high school senior in North Carolina planning to start at Johnston Community College, earn my Associate in Science, and transfer into a bachelor's program in Biology. I'm also exploring nursing. I learn best online and I'm looking for affordable programs with flexible lab options.",
    school: "Riverside High School (Demo)", schoolLevel: "high_school", gradYear: 2027, city: "Smithfield",
    careerInterests: ["Biology", "Healthcare", "Nursing", "Research"],
    skills: ["Biology", "Lab Safety", "Microsoft Excel", "Public Speaking", "Teamwork", "Spanish (conversational)"],
    education: [e("High School Diploma (in progress)", "Riverside High School (Demo)", "2023", "2027", "Honors Biology, AP Environmental Science, Dual-enrollment English")],
    experience: [e("Volunteer Patient Ambassador", "Smithfield Community Hospital (Demo)", "2025", "Present", "Greet visitors and help patients find their way.")],
    projects: [e("Water Quality Study", "Science Fair", "2025", "2026", "Tested nitrate levels at three local creeks and presented findings at the regional science fair.")],
    volunteer: [e("Food Pantry Volunteer", "Johnston County Food Bank (Demo)", "2024", "Present")],
    activities: [e("HOSA – Future Health Professionals", "Chapter Treasurer", "2024", "Present")],
    awards: [e("Regional Science Fair — 2nd Place, Environmental Science", "", "2026", "")],
    certifications: [e("CPR & First Aid", "Demo certification", "2025", "")],
    avatarUrl: img("jordan"), bannerUrl: img("banner"), visibility: "network", learningFormat: "online", residencyStatus: "pending",
  }));
  await store.insert("profiles", profile("u-maya", {
    headline: "Aspiring Nurse | Class of 2027 | HOSA Member", school: "Riverside High School (Demo)", gradYear: 2027, city: "Clayton",
    about: "Exploring ADN and BSN pathways.", careerInterests: ["Nursing", "Healthcare"], skills: ["Patient Care Basics", "Teamwork"],
    avatarUrl: img("maya"), visibility: "network",
  }));
  await store.insert("profiles", profile("u-aaliyah", {
    headline: "Class of 2027 | Future Engineer | Robotics Club", school: "Riverside High School (Demo)", gradYear: 2027,
    careerInterests: ["Engineering", "Technology"], skills: ["CAD", "Python"], avatarUrl: img("aaliyah"), visibility: "network",
  }));
  await store.insert("profiles", profile("u-sofia", {
    headline: "Biology Transfer Student | Wake Tech → 4-Year | First-Generation College Student",
    about: "Finishing my Associate in Science and transferring for a BS in Biology. Happy to share what I've learned about transfer planning.",
    school: "Wake Technical Community College", schoolLevel: "community_college", gradYear: 2026, city: "Raleigh",
    careerInterests: ["Biology", "Research", "Healthcare"], skills: ["Microbiology Lab", "Data Analysis", "Tutoring"],
    education: [e("Associate in Science", "Wake Technical Community College", "2024", "2026")],
    avatarUrl: img("sofia"), bannerUrl: img("banner"), visibility: "public",
  }));
  await store.insert("profiles", profile("u-daniel", {
    headline: "Computer Science Student | Internship Seeker", school: "North Carolina State University", schoolLevel: "university", gradYear: 2028,
    careerInterests: ["Technology", "Software"], skills: ["TypeScript", "Python", "SQL"], avatarUrl: img("daniel"), visibility: "public",
  }));
  await store.insert("profiles", profile("u-ethan", {
    headline: "Mechanical Engineering Student | Formula SAE", school: "University of North Carolina at Charlotte", schoolLevel: "university", gradYear: 2027,
    careerInterests: ["Engineering"], skills: ["SolidWorks", "MATLAB"], avatarUrl: img("ethan"), visibility: "public",
  }));
  await store.insert("profiles", profile("u-denise", {
    headline: "School Counselor (Demo) | College & Career Readiness | Verified Counselor",
    about: "Helping students build college lists, complete the FAFSA, and find scholarships.", school: "Riverside High School (Demo)", schoolLevel: "other",
    careerInterests: ["Education"], skills: ["College Advising", "Financial Aid"], avatarUrl: img("counselor"), visibility: "public",
  }));
  await store.insert("profiles", profile("u-lisa", {
    headline: "Clinical Research Scientist (Demo) | Verified Mentor | Women in STEM", schoolLevel: "other",
    about: "Mentoring students interested in biology and healthcare research careers.", careerInterests: ["Research", "Healthcare", "Biology"],
    skills: ["Clinical Research", "Mentoring"], avatarUrl: img("mentor"), visibility: "public",
  }));
  await store.insert("profiles", profile("u-angela", { headline: "Parent", schoolLevel: "other", visibility: "private" }));
  await store.insert("profiles", profile("u-taylor", { headline: "Talent Programs Lead at Carolina Health Partners (Demo)", schoolLevel: "other", visibility: "public" }));
  await store.insert("profiles", profile("u-admin", { headline: "NextStep Network Administrator", schoolLevel: "other", visibility: "private" }));

  await store.insert("parent_links", { parentId: "u-angela", studentId: "u-jordan" });

  // ---- Connections ----
  const conn = (a: string, b: string, status: "pending" | "accepted" = "accepted") => store.insert("connections", { requesterId: a, addresseeId: b, status });
  await conn("u-jordan", "u-maya");
  await conn("u-jordan", "u-denise");
  await conn("u-jordan", "u-lisa");
  await conn("u-aaliyah", "u-jordan", "pending");
  await conn("u-sofia", "u-daniel");
  await conn("u-sofia", "u-lisa");
  await conn("u-daniel", "u-ethan");
  await conn("u-ethan", "u-sofia", "accepted");

  for (const [u, o] of [["u-jordan", "org-team"], ["u-jordan", "org-carolina-health"], ["u-jordan", "org-col-jcc"], ["u-jordan", "org-col-ecu"], ["u-sofia", "org-pinewood-labs"]] as const) {
    await store.insert("follows", { userId: u, orgId: o });
  }

  // ---- Groups ----
  const groups: [string, string, string, string[]][] = [
    ["grp-2027", "Class of 2027 College Bound", "Seniors planning for college in fall 2027. Share deadlines, questions and wins.", ["2027", "college"]],
    ["grp-nc", "North Carolina College Applicants", "Navigating CFNC, RDS residency and NC applications together.", ["north carolina", "cfnc"]],
    ["grp-nurses", "Future Nurses Network", "ADN vs. BSN, prerequisites, clinicals and NCLEX prep.", ["nursing", "healthcare"]],
    ["grp-bio", "Biology Majors", "Coursework, research opportunities, and careers in the life sciences.", ["biology", "science"]],
    ["grp-health", "Future Healthcare Professionals", "Explore careers across healthcare.", ["healthcare"]],
    ["grp-transfer", "Community College Transfer Network", "Plan a smooth transfer from community college to a four-year university.", ["transfer", "community college"]],
    ["grp-hbcu", "HBCU Bound Students", "Students exploring and attending Historically Black Colleges and Universities.", ["hbcu"]],
    ["grp-firstgen", "First-Generation College Students", "Support for students who are the first in their family to go to college.", ["first-generation"]],
    ["grp-aid", "Scholarships & Financial Aid", "FAFSA help, scholarship tips and scam alerts.", ["scholarships", "fafsa"]],
    ["grp-careers", "Internship & Career Opportunities", "Find and prepare for internships and entry-level jobs.", ["internships", "jobs"]],
    ["grp-remote", "Remote College Students", "Tips for succeeding in online and hybrid programs.", ["online"]],
    ["grp-stem", "Women in STEM", "Community and mentorship for women in science, technology, engineering and math.", ["stem"]],
    ["grp-entre", "Entrepreneurship for Students", "Start projects, side businesses and nonprofits.", ["business"]],
  ];
  for (const [id, name, description, tags] of groups) {
    await store.insert("groups", {
      id, name, description, tags, visibility: id === "grp-firstgen" ? "private" : "public", adminId: "u-denise", adultsOnly: false,
      rules: ["Be respectful and encouraging.", "No spam, sales or recruiting outside approved posts.", "Never share private information like phone numbers, addresses or ID numbers.", "Report anything that makes you uncomfortable."],
      resources: [{ label: "StudentAid.gov", url: "https://studentaid.gov/" }, { label: "CFNC", url: "https://www.cfnc.org/" }],
    });
    await store.insert("group_members", { groupId: id, userId: "u-denise", status: "member", role: "admin" });
  }
  for (const g of ["grp-2027", "grp-nc", "grp-bio", "grp-transfer", "grp-aid"]) await store.insert("group_members", { groupId: g, userId: "u-jordan", status: "member", role: "member" });
  for (const g of ["grp-nurses", "grp-2027", "grp-health"]) await store.insert("group_members", { groupId: g, userId: "u-maya", status: "member", role: "member" });
  for (const g of ["grp-transfer", "grp-bio", "grp-firstgen", "grp-stem"]) await store.insert("group_members", { groupId: g, userId: "u-sofia", status: "member", role: "member" });

  // ---- Posts ----
  const post = (id: string, authorId: string, body: string, category: Parameters<typeof store.insert<"posts">>[1]["category"], hoursAgo: number, extra: { orgId?: string; groupId?: string; link?: string; imageUrl?: string } = {}) =>
    store.insert("posts", { id, authorId, body, category, removed: false, createdAt: ago(hoursAgo), orgId: extra.orgId ?? null, groupId: extra.groupId ?? null, link: extra.link ?? null, imageUrl: extra.imageUrl ?? null, repostOfId: null });

  await post("p1", "u-admin", "FAFSA reminder: the FAFSA is free and is completed only at StudentAid.gov. Never pay a website to file it for you, and never share your StudentAid.gov login. Use the FAFSA Command Center on NextStep to track your steps.", "advice", 3, { orgId: "org-team", link: "https://studentaid.gov/" });
  await post("p2", "u-sofia", "Officially finished my last Associate in Science lab! 🎉 Two years ago I didn't know what a transfer agreement was. Tip for anyone starting community college: meet with an advisor in your FIRST semester and ask which courses transfer for your major.", "success", 6);
  await post("p3", "u-taylor", "Carolina Health Partners (Demo) is accepting applications for our Summer Patient Experience Internship for students 16+. This is a demonstration listing — see the Internships & Jobs page.", "internship", 10, { orgId: "org-carolina-health" });
  await post("p4", "u-denise", "Seniors: if you're applying to NC public universities, complete your Residency Determination Service (RDS) step early. It's required to be considered for in-state tuition and many state grants. Official site: ncresidency.org", "advice", 20, { link: "https://www.ncresidency.org/" });
  await post("p5", "u-maya", "Question for nursing students: did you go the ADN route at community college first, or straight into a BSN? Trying to weigh cost vs. time.", "question", 26);
  await post("p6", "u-lisa", "Students interested in biology research: you don't need to wait until junior year of college. Ask professors about undergraduate research early, and look for summer research programs. Happy to answer questions in the Biology Majors group.", "advice", 30);
  await post("p7", "u-jordan", "Just submitted my Johnston Community College application! Next up: finishing scholarship essays. 📚", "success", 40);
  await post("p8", "u-daniel", "Sharing my resume template that helped me land a campus IT job. The Resume Builder here exports a clean one-page PDF too.", "general", 50);
  await post("p9", "u-admin", "Scholarship safety check: legitimate scholarships don't charge application fees or ask for bank account numbers. Try our Scholarship Scam Checker before you apply anywhere new.", "scholarship", 60, { orgId: "org-team", link: "/resources#scam-checker" });
  await post("p10", "u-ethan", "Our Formula SAE team just finished the frame for this year's car. If you like hands-on engineering, look for a design team in your first year!", "general", 80);
  await post("p11", "u-sofia", "Anyone else in the Community College Transfer Network applying for the Jack Kent Cooke transfer scholarship this cycle? Let's swap essay feedback.", "scholarship", 12, { groupId: "grp-transfer" });
  await post("p12", "u-denise", "Welcome to Class of 2027 College Bound! Introduce yourself: what's one school on your list and why?", "general", 90, { groupId: "grp-2027" });

  await store.insert("comments", { postId: "p2", authorId: "u-jordan", body: "Congrats Sofia! That's exactly my plan at JCC.", removed: false, createdAt: ago(5) });
  await store.insert("comments", { postId: "p5", authorId: "u-lisa", body: "Both paths lead to RN licensure. Many students do ADN then an online RN-to-BSN while working. Compare total cost and program outcomes.", removed: false, createdAt: ago(24) });
  for (const [p, u, t] of [["p2", "u-jordan", "celebrate"], ["p2", "u-daniel", "celebrate"], ["p1", "u-jordan", "insightful"], ["p4", "u-jordan", "like"], ["p7", "u-maya", "celebrate"], ["p7", "u-denise", "celebrate"]] as const) {
    await store.insert("reactions", { postId: p, userId: u, type: t });
  }

  // ---- Jobs (all demonstration listings) ----
  const job = (id: string, j: Partial<Parameters<typeof store.insert<"jobs">>[1]>) =>
    store.insert("jobs", {
      id, title: "", orgId: "org-carolina-health", location: "Raleigh, NC", arrangement: "on_site", payText: "", paid: true, category: "Healthcare",
      level: "high_school", minAge: 16, schedule: "Part-time", description: "", responsibilities: [], qualifications: [], deadline: inDays(45),
      url: null, status: "approved", isDemo: true, postedById: "u-taylor", createdAt: ago(48), ...j,
    } as Parameters<typeof store.insert<"jobs">>[1]);
  await job("job-1", { title: "Summer Patient Experience Intern", payText: "$15/hr (demo)", schedule: "Summer, 20 hrs/week", description: "Support patient experience staff in a hospital setting.", responsibilities: ["Greet and guide visitors", "Assist with patient surveys", "Shadow care teams"], qualifications: ["Age 16+", "Strong communication", "Interest in healthcare"] });
  await job("job-2", { title: "Research Lab Assistant (College)", orgId: "org-pinewood-labs", location: "Durham, NC", payText: "$17/hr (demo)", category: "Biology & Research", level: "college", minAge: 18, schedule: "Part-time, flexible", description: "Assist scientists with sample prep and data entry.", responsibilities: ["Prepare reagents", "Maintain lab notebooks", "Data entry"], qualifications: ["Completed one college biology course with lab", "Attention to detail"], postedById: "u-admin" });
  await job("job-3", { title: "Remote Data Entry Intern", orgId: "org-tarheel-tech", location: "Remote", arrangement: "remote", payText: "Unpaid (demo)", paid: false, category: "Technology", level: "college", minAge: 18, schedule: "10 hrs/week", description: "Clearly labeled unpaid internship (demo).", responsibilities: ["Clean spreadsheets"], qualifications: ["Excel basics"], status: "pending", postedById: "u-admin" });
  await job("job-4", { title: "Weekend Dietary Aide", payText: "$14/hr (demo)", schedule: "Weekends", category: "Healthcare", description: "Help prepare and deliver patient meal trays.", responsibilities: ["Deliver meal trays", "Follow food safety rules"], qualifications: ["Age 16+"] });
  await job("job-5", { title: "Clinical Research Summer Internship", orgId: "org-pinewood-labs", location: "Durham, NC", arrangement: "hybrid", payText: "$18/hr (demo)", category: "Biology & Research", level: "college", minAge: 18, schedule: "Summer, full-time", description: "Hybrid summer research internship.", responsibilities: ["Literature review", "Data analysis"], qualifications: ["Biology or chemistry major"], postedById: "u-admin" });
  await job("job-6", { title: "Entry-Level Medical Lab Technician", orgId: "org-carolina-health", payText: "Salary range listed by employer (demo)", category: "Healthcare", level: "graduate", minAge: 18, schedule: "Full-time", description: "Entry-level role for recent graduates of an accredited MLT program.", responsibilities: ["Run routine tests", "Quality control"], qualifications: ["Accredited MLT/MLS program", "Certification preferred"] });

  // ---- Events (demonstration) ----
  const ev = (id: string, title: string, d: number, kind: Parameters<typeof store.insert<"events">>[1]["kind"], location: string, description: string, url: string | null = null) =>
    store.insert("events", { id, title, date: inDays(d), kind, location, url, description, isDemo: true, orgId: null });
  await ev("ev-1", "Virtual Workshop: FAFSA Step by Step (Demo)", 6, "workshop", "Online", "Walk through the official FAFSA checklist with a counselor.");
  await ev("ev-2", "Triangle Healthcare Career Fair (Demo)", 18, "fair", "Raleigh, NC", "Meet healthcare employers offering internships.");
  await ev("ev-3", "Transfer Planning Night (Demo)", 25, "workshop", "Online", "Ask transfer advisors about AS-to-BS pathways.");
  await ev("ev-4", "Campus Tour: Johnston Community College (Demo event)", 12, "visit", "Smithfield, NC", "Schedule real tours on the college's official website.", "https://www.johnston.edu/");
  await ev("ev-5", "Student Networking Mixer: Future Healthcare Pros (Demo)", 33, "networking", "Online", "Moderated virtual mixer.");

  // ---- Jordan's planning data (fictional) ----
  const app = (collegeId: string, status: Parameters<typeof store.insert<"college_applications">>[1]["status"], checklist: string[], extra: Partial<Parameters<typeof store.insert<"college_applications">>[1]> = {}) =>
    store.insert("college_applications", {
      userId: "u-jordan", collegeId, status, appType: "CFNC", deadline: null, fee: null, feeWaiver: false,
      checklist: Object.fromEntries(checklist.map((c) => [c, true])), submittedAt: null, decisionDate: null, enrollmentDeposit: "", confirmationNumber: "", notes: "", ...extra,
    });
  await app("col-jcc", "submitted", ["research", "account", "transcript", "residency", "fee", "submit"], { submittedAt: inDays(-9), feeWaiver: true, notes: "Applied for Associate in Science. Residency determination pending." });
  await app("col-ecu", "interested", ["research"], { notes: "Look into online Biology options and transfer agreements.", deadline: inDays(75) });
  await app("col-ncsu", "interested", ["research"], { deadline: inDays(90) });
  await app("col-asuonline", "interested", [], { appType: "Institution application", notes: "Ask how online Biology handles lab requirements." });

  for (const c of ["col-jcc", "col-ecu", "col-ncsu", "col-asuonline", "col-uncp"]) await store.insert("saved_items", { userId: "u-jordan", kind: "college", refId: c });
  for (const j of ["job-1", "job-4"]) await store.insert("saved_items", { userId: "u-jordan", kind: "job", refId: j });
  await store.insert("saved_items", { userId: "u-jordan", kind: "post", refId: "p4" });

  const steps: Record<string, { done: boolean; note: string }> = {};
  const doneThrough = FAFSA_STEPS.findIndex((s) => s.id === "fss");
  FAFSA_STEPS.forEach((s, i) => (steps[s.id] = { done: i <= doneThrough, note: "" }));
  steps.submit.note = "Submitted with parent as contributor.";
  await store.insert("fafsa_progress", { userId: "u-jordan", awardYear: "2027–28", steps });

  await store.insert("scholarship_applications", { userId: "u-jordan", scholarshipId: "sch-nextnc", status: "preparing", notes: "Awarded through FAFSA — FAFSA done." });
  await store.insert("scholarship_applications", { userId: "u-jordan", scholarshipId: "sch-cocacola", status: "saved", notes: "" });
  await store.insert("scholarship_applications", { userId: "u-jordan", scholarshipId: "sch-jkc-transfer", status: "saved", notes: "For after JCC." });
  await store.insert("job_applications", { userId: "u-jordan", jobId: "job-1", status: "applied", notes: "" });

  const task = (title: string, d: number | null, kind: Parameters<typeof store.insert<"tasks">>[1]["kind"], done = false, href = "") =>
    store.insert("tasks", { userId: "u-jordan", title, date: d == null ? null : inDays(d), kind, done, href });
  await task("Check RDS residency determination status", 3, "application", false, "/residency");
  await task("Finish Coca-Cola Scholars essay draft", 8, "scholarship", false, "/my-scholarships");
  await task("Meet with Ms. Walker about transfer plan", 10, "personal");
  await task("Research ECU online Biology lab requirements", 14, "application", false, "/my-colleges");
  await task("Submit JCC application", -9, "application", true);
  await task("Submit FAFSA", -15, "fafsa", true, "/fafsa");

  await store.insert("essays", { userId: "u-jordan", title: "Why healthcare?", prompt: "Describe an experience that shaped your career goals.", target: "Coca-Cola Scholars", versions: [{ body: "Volunteering at the hospital information desk taught me...", savedAt: ago(48) }] });
  await store.insert("courses", { userId: "u-jordan", name: "Honors Biology", schoolYear: "2023–24", term: "Full year", credit: 1, level: "honors", grade: "A" });
  await store.insert("courses", { userId: "u-jordan", name: "AP Environmental Science", schoolYear: "2025–26", term: "Full year", credit: 1, level: "ap", grade: "A-" });
  await store.insert("courses", { userId: "u-jordan", name: "English 111 (Dual Enrollment)", schoolYear: "2025–26", term: "Fall", credit: 1, level: "dual_enrollment", grade: "B+" });
  await store.insert("aid_offers", { userId: "u-jordan", collegeName: "Johnston CC (example figures)", tuition: 2700, fees: 300, housing: 0, books: 1200, transportation: 1500, grants: 4000, scholarships: 0, workStudy: 0, loans: 0 });
  await store.insert("aid_offers", { userId: "u-jordan", collegeName: "Sample University (example figures)", tuition: 7500, fees: 2000, housing: 11000, books: 1200, transportation: 800, grants: 6500, scholarships: 2000, workStudy: 2500, loans: 5500 });

  // Notifications reflect the seeded activity above.
  const note = (userId: string, type: Parameters<typeof store.insert<"notifications">>[1]["type"], text: string, href: string, h: number, read = false) =>
    store.insert("notifications", { userId, type, text, href, read, createdAt: ago(h) });
  await note("u-jordan", "connection", "Aaliyah Johnson sent you a connection request.", "/network/invitations", 2);
  await note("u-jordan", "reaction", "Maya Rodriguez and Denise Walker celebrated your post.", "/feed", 30);
  await note("u-jordan", "deadline", "Upcoming: Check RDS residency determination status (in 3 days).", "/calendar", 4);
  await note("u-jordan", "group", "New post in Community College Transfer Network.", "/groups/grp-transfer", 12, true);
  await note("u-jordan", "comment", "Dr. Lisa Monroe commented on a post you follow.", "/feed", 24, true);

  await store.insert("site_settings", { key: "announcement", value: "Welcome to the NextStep Network preview. All people, employers and job listings are fictional demonstration data." });
}
