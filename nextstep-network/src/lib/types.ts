// Core data model for NextStep Network.
// Every table row has an `id` and `createdAt`. The Supabase schema in
// supabase/migrations mirrors these shapes using snake_case column names.

export type Role = "student" | "parent" | "college" | "employer" | "mentor" | "counselor" | "admin";
export type AgeGroup = "minor" | "adult";
export type Visibility = "public" | "network" | "private";

export interface BaseRow {
  id: string;
  createdAt: string;
}

export interface User extends BaseRow {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  ageGroup: AgeGroup;
  status: "active" | "suspended";
  /** Organization, mentor and counselor accounts need admin verification before elevated privileges. */
  verified: boolean;
  orgId?: string | null;
  isDemo?: boolean;
}

export interface Entry {
  title: string;
  org?: string;
  start?: string;
  end?: string;
  description?: string;
}

export interface Profile extends BaseRow {
  userId: string;
  headline: string;
  about: string;
  school: string;
  schoolLevel: "high_school" | "community_college" | "university" | "trade_school" | "graduate" | "other";
  gradYear: number | null;
  state: string;
  city: string;
  careerInterests: string[];
  skills: string[];
  education: Entry[];
  experience: Entry[];
  projects: Entry[];
  volunteer: Entry[];
  activities: Entry[];
  awards: Entry[];
  certifications: Entry[];
  links: { label: string; url: string }[];
  avatarUrl: string;
  bannerUrl: string;
  visibility: Visibility;
  learningFormat?: "online" | "hybrid" | "on_campus" | "";
  /** Private planning data. Never rendered on public profiles. */
  residencyStatus?: "not_started" | "in_progress" | "submitted" | "pending" | "determined_resident" | "determined_nonresident";
  parentLinkCode?: string | null;
}

export type PostCategory = "general" | "scholarship" | "college" | "internship" | "success" | "advice" | "event" | "question";

export interface Post extends BaseRow {
  authorId: string;
  orgId?: string | null;
  groupId?: string | null;
  body: string;
  category: PostCategory;
  link?: string | null;
  imageUrl?: string | null;
  repostOfId?: string | null;
  removed: boolean;
}

export interface Comment extends BaseRow {
  postId: string;
  authorId: string;
  body: string;
  removed: boolean;
}

export type ReactionType = "like" | "celebrate" | "insightful" | "support";
export interface Reaction extends BaseRow {
  postId: string;
  userId: string;
  type: ReactionType;
}

export type SavedKind = "post" | "college" | "scholarship" | "job" | "event" | "fee_waiver";
export interface SavedItem extends BaseRow {
  userId: string;
  kind: SavedKind;
  refId: string;
}

export interface Connection extends BaseRow {
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "declined";
}

export interface Block extends BaseRow {
  blockerId: string;
  blockedId: string;
}

export interface Organization extends BaseRow {
  name: string;
  type: "college" | "employer" | "nonprofit" | "government";
  verified: boolean;
  description: string;
  website: string;
  location: string;
  ownerId?: string | null;
  collegeId?: string | null;
  isDemo?: boolean;
}

export interface Follow extends BaseRow {
  userId: string;
  orgId: string;
}

export interface Group extends BaseRow {
  name: string;
  description: string;
  visibility: "public" | "private";
  adminId: string;
  rules: string[];
  resources: { label: string; url: string }[];
  adultsOnly: boolean;
  tags: string[];
}

export interface GroupMember extends BaseRow {
  groupId: string;
  userId: string;
  status: "member" | "pending";
  role: "admin" | "moderator" | "member";
}

export interface Conversation extends BaseRow {
  participantIds: string[];
  updatedAt: string;
}

export interface Message extends BaseRow {
  conversationId: string;
  senderId: string;
  body: string;
  readBy: string[];
}

export interface Notification extends BaseRow {
  userId: string;
  type: "connection" | "group" | "deadline" | "post" | "comment" | "reaction" | "system" | "job" | "message";
  text: string;
  href: string;
  read: boolean;
}

export interface NotificationPrefs extends BaseRow {
  userId: string;
  categories: Record<string, boolean>;
  frequency: "realtime" | "daily" | "weekly";
  email: boolean;
}

export interface Verification {
  status: "verified" | "unverified" | "demo";
  source?: string;
  sourceUrl?: string;
  checkedAt?: string;
}

export interface College extends BaseRow {
  name: string;
  city: string;
  state: string;
  type: "community" | "public4" | "private4" | "trade";
  hbcu: boolean;
  online: boolean;
  hybrid: boolean;
  campus: boolean;
  website: string;
  admissionsUrl: string;
  degrees: string[];
  majors: string[];
  tuitionInState: number | null;
  tuitionOutState: number | null;
  appFee: number | null;
  freeAppNote?: string;
  testPolicy: string;
  transferFriendly: boolean;
  labNote?: string;
  accreditation: string;
  financialAidUrl?: string;
  verification: Verification;
  publishStatus: PublishStatus;
}

export type PublishStatus = "draft" | "pending_review" | "approved" | "published" | "archived";

