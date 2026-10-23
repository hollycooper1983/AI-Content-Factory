import type { College } from "../types";

// Starter college records. Names, locations, institution type and official websites
// are public facts. Cost and policy fields are marked "unverified": they are
// approximate starting points that an administrator must confirm against College
// Scorecard and the institution's official site (Admin → Colleges) before they
// should be treated as verified. Unknown values are left null rather than guessed.

const unverified = {
  status: "unverified" as const,
  source: "Starter data — confirm on College Scorecard and the official site",
  sourceUrl: "https://collegescorecard.ed.gov/",
};

type Seed = Omit<College, "id" | "createdAt" | "verification" | "publishStatus"> & { id: string };

const base = (c: Seed): Omit<College, "createdAt"> => ({ ...c, verification: unverified, publishStatus: "published" });

const NC_CC = {
  type: "community" as const,
  hbcu: false,
  degrees: ["Associate in Science", "Associate in Arts", "Associate in Applied Science", "Certificates & Diplomas"],
  testPolicy: "Open admission; placement measures may apply",
  transferFriendly: true,
  accreditation: "SACSCOC (Southern Association of Colleges and Schools Commission on Colleges)",
  appFee: null,
  freeAppNote: "NC community colleges generally don't charge an application fee — confirm with the college.",
  tuitionOutState: null,
};

