import {
  BellRing,
  Briefcase,
  CloudUpload,
  History,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
  Users,
  WifiOff,
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
      "Create, organize, and drag-and-drop cards across lists seamlessly.",
    icon: LayoutDashboard,
  },
  {
    title: "Real-Time Collaboration",
    description:
      "CRDT-powered multi-user document editing with live presence tracking.",
    icon: Users,
  },
  {
    title: "Offline First Architecture",
    description:
      "Edits persist locally while offline and sync immediately upon reconnecting.",
    icon: WifiOff,
  },
  {
    title: "Mobile App (Planned)",
    description:
      "Manage your team's workflow seamlessly from anywhere on iOS and Android.",
    icon: Smartphone,
  },
  {
    title: "Secure Payments",
    description:
      "Enterprise-grade secure payment processing built for modern teams.",
    icon: ShieldCheck,
  },
  {
    title: "Built for Teams",
    description:
      "Robust Role-Based Access Control (RBAC) and comprehensive activity audit logs.",
    icon: Briefcase,
  },
  {
    title: "File Attachments",
    description:
      "Integrated S3-compatible storage with signed URLs for secure and easy uploads.",
    icon: CloudUpload,
  },
  {
    title: "Real-Time Notifications",
    description:
      "Instant in-app alerts and reliable asynchronous background email delivery.",
    icon: BellRing,
  },
  {
    title: "Snapshot Versioning",
    description:
      "Automatic document snapshots allow you to safely restore previous states.",
    icon: History,
  },
];

export const reviews: ReviewDefinition[] = [
  {
    name: "Alex Rivera",
    username: "@alex_pm",
    body: "The real-time synchronization is magic. We've replaced three other tools with just one workspace.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Sarah Chen",
    username: "@sarah_design",
    body: "Finally, a tool that understands that documents and tasks belong together. Our productivity has doubled.",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Marcus Thorne",
    username: "@marcus_ops",
    body: "The offline mode is a life-saver for our field team. They can actually get work done without hunting for Wi-Fi.",
    img: "https://avatar.vercel.sh/marcus",
  },
  {
    name: "Elena Vogt",
    username: "@elena_eng",
    body: "Clean, fast, and reliable. Collability is the backbone of our remote-first culture.",
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
    body: "Moving from Notion and Trello was the best decision we made this year. It just feels more focused.",
    img: "https://avatar.vercel.sh/julia",
  },
];

export const faqs: FaqDefinition[] = [
  {
    question: "What exactly is Collability?",
    answer:
      "Collability is a unified workspace that combines real-time document editing and hierarchical Kanban boards. It's designed to stop teams from toggling between too many apps by putting tasks and content in the same place.",
  },
  {
    question: "How does the real-time sync handle conflicts?",
    answer:
      "We use advanced CRDT algorithms. This means that if two people edit the same word at the same time, the system mathematically merges the changes without ever asking you to 'resolve a conflict.'",
  },
  {
    question: "Is it really offline-first?",
    answer:
      "Yes. Unlike most cloud tools, Collability saves your entire workspace to a local database. You can keep editing while completely offline, and your changes will automatically push to the team when you're back on Wi-Fi.",
  },
  {
    question: "Can we self-host Collability?",
    answer:
      "Absolutely. We are open-source and provide a Docker image that you can deploy to your own private server in minutes. This is popular with privacy-conscious teams and government agencies.",
  },
  {
    question: "Is there a limit on boards or documents?",
    answer:
      "The open-source version has no limits on data. Our cloud-hosted team plan provides unlimited storage, workspaces, and team members with no hidden caps.",
  },
  {
    question: "When is the mobile app coming out?",
    answer:
      "The mobile version is currently in closed beta. It's built with the same offline-first sync engine and will be available for all users later this year.",
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
      "Invite your team via email or shareable links and assign granular access roles.",
  },
  {
    title: "3. Lists & Cards",
    description:
      "Break down massive projects. Build vertical lists and action-oriented cards.",
  },
  {
    title: "4. Collaborate",
    description:
      "Work together in absolute real-time. Edits sync instantly across devices.",
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
    role: "Editor",
    avatarBg: "rgba(59,130,246,0.18)",
    avatarColor: "#93c5fd",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeColor: "#93c5fd",
  },
  {
    initial: "C",
    name: "Carol",
    role: "Viewer",
    avatarBg: "rgba(255,255,255,0.08)",
    avatarColor: "rgba(255,255,255,0.45)",
    badgeBg: "rgba(255,255,255,0.07)",
    badgeColor: "rgba(255,255,255,0.4)",
  },
];

export const memberInviteEmail = "carol@company.com";