export type AppStatus = "interested" | "preparing" | "in_progress" | "submitted" | "under_review" | "accepted" | "waitlisted" | "declined" | "enrolled";

export interface CollegeApplication extends BaseRow {
  userId: string;
  collegeId: string;
  status: AppStatus;
  appType: string;
  deadline: string | null;
  fee: number | null;
  feeWaiver: boolean;
  checklist: Record<string, boolean>;
  submittedAt: string | null;
  decisionDate: string | null;
  enrollmentDeposit: string;
  confirmationNumber: string;
  notes: string;
}

export interface FafsaProgress extends BaseRow {
  userId: string;
  awardYear: string;
  steps: Record<string, { done: boolean; note: string }>;
}

export interface AidOffer extends BaseRow {
  userId: string;
  collegeName: string;
  tuition: number;
  fees: number;
  housing: number;
  books: number;
  transportation: number;
  grants: number;
  scholarships: number;
  workStudy: number;
  loans: number;
}

export interface Scholarship extends BaseRow {
  name: string;
  sponsor: string;
  amountText: string;
  amountMax: number | null;
  eligibility: string;
  levels: ("high_school" | "college" | "transfer")[];
  tags: string[];
  states: string[];
  essay: boolean;
  renewable: boolean;
  needBased: boolean;
  firstGen: boolean;
  deadline: string | null;
  deadlineNote: string;
  documents: string[];
  url: string;
  verification: Verification;
  publishStatus: PublishStatus;
}

export type ScholarshipAppStatus = "saved" | "preparing" | "submitted" | "awarded" | "not_awarded";
export interface ScholarshipApplication extends BaseRow {
  userId: string;
  scholarshipId: string;
  status: ScholarshipAppStatus;
  notes: string;
}

export interface Job extends BaseRow {
  title: string;
  orgId: string;
  location: string;
  arrangement: "remote" | "hybrid" | "on_site";
  payText: string;
  paid: boolean;
  category: string;
  level: "high_school" | "college" | "graduate";
  minAge: number | null;
  schedule: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  deadline: string | null;
  url: string | null;
  status: "pending" | "approved" | "rejected";
  isDemo: boolean;
  postedById: string;
}

export type JobAppStatus = "saved" | "applied" | "interviewing" | "offer" | "not_selected";
export interface JobApplication extends BaseRow {
  userId: string;
  jobId: string;
  status: JobAppStatus;
  notes: string;
}

export interface EventItem extends BaseRow {
  title: string;
  date: string;
  kind: "deadline" | "fair" | "visit" | "workshop" | "networking" | "orientation" | "testing" | "other";
  location: string;
  url: string | null;
  orgId?: string | null;
  description: string;
  isDemo: boolean;
}

export interface Task extends BaseRow {
  userId: string;
  title: string;
  date: string | null;
  kind: "application" | "fafsa" | "scholarship" | "job" | "event" | "personal";
  done: boolean;
  href?: string;
}

export interface Report extends BaseRow {
  reporterId: string;
  targetType: "post" | "comment" | "user" | "group" | "job" | "message";
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
}

export interface AuditLog extends BaseRow {
  actorId: string;
  action: string;
  target: string;
  details?: string;
}

export interface Essay extends BaseRow {
  userId: string;
  title: string;
  prompt: string;
  target: string;
  versions: { body: string; savedAt: string }[];
}

export interface Course extends BaseRow {
  userId: string;
  name: string;
  schoolYear: string;
  term: string;
  credit: number;
  level: "standard" | "honors" | "ap" | "ib" | "dual_enrollment" | "college";
  grade: string;
}

export interface Session extends BaseRow {
  userId: string;
  tokenHash: string;
  expiresAt: string;
}

export interface UserDoc extends BaseRow {
  userId: string;
  kind: "resume" | "transfer_plan" | "notes" | "cover_letter" | "passport";
  data: Record<string, unknown>;
}

export interface AiUsage extends BaseRow {
  userId: string;
  day: string;
  count: number;
}

export interface ParentLink extends BaseRow {
  parentId: string;
  studentId: string;
}

export interface SiteSetting extends BaseRow {
  key: string;
  value: string;
}

export interface Tables {
  users: User;
  profiles: Profile;
  sessions: Session;
  posts: Post;
  comments: Comment;
  reactions: Reaction;
  saved_items: SavedItem;
  connections: Connection;
  blocks: Block;
  organizations: Organization;
  follows: Follow;
  groups: Group;
  group_members: GroupMember;
  conversations: Conversation;
  messages: Message;
  notifications: Notification;
  notification_prefs: NotificationPrefs;
  colleges: College;
  college_applications: CollegeApplication;
  fafsa_progress: FafsaProgress;
  aid_offers: AidOffer;
  scholarships: Scholarship;
  scholarship_applications: ScholarshipApplication;
  jobs: Job;
  job_applications: JobApplication;
  events: EventItem;
  tasks: Task;
  reports: Report;
  audit_logs: AuditLog;
  essays: Essay;
  courses: Course;
  user_docs: UserDoc;
  ai_usage: AiUsage;
  parent_links: ParentLink;
  site_settings: SiteSetting;
}

export type TableName = keyof Tables;