export const COLLEGES: Omit<College, "createdAt">[] = [
  base({
    ...NC_CC, id: "col-jcc", name: "Johnston Community College", city: "Smithfield", state: "NC",
    online: true, hybrid: true, campus: true, website: "https://www.johnston.edu/", admissionsUrl: "https://www.johnston.edu/",
    majors: ["Biology (AS transfer)", "Nursing (ADN)", "Business", "Information Technology", "Criminal Justice"],
    tuitionInState: null, labNote: "Science lab sections may require on-campus attendance. Confirm the format for each course.",
    financialAidUrl: "https://www.johnston.edu/",
  }),
  base({
    ...NC_CC, id: "col-waketech", name: "Wake Technical Community College", city: "Raleigh", state: "NC",
    online: true, hybrid: true, campus: true, website: "https://www.waketech.edu/", admissionsUrl: "https://www.waketech.edu/",
    majors: ["Biology (AS transfer)", "Nursing (ADN)", "Computer Science", "Engineering (AE)", "Business"],
    tuitionInState: null, labNote: "Some lab sciences offered in hybrid formats. Confirm with the department.",
  }),
  base({
    ...NC_CC, id: "col-durhamtech", name: "Durham Technical Community College", city: "Durham", state: "NC",
    online: true, hybrid: true, campus: true, website: "https://www.durhamtech.edu/", admissionsUrl: "https://www.durhamtech.edu/",
    majors: ["Biology (AS transfer)", "Practical Nursing", "Clinical Trials Research", "IT"], tuitionInState: null,
  }),
  base({
    id: "col-unc", name: "University of North Carolina at Chapel Hill", city: "Chapel Hill", state: "NC", type: "public4", hbcu: false,
    online: false, hybrid: false, campus: true, website: "https://www.unc.edu/", admissionsUrl: "https://admissions.unc.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN)", "Public Health", "Computer Science", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-ncsu", name: "North Carolina State University", city: "Raleigh", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.ncsu.edu/", admissionsUrl: "https://admissions.ncsu.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biological Sciences", "Engineering", "Computer Science", "Agriculture", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-ecu", name: "East Carolina University", city: "Greenville", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.ecu.edu/", admissionsUrl: "https://admissions.ecu.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN, RN-to-BSN online)", "Health Services Management", "Public Health"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC", labNote: "Online programs may still require clinical or lab placements.",
  }),
  base({
    id: "col-ncat", name: "North Carolina A&T State University", city: "Greensboro", state: "NC", type: "public4", hbcu: true,
    online: true, hybrid: true, campus: true, website: "https://www.ncat.edu/", admissionsUrl: "https://www.ncat.edu/admissions/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Engineering", "Nursing", "Computer Science", "Agriculture"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-nccu", name: "North Carolina Central University", city: "Durham", state: "NC", type: "public4", hbcu: true,
    online: true, hybrid: true, campus: true, website: "https://www.nccu.edu/", admissionsUrl: "https://www.nccu.edu/admissions",
    degrees: ["Bachelor's", "Master's", "Professional"], majors: ["Biology", "Nursing", "Pharmaceutical Sciences", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-wssu", name: "Winston-Salem State University", city: "Winston-Salem", state: "NC", type: "public4", hbcu: true,
    online: true, hybrid: true, campus: true, website: "https://www.wssu.edu/", admissionsUrl: "https://www.wssu.edu/admissions/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Nursing (BSN)", "Biology", "Exercise Science", "Health Care Management"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-ecsu", name: "Elizabeth City State University", city: "Elizabeth City", state: "NC", type: "public4", hbcu: true,
    online: true, hybrid: true, campus: true, website: "https://www.ecsu.edu/", admissionsUrl: "https://www.ecsu.edu/admissions/",
    degrees: ["Bachelor's", "Master's"], majors: ["Biology", "Aviation Science", "Computer Science", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, freeAppNote: "NC Promise tuition program participant — confirm current rates.",
    testPolicy: "Check current testing policy on the admissions site", transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-uncfsu", name: "Fayetteville State University", city: "Fayetteville", state: "NC", type: "public4", hbcu: true,
    online: true, hybrid: true, campus: true, website: "https://www.uncfsu.edu/", admissionsUrl: "https://www.uncfsu.edu/admissions",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN)", "Criminal Justice", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, freeAppNote: "NC Promise tuition program participant — confirm current rates.",
    testPolicy: "Check current testing policy on the admissions site", transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-uncp", name: "University of North Carolina at Pembroke", city: "Pembroke", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.uncp.edu/", admissionsUrl: "https://www.uncp.edu/admissions",
    degrees: ["Bachelor's", "Master's"], majors: ["Biology", "Nursing (BSN)", "Business", "Education"],
    tuitionInState: null, tuitionOutState: null, appFee: null, freeAppNote: "NC Promise tuition program participant — confirm current rates.",
    testPolicy: "Check current testing policy on the admissions site", transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-wcu", name: "Western Carolina University", city: "Cullowhee", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.wcu.edu/", admissionsUrl: "https://www.wcu.edu/apply/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN)", "Engineering Technology", "Forensic Science"],
    tuitionInState: null, tuitionOutState: null, appFee: null, freeAppNote: "NC Promise tuition program participant — confirm current rates.",
    testPolicy: "Check current testing policy on the admissions site", transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-uncg", name: "University of North Carolina at Greensboro", city: "Greensboro", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.uncg.edu/", admissionsUrl: "https://admissions.uncg.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN)", "Public Health", "Business"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-charlotte", name: "University of North Carolina at Charlotte", city: "Charlotte", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.charlotte.edu/", admissionsUrl: "https://admissions.charlotte.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Computer Science", "Engineering", "Nursing (BSN)"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-appstate", name: "Appalachian State University", city: "Boone", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.appstate.edu/", admissionsUrl: "https://admissions.appstate.edu/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Biology", "Nursing (BSN)", "Business", "Sustainable Development"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-uncw", name: "University of North Carolina Wilmington", city: "Wilmington", state: "NC", type: "public4", hbcu: false,
    online: true, hybrid: true, campus: true, website: "https://www.uncw.edu/", admissionsUrl: "https://uncw.edu/admissions/",
    degrees: ["Bachelor's", "Master's", "Doctoral"], majors: ["Marine Biology", "Biology", "Nursing (BSN)", "Clinical Research"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current testing policy on the admissions site",
    transferFriendly: true, accreditation: "SACSCOC",
  }),
  base({
    id: "col-asuonline", name: "Arizona State University (ASU Online)", city: "Tempe", state: "AZ", type: "public4", hbcu: false,
    online: true, hybrid: false, campus: true, website: "https://www.asu.edu/", admissionsUrl: "https://asuonline.asu.edu/",
    degrees: ["Bachelor's (online)", "Master's (online)"], majors: ["Biological Sciences (online)", "Health Sciences", "Computer Science"],
    tuitionInState: null, tuitionOutState: null, appFee: null, testPolicy: "Check current admission requirements",
    transferFriendly: true, accreditation: "HLC (Higher Learning Commission)",
    labNote: "Lab format for online science degrees varies (at-home kits, virtual or in-person intensives). Confirm with the program before enrolling.",
  }),
];
