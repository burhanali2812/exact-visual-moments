export type Status =
  | "Submitted"
  | "Under Review"
  | "In Progress"
  | "Escalated"
  | "Resolved"
  | "Rejected"
  | "Overdue";

export const UNIVERSITY = {
  name: "Capital Science University",
  abbr: "CSU",
  campus: "Islamabad Main Campus",
  domain: "@csu.edu.pk",
};

export const PROGRAMS = ["BS Software Engineering", "BS Computer Science", "BBA"];

export const CATEGORIES = [
  "Academic",
  "Examination/Result",
  "Fee & Finance",
  "Hostel",
  "Transport",
  "Harassment",
  "Faculty Behavior",
  "Facilities",
  "Other",
];

// Configured per-university chain: titles are job titles, not system roles.
export const CHAIN = [
  { level: 1, title: "Counselor", days: 3 },
  { level: 2, title: "Program Incharge", days: 3 },
  { level: 3, title: "HOD", days: 5 },
  { level: 4, title: "Campus Incharge", days: 5 },
  { level: 5, title: "Rector", days: 7, final: true },
];

export type StepState = "done" | "current" | "pending";
export interface TimelineEntry {
  level: number;
  status: string;
  date?: string;
  remark?: string;
  internal?: boolean;
}
export interface Complaint {
  id: string;
  title: string;
  category: string;
  status: Status;
  level: number;
  updated: string;
  description: string;
  attachments: string[];
  anonymous: boolean;
  timeline: TimelineEntry[];
  rejectReason?: string;
  messages: { from: "me" | "staff"; text: string; time: string }[];
}

const base: [string, string, Status, number, string][] = [
  ["Exam Result Correction", "Examination/Result", "Under Review", 2, "Today"],
  ["Library Wi-Fi Not Working", "Facilities", "In Progress", 1, "Yesterday"],
  ["Hostel Water Supply Issue", "Hostel", "Escalated", 3, "Oct 3"],
  ["Mid-term Re-evaluation Request", "Examination/Result", "Rejected", 2, "Oct 2"],
  ["Classroom AC Issue", "Facilities", "Resolved", 1, "Oct 1"],
  ["Bus Route 4 Delays", "Transport", "Overdue", 1, "Sep 30"],
  ["Course Registration Error", "Academic", "Submitted", 1, "Sep 30"],
  ["Lab Equipment Broken", "Facilities", "Resolved", 1, "Sep 29"],
  ["Scholarship Disbursement Delay", "Fee & Finance", "In Progress", 2, "Sep 28"],
  ["Unfair Attendance Marking", "Faculty Behavior", "Escalated", 3, "Sep 27"],
  ["Fee Voucher Issue", "Fee & Finance", "In Progress", 1, "Sep 26"],
  ["Cafeteria Hygiene Concern", "Other", "Resolved", 1, "Sep 24"],
  ["Hostel Room Allocation", "Hostel", "Resolved", 2, "Sep 22"],
  ["Transcript Request Pending", "Academic", "Resolved", 1, "Sep 20"],
  ["Parking Permit Not Issued", "Transport", "Rejected", 1, "Sep 18"],
  ["Projector Not Working in B-204", "Facilities", "Resolved", 1, "Sep 15"],
  ["Late Fee Charged Incorrectly", "Fee & Finance", "Resolved", 2, "Sep 12"],
  ["Elective Course Not Offered", "Academic", "Resolved", 3, "Sep 10"],
  ["Sports Complex Timings", "Other", "Resolved", 1, "Sep 8"],
  ["Final Exam Clash", "Examination/Result", "Resolved", 2, "Sep 5"],
];

const descs: Record<string, string> = {
  "Exam Result Correction":
    "My Data Structures final result appears incorrectly recorded. I received 78 marks according to my result sheet, but the portal shows 68.",
};

function buildTimeline(status: Status, level: number): TimelineEntry[] {
  const t: TimelineEntry[] = [];
  const dates = ["Sep 28", "Sep 29", "Oct 1", "Oct 3", "Oct 5"];
  for (let l = 1; l <= level; l++) {
    const isCurrent = l === level;
    let s = "Forwarded";
    let remark: string | undefined = `Complaint reviewed and forwarded to the ${CHAIN[l]?.title ?? "next level"}.`;
    if (l === 1 && level === 1) {
      s = status;
      remark = status === "Submitted" ? undefined : "We are looking into this issue.";
    }
    if (isCurrent && l > 1) {
      s = status === "Escalated" ? "Escalated" : status;
      remark = "Checking the examination record with the department.";
    }
    if (status === "Resolved" && isCurrent) remark = "Issue has been resolved. Please confirm.";
    if (status === "Rejected" && isCurrent) remark = "Evidence reviewed against official records.";
    t.push({ level: l, status: l === 1 && !isCurrent ? "Submitted" : s, date: dates[l - 1], remark });
    if (isCurrent) t.push({ level: l, status: "internal", remark: "Internal note — do not show", internal: true });
  }
  return t;
}

export const COMPLAINTS: Complaint[] = base.map(([title, category, status, level, updated], i) => ({
  id: `CMP-2026-${String(42 - i).padStart(4, "0")}`,
  title,
  category,
  status,
  level,
  updated,
  description:
    descs[title] ??
    `I would like to report: ${title.toLowerCase()}. This has been affecting students for several days and needs attention from the relevant department.`,
  attachments: i % 3 === 0 ? ["result_sheet.pdf", "portal_screenshot.jpg"] : i % 3 === 1 ? ["photo_1.jpg"] : [],
  anonymous: category === "Harassment",
  timeline: buildTimeline(status, level),
  rejectReason:
    status === "Rejected" ? "Submitted evidence did not match the official examination record." : undefined,
  messages:
    i === 0
      ? [
          { from: "me", text: "Attached my original result sheet for reference.", time: "Sep 28" },
          { from: "staff", text: "Thanks, we've shared it with the exam office.", time: "Sep 29" },
        ]
      : [],
}));

export const isActive = (s: Status) => !["Resolved", "Rejected"].includes(s);

export interface Notif {
  id: number;
  text: string;
  complaintId: string;
  time: string;
  unread: boolean;
  kind: "review" | "escalate" | "resolved" | "rejected";
}
export const NOTIFICATIONS: Notif[] = [
  { id: 1, text: "Your complaint CMP-2026-0042 is now under review.", complaintId: "CMP-2026-0042", time: "2h ago", unread: true, kind: "review" },
  { id: 2, text: "Your complaint was forwarded to Level 3 · HOD.", complaintId: "CMP-2026-0040", time: "Yesterday", unread: true, kind: "escalate" },
  { id: 3, text: "Complaint CMP-2026-0038 has been resolved.", complaintId: "CMP-2026-0038", time: "Oct 1", unread: false, kind: "resolved" },
  { id: 4, text: "Your complaint has been rejected.", complaintId: "CMP-2026-0039", time: "Oct 2", unread: false, kind: "rejected" },
];
