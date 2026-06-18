import {
  BellRing,
  Briefcase,
  CalendarClock,
  LayoutDashboard,
  MessageSquareText,
  Search,
  ShieldCheck,
  Tags,
  type LucideIcon,
  Users,
} from "lucide-react";

export interface FeatureDefinition {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ReviewDefinition {
  name: string;
  username: string;
  body: string;
  img: string;
}

export interface FaqDefinition {
  question: string;
  answer: string;
}

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface MemberInviteDefinition {
  initial: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarColor: string;
  badgeBg: string;
  badgeColor: string;
}

export const features: FeatureDefinition[] = [
  {
    title: "Flexible Kanban Boards",
    description:
      "Create workspaces, boards, lists, and draggable cards for every project flow.",
    icon: LayoutDashboard,
  },
  {
    title: "Realtime Board Presence",
    description:
      "See active teammates, card viewers, editors, and comment typing states as work moves.",
    icon: Users,
  },
  {
    title: "Card Comments & Activity",
    description:
      "Keep decisions close to the task with card discussions and a complete activity trail.",
    icon: MessageSquareText,
  },
  {
    title: "Search & Smart Filters",
    description:
      "Find cards by keyword, assignee, label, due date, or unassigned status.",
    icon: Search,
  },
  {
    title: "Secure Sessions",
    description:
      "Email OTP signup, password login, JWT auth, refresh rotation, and session controls.",
    icon: ShieldCheck,
  },
  {
    title: "Built for Teams",
    description:
      "Workspace roles, private boards, board member roles, and permission-aware actions.",
    icon: Briefcase,
  },
  {
    title: "Labels & Due Dates",
    description:
      "Classify cards with board labels, assign owners, and track upcoming deadlines.",
    icon: Tags,
  },
  {
    title: "Board Notifications",
    description:
      "Receive in-app alerts for assignments, comments, member changes, and reminders.",
    icon: BellRing,
  },
  {
    title: "Due Reminder Pipeline",
    description:
      "Track pending, sent, and canceled due-date reminders for assigned card owners.",
    icon: CalendarClock,
  },
];

export const reviews: ReviewDefinition[] = [
  {
    name: "Alex Rivera",
    username: "@alex_pm",
    body: "The board updates and card discussions keep planning focused without bouncing between tools.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Sarah Chen",
    username: "@sarah_design",
    body: "Private boards and clear roles make it easy to invite the right people into the right work.",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Marcus Thorne",
    username: "@marcus_ops",
    body: "Filters by assignee, label, and due date make daily standups much faster.",
    img: "https://avatar.vercel.sh/marcus",
  },
  {
    name: "Elena Vogt",
    username: "@elena_eng",
    body: "Clean, fast, and reliable. The activity feed makes board changes easy to follow.",
    img: "https://avatar.vercel.sh/elena",
  },
  {
    name: "David Kim",
    username: "@david_creative",
    body: "Granular permissions meant we could finally invite clients into our boards without worrying about internal notes.",
    img: "https://avatar.vercel.sh/david",
  },
  {
    name: "Julia Lopez",
    username: "@julia_founder",
    body: "The workspace model, board roles, and notifications are exactly what our small team needed.",
    img: "https://avatar.vercel.sh/julia",
  },
];

export const faqs: FaqDefinition[] = [
  {
    question: "What exactly is Collability?",
    answer:
      "Collability is a team workspace for planning projects with Kanban boards. It brings together workspaces, board permissions, draggable cards, card comments, activity history, presence, and notifications in one focused dashboard.",
  },
  {
    question: "What realtime features are included?",
    answer:
      "Board events are delivered over Socket.IO, so members can see list, card, comment, member, and notification changes without refreshing. Presence also shows active teammates, card viewers, editors, and users typing comments.",
  },
  {
    question: "How are permissions handled?",
    answer:
      "Workspaces support owner, admin, member, and guest roles. Boards can be visible to the workspace or private, and board members can be managers, contributors, or viewers.",
  },
  {
    question: "Can we self-host Collability?",
    answer:
      "Yes. The repository includes production Dockerfiles, Docker Compose, an Nginx reverse-proxy template, TLS-ready domain configuration, and an EC2 deployment script that runs Prisma migrations before restarting the stack.",
  },
  {
    question: "How does signup work?",
    answer:
      "New users verify their email with an OTP before creating an account. Login uses access tokens and rotating refresh-token sessions, with controls for viewing and revoking active sessions.",
  },
  {
    question: "What can teams track on cards?",
    answer:
      "Cards support descriptions, due dates, labels, assignees, comments, activity history, and board-wide search and filters.",
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    title: "1. Create Workspace",
    description:
      "Set up your virtual office by creating dedicated workspaces and organizing projects.",
  },
  {
    title: "2. Add Members",
    description:
      "Bring people into workspaces with join codes and assign clear workspace or board roles.",
  },
  {
    title: "3. Lists & Cards",
    description:
      "Break down massive projects. Build vertical lists and action-oriented cards.",
  },
  {
    title: "4. Collaborate",
    description:
      "Discuss cards, track activity, watch presence, and receive notifications as the board changes.",
  },
];

export const memberInvites: MemberInviteDefinition[] = [
  {
    initial: "A",
    name: "Alice",
    role: "Admin",
    avatarBg: "rgba(139,92,246,0.18)",
    avatarColor: "#a78bfa",
    badgeBg: "rgba(139,92,246,0.12)",
    badgeColor: "#a78bfa",
  },
  {
    initial: "B",
    name: "Bob",
    role: "Contributor",
    avatarBg: "rgba(59,130,246,0.18)",
    avatarColor: "#93c5fd",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeColor: "#93c5fd",
  },
  {
    initial: "C",
    name: "Carol",
    role: "Guest",
    avatarBg: "rgba(255,255,255,0.08)",
    avatarColor: "rgba(255,255,255,0.45)",
    badgeBg: "rgba(255,255,255,0.07)",
    badgeColor: "rgba(255,255,255,0.4)",
  },
];

export const memberInviteEmail = "carol@company.com";
