// Career profiles. Wage and outlook figures come from the U.S. Bureau of Labor
// Statistics Occupational Outlook Handbook (OOH): median pay for May 2023 and
// projected employment change 2023–33. National figures only; pay varies by state
// and metro area. Check the linked OOH page for the latest release.

export interface Career {
  id: string;
  title: string;
  cluster: "Healthcare" | "Science" | "Technology" | "Engineering" | "Business";
  description: string;
  education: string;
  licensing: string;
  titles: string[];
  environments: string;
  medianPay: number;
  outlookPct: number;
  degrees: string[];
  roadmap: string[];
  sourceUrl: string;
  caution?: string;
}

export const WAGE_SOURCE = "U.S. Bureau of Labor Statistics, Occupational Outlook Handbook — median pay May 2023; projections 2023–33 (national)";

export const CAREERS: Career[] = [
  {
    id: "registered-nurse", title: "Registered Nurse", cluster: "Healthcare",
    description: "Provide and coordinate patient care, educate patients about health conditions, and support patients and families.",
    education: "Associate degree in nursing (ADN), Bachelor of Science in Nursing (BSN), or a diploma from an approved nursing program",
    licensing: "Must pass the NCLEX-RN and hold a state nursing license",
    titles: ["Staff Nurse", "Clinical Nurse", "Charge Nurse"], environments: "Hospitals, clinics, schools, home health, long-term care",
    medianPay: 86070, outlookPct: 6, degrees: ["ADN", "BSN"],
    roadmap: ["High school: biology, chemistry, math", "Complete prerequisite courses (anatomy, microbiology)", "Get admitted to an approved ADN or BSN program", "Complete in-person clinical rotations", "Pass the NCLEX-RN", "Optional: RN-to-BSN (often online)"],
    sourceUrl: "https://www.bls.gov/ooh/healthcare/registered-nurses.htm",
    caution: "Nursing programs require in-person clinical placements even when lectures are online.",
  },
  {
    id: "lpn", title: "Licensed Practical Nurse", cluster: "Healthcare",
    description: "Provide basic nursing care under the direction of registered nurses and doctors.",
    education: "State-approved practical nursing certificate or diploma (about one year)", licensing: "Must pass the NCLEX-PN",
    titles: ["LPN", "LVN"], environments: "Nursing homes, physicians' offices, home health", medianPay: 59730, outlookPct: 3,
    degrees: ["Practical Nursing Diploma"], roadmap: ["Enroll in an approved practical nursing program", "Complete clinical hours", "Pass the NCLEX-PN"],
    sourceUrl: "https://www.bls.gov/ooh/healthcare/licensed-practical-and-licensed-vocational-nurses.htm",
  },
  {
    id: "clinical-lab", title: "Clinical Laboratory Technologist / Technician", cluster: "Healthcare",
    description: "Collect samples and perform tests to analyze body fluids, tissue and other substances.",
    education: "Bachelor's degree for technologists; associate degree or certificate for technicians",
    licensing: "Some states require a license; certification is often preferred by employers",
    titles: ["Medical Laboratory Scientist", "Medical Lab Technician"], environments: "Hospitals, diagnostic labs, physicians' offices",
    medianPay: 60780, outlookPct: 5, degrees: ["BS Medical Laboratory Science", "AAS Medical Lab Technology"],
    roadmap: ["Take biology & chemistry", "Complete an accredited MLS/MLT program (includes in-person lab practicum)", "Earn certification"],
    sourceUrl: "https://www.bls.gov/ooh/healthcare/clinical-laboratory-technologists-and-technicians.htm",
    caution: "A general Biology degree alone usually doesn't qualify you for certification; an accredited MLS program or practicum is typically required.",
  },
  {
    id: "health-manager", title: "Medical and Health Services Manager", cluster: "Business",
    description: "Plan, direct and coordinate the business activities of healthcare providers.",
    education: "Bachelor's degree, often with work experience; many hold a master's", licensing: "Nursing home administrators must be licensed",
    titles: ["Healthcare Administrator", "Practice Manager", "Clinical Manager"], environments: "Hospitals, group practices, nursing facilities",
    medianPay: 110680, outlookPct: 29, degrees: ["BS Health Administration", "MHA", "MBA"],
    roadmap: ["Bachelor's in health administration or business", "Gain healthcare work experience", "Consider a master's degree"],
    sourceUrl: "https://www.bls.gov/ooh/management/medical-and-health-services-managers.htm",
  },
  {
    id: "microbiologist", title: "Microbiologist", cluster: "Science",
    description: "Study microorganisms such as bacteria, viruses, algae, fungi and parasites.",
    education: "Bachelor's degree for entry-level jobs; Ph.D. for independent research", licensing: "None typically required",
    titles: ["Research Associate", "Quality Control Microbiologist"], environments: "Labs in research, government, pharmaceutical and manufacturing",
    medianPay: 84400, outlookPct: 5, degrees: ["BS Biology", "BS Microbiology"],
    roadmap: ["AS degree at community college (biology, chemistry)", "Transfer to a BS Biology/Microbiology program", "Undergraduate research or internship", "Entry-level lab role or graduate school"],
    sourceUrl: "https://www.bls.gov/ooh/life-physical-and-social-science/microbiologists.htm",
    caution: "Lab-intensive coursework. Confirm how online programs handle lab requirements.",
  },
  {
    id: "wildlife-biologist", title: "Zoologist and Wildlife Biologist", cluster: "Science",
    description: "Study animals and other wildlife and how they interact with their ecosystems.",
    education: "Bachelor's degree for entry-level; master's for higher-level investigative work", licensing: "None typically required",
    titles: ["Wildlife Biologist", "Field Biologist"], environments: "Offices, labs and outdoors in all weather",
    medianPay: 70600, outlookPct: 5, degrees: ["BS Biology", "BS Wildlife Science"],
    roadmap: ["AS degree with biology & chemistry", "BS in biology or wildlife science", "Field experience / seasonal technician jobs"],
    sourceUrl: "https://www.bls.gov/ooh/life-physical-and-social-science/zoologists-and-wildlife-biologists.htm",
  },
  {
    id: "respiratory-therapist", title: "Respiratory Therapist", cluster: "Healthcare",
    description: "Care for patients who have trouble breathing, from premature infants to older adults.",
    education: "Associate degree (bachelor's increasingly preferred)", licensing: "Licensed in all states except Alaska; certification required",
    titles: ["Respiratory Care Practitioner"], environments: "Hospitals, nursing facilities", medianPay: 77960, outlookPct: 13,
    degrees: ["AAS Respiratory Therapy", "BS Respiratory Therapy"],
    roadmap: ["Accredited respiratory therapy program", "Clinical rotations", "Pass credentialing exam", "State license"],
    sourceUrl: "https://www.bls.gov/ooh/healthcare/respiratory-therapists.htm",
  },
  {
    id: "software-developer", title: "Software Developer", cluster: "Technology",
    description: "Design computer applications and programs, and test and maintain software.",
    education: "Bachelor's degree in computer science or a related field is typical", licensing: "None required",
    titles: ["Software Engineer", "Application Developer", "Web Developer"], environments: "Offices, often remote or hybrid",
    medianPay: 132270, outlookPct: 17, degrees: ["BS Computer Science", "BS Software Engineering"],
    roadmap: ["Learn programming fundamentals", "AS or BS in computer science", "Build portfolio projects", "Internships", "Entry-level developer role"],
    sourceUrl: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm",
  },
  {
    id: "mechanical-engineer", title: "Mechanical Engineer", cluster: "Engineering",
    description: "Design, develop, build and test mechanical and thermal sensors and devices.",
    education: "Bachelor's degree in mechanical engineering (ABET-accredited)", licensing: "PE license for some senior roles",
    titles: ["Design Engineer", "Manufacturing Engineer"], environments: "Offices, plants, labs", medianPay: 99510, outlookPct: 11,
    degrees: ["BS Mechanical Engineering"],
    roadmap: ["Calculus & physics in high school", "Associate in Engineering (AE) transfer option", "ABET-accredited BS", "Co-op or internship", "FE exam"],
    sourceUrl: "https://www.bls.gov/ooh/architecture-and-engineering/mechanical-engineers.htm",
  },
];
