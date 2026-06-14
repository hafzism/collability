"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Check,
  ChevronRight,
  Columns3,
  Search,
  Tag,
  UserCheck,
  UserRound,
  UserRoundX,
  X,
} from "lucide-react";

import {
  EMPTY_BOARD_CARD_FILTERS,
  normalizeBoardCardFilters,
  type BoardCardDueState,
  type BoardCardFilters,
} from "@/lib/board-card-filters";

import type { BoardLabel, BoardList, BoardMember } from "./board-types";
import { DashboardPopoverPanel } from "./dashboard-popover-panel";
import { getAvatarFallback } from "./workspace-utils";

type FilterSection = "assignees" | "labels" | "creators" | "lists" | "due_date";

type BoardFilterPopoverProps = {
  appliedFilters: BoardCardFilters;
  boardLabels: BoardLabel[];
  boardLists: BoardList[];
  boardMembers: BoardMember[];
  onApply: (filters: BoardCardFilters) => void;
  onClose: () => void;
};

function FilterOptionRow({
  icon: Icon,
  label,
  summary,
  onClick,
}: {
  icon: typeof UserCheck;
  label: string;
  summary: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-white/8 px-4 py-4 text-left transition hover:bg-white/[0.03]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/15 text-[#ecece8]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-[#f2f2ef]">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#8c8c86]">
            {summary}
          </span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#9b9b95]" />
    </button>
  );
}

function CheckboxRow({
  checked,
  icon,
  label,
  meta,
  onToggle,
}: {
  checked: boolean;
  icon?: ReactNode;
  label: string;
  meta?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
    >
      <span
        className={
          checked
            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-white/20 bg-white text-black"
            : "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-white/14 bg-transparent"
        }
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      {icon ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] font-semibold text-white">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-[#efefeb]">
          {label}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[11px] text-[#84847f]">
            {meta}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function RadioRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-[10px] px-1 py-2 text-left transition hover:bg-white/[0.03]"
    >
      <span
        className={
          checked
            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30"
            : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/14"
        }
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
      </span>
      <span className="text-[13px] text-[#efefeb]">{label}</span>
    </button>
  );
}

function countSummary(count: number, singular: string, emptyLabel: string) {
  if (count === 0) {
    return emptyLabel;
  }

  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${singular}s`;
}

function dueSummary(filters: BoardCardFilters) {
  if (filters.withoutDueDate) {
    return "No due date";
  }

  switch (filters.dueState) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due today";
    case "this_week":
      return "Due this week";
    default:
      break;
  }

  if (filters.dueFrom || filters.dueTo) {
    return "Custom range";
  }

  return "Any date";
}

export function BoardFilterPopover({
  appliedFilters,
  boardLabels,
  boardLists,
  boardMembers,
  onApply,
  onClose,
}: BoardFilterPopoverProps) {
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [activeSection, setActiveSection] = useState<FilterSection | null>(null);
  const [searchText, setSearchText] = useState("");

  const sortedMembers = useMemo(
    () =>
      [...boardMembers].sort((left, right) =>
        left.user.name.localeCompare(right.user.name),
      ),
    [boardMembers],
  );
  const sortedLabels = useMemo(
    () =>
      [...boardLabels].sort((left, right) => left.name.localeCompare(right.name)),
    [boardLabels],
  );
  const sortedLists = useMemo(
    () =>
      [...boardLists].sort((left, right) =>
        left.title.localeCompare(right.title),
      ),
    [boardLists],
  );
  const normalizedSearchText = searchText.trim().toLowerCase();

  const filteredMembers = useMemo(
    () =>
      sortedMembers.filter((member) => {
        if (!normalizedSearchText) {
          return true;
        }

        return (
          member.user.name.toLowerCase().includes(normalizedSearchText) ||
          member.user.email.toLowerCase().includes(normalizedSearchText)
        );
      }),
    [normalizedSearchText, sortedMembers],
  );
  const filteredLabels = useMemo(
    () =>
      sortedLabels.filter((label) =>
        normalizedSearchText
          ? label.name.toLowerCase().includes(normalizedSearchText)
          : true,
      ),
    [normalizedSearchText, sortedLabels],
  );
  const filteredLists = useMemo(
    () =>
      sortedLists.filter((list) =>
        normalizedSearchText
          ? list.title.toLowerCase().includes(normalizedSearchText)
          : true,
      ),
    [normalizedSearchText, sortedLists],
  );

  function openSection(section: FilterSection) {
    setActiveSection(section);
    setSearchText("");
  }

  function goBack() {
    setActiveSection(null);
    setSearchText("");
  }

  function toggleSelection(
    key: "assigneeIds" | "labelIds" | "creatorIds" | "listIds",
    value: string,
  ) {
    setDraftFilters((current) => {
      const values = current[key];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      if (key === "assigneeIds") {
        return normalizeBoardCardFilters({
          ...current,
          assigneeIds: nextValues,
          unassigned: nextValues.length > 0 ? false : current.unassigned,
        });
      }

      return normalizeBoardCardFilters({
        ...current,
        [key]: nextValues,
      });
    });
  }

  function toggleUnassigned() {
    setDraftFilters((current) =>
      normalizeBoardCardFilters({
        ...current,
        assigneeIds: current.unassigned ? current.assigneeIds : [],
        unassigned: !current.unassigned,
      }),
    );
  }

  function setDueState(value: BoardCardDueState | null) {
    setDraftFilters((current) =>
      normalizeBoardCardFilters({
        ...current,
        dueState: current.dueState === value ? null : value,
        dueFrom: "",
        dueTo: "",
        withoutDueDate: false,
      }),
    );
  }

  function setDateField(key: "dueFrom" | "dueTo", value: string) {
    setDraftFilters((current) =>
      normalizeBoardCardFilters({
        ...current,
        [key]: value,
        dueState: null,
        withoutDueDate: false,
      }),
    );
  }

  function toggleWithoutDueDate() {
    setDraftFilters((current) =>
      normalizeBoardCardFilters({
        ...current,
        withoutDueDate: !current.withoutDueDate,
        dueState: null,
        dueFrom: "",
        dueTo: "",
      }),
    );
  }

  function clearSection(section: FilterSection | null) {
    if (!section) {
      setDraftFilters(EMPTY_BOARD_CARD_FILTERS);
      return;
    }

    setDraftFilters((current) => {
      switch (section) {
        case "assignees":
          return normalizeBoardCardFilters({
            ...current,
            assigneeIds: [],
            unassigned: false,
          });
        case "labels":
          return normalizeBoardCardFilters({
            ...current,
            labelIds: [],
          });
        case "creators":
          return normalizeBoardCardFilters({
            ...current,
            creatorIds: [],
          });
        case "lists":
          return normalizeBoardCardFilters({
            ...current,
            listIds: [],
          });
        case "due_date":
          return normalizeBoardCardFilters({
            ...current,
            dueState: null,
            dueFrom: "",
            dueTo: "",
            withoutDueDate: false,
          });
      }
    });
  }

  const summaryItems = {
    assignees: draftFilters.unassigned
      ? "Unassigned only"
      : countSummary(draftFilters.assigneeIds.length, "assignee", "Any assignee"),
    labels: countSummary(draftFilters.labelIds.length, "label", "Any label"),
    creators: countSummary(draftFilters.creatorIds.length, "creator", "Any creator"),
    lists: countSummary(draftFilters.listIds.length, "list", "All lists"),
    due_date: dueSummary(draftFilters),
  } as const;

  return (
    <DashboardPopoverPanel className="left-0 right-auto top-[calc(100%+8px)] h-[420px] w-[360px]">
      {activeSection === null ? (
        <>
          <div className="flex items-start justify-between border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-[18px] font-semibold text-[#f4f4f1]">Filters</p>
              <p className="mt-1 text-[12px] text-[#8f8f89]">
                Apply board filters only when you are ready.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/[0.04] hover:text-white"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <FilterOptionRow
              icon={UserCheck}
              label="Assignees"
              summary={summaryItems.assignees}
              onClick={() => openSection("assignees")}
            />
            <FilterOptionRow
              icon={Tag}
              label="Labels"
              summary={summaryItems.labels}
              onClick={() => openSection("labels")}
            />
            <FilterOptionRow
              icon={UserRound}
              label="Creators"
              summary={summaryItems.creators}
              onClick={() => openSection("creators")}
            />
            <FilterOptionRow
              icon={Columns3}
              label="Lists"
              summary={summaryItems.lists}
              onClick={() => openSection("lists")}
            />
            <FilterOptionRow
              icon={CalendarClock}
              label="Due date"
              summary={summaryItems.due_date}
              onClick={() => openSection("due_date")}
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
            <button
              type="button"
              onClick={() => clearSection(null)}
              className="text-[13px] font-medium text-[#ededea] transition hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onApply(normalizeBoardCardFilters(draftFilters))}
              className="rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#ecece8]"
            >
              Apply filters
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
            <button
              type="button"
              onClick={goBack}
              className="rounded-[10px] p-2 text-[#ededea] transition hover:bg-white/[0.04]"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-[18px] font-semibold text-[#f4f4f1]">
              {activeSection === "due_date"
                ? "Due date"
                : activeSection.charAt(0).toUpperCase() +
                  activeSection.slice(1)}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/[0.04] hover:text-white"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activeSection !== "due_date" ? (
            <div className="border-b border-white/8 px-4 py-3">
              <label className="flex h-10 items-center gap-2 rounded-[10px] border border-white/10 bg-black/10 px-3 text-[#8f8f8f]">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={`Search ${activeSection}`}
                  className="w-full bg-transparent text-[13px] text-[#ededeb] outline-none placeholder:text-[#6f6f6f]"
                />
              </label>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
            {activeSection === "assignees" ? (
              <div className="space-y-1">
                <CheckboxRow
                  checked={draftFilters.unassigned}
                  icon={<UserRoundX className="h-4 w-4" />}
                  label="Unassigned"
                  onToggle={toggleUnassigned}
                />
                {filteredMembers.map((member) => (
                  <CheckboxRow
                    key={member.id}
                    checked={draftFilters.assigneeIds.includes(member.userId)}
                    icon={getAvatarFallback(member.user.name)}
                    label={member.user.name}
                    meta={member.user.email}
                    onToggle={() => toggleSelection("assigneeIds", member.userId)}
                  />
                ))}
              </div>
            ) : null}

            {activeSection === "labels" ? (
              <div className="space-y-1">
                {filteredLabels.map((label) => (
                  <CheckboxRow
                    key={label.id}
                    checked={draftFilters.labelIds.includes(label.id)}
                    icon={<Tag className="h-4 w-4" />}
                    label={label.name}
                    onToggle={() => toggleSelection("labelIds", label.id)}
                  />
                ))}
              </div>
            ) : null}

            {activeSection === "creators" ? (
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <CheckboxRow
                    key={member.id}
                    checked={draftFilters.creatorIds.includes(member.userId)}
                    icon={getAvatarFallback(member.user.name)}
                    label={member.user.name}
                    meta={member.user.email}
                    onToggle={() => toggleSelection("creatorIds", member.userId)}
                  />
                ))}
              </div>
            ) : null}

            {activeSection === "lists" ? (
              <div className="space-y-1">
                {filteredLists.map((list) => (
                  <CheckboxRow
                    key={list.id}
                    checked={draftFilters.listIds.includes(list.id)}
                    icon={<Columns3 className="h-4 w-4" />}
                    label={list.title}
                    onToggle={() => toggleSelection("listIds", list.id)}
                  />
                ))}
              </div>
            ) : null}

            {activeSection === "due_date" ? (
              <div className="space-y-4 px-1 py-2">
                <div className="space-y-1">
                  <RadioRow
                    checked={draftFilters.dueState === "overdue"}
                    label="Overdue"
                    onToggle={() => setDueState("overdue")}
                  />
                  <RadioRow
                    checked={draftFilters.dueState === "today"}
                    label="Due today"
                    onToggle={() => setDueState("today")}
                  />
                  <RadioRow
                    checked={draftFilters.dueState === "this_week"}
                    label="Due this week"
                    onToggle={() => setDueState("this_week")}
                  />
                  <RadioRow
                    checked={Boolean(draftFilters.dueFrom || draftFilters.dueTo)}
                    label="Custom range"
                    onToggle={() => setDueState(null)}
                  />
                </div>

                <div className="border-t border-white/8 pt-4">
                  <div className="grid gap-3">
                    <label className="grid grid-cols-[44px_1fr] items-center gap-3">
                      <span className="text-[13px] text-[#d9d9d3]">From</span>
                      <span className="flex h-10 items-center rounded-[10px] border border-white/10 bg-black/10 px-3">
                        <input
                          type="date"
                          value={draftFilters.dueFrom}
                          onChange={(event) =>
                            setDateField("dueFrom", event.target.value)
                          }
                          className="w-full bg-transparent text-[13px] text-[#efefeb] outline-none"
                        />
                        <CalendarDays className="h-4 w-4 text-[#8d8d88]" />
                      </span>
                    </label>
                    <label className="grid grid-cols-[44px_1fr] items-center gap-3">
                      <span className="text-[13px] text-[#d9d9d3]">To</span>
                      <span className="flex h-10 items-center rounded-[10px] border border-white/10 bg-black/10 px-3">
                        <input
                          type="date"
                          value={draftFilters.dueTo}
                          onChange={(event) =>
                            setDateField("dueTo", event.target.value)
                          }
                          className="w-full bg-transparent text-[13px] text-[#efefeb] outline-none"
                        />
                        <CalendarDays className="h-4 w-4 text-[#8d8d88]" />
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleWithoutDueDate}
                  className={
                    draftFilters.withoutDueDate
                      ? "flex w-full items-center gap-2 rounded-[10px] border border-white/14 bg-white/8 px-3 py-2.5 text-[13px] text-white transition"
                      : "flex w-full items-center gap-2 rounded-[10px] border border-white/8 bg-transparent px-3 py-2.5 text-[13px] text-[#d0d0ca] transition hover:bg-white/[0.03]"
                  }
                >
                  <CalendarOff className="h-4 w-4" />
                  No due date
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-white/8 px-4 py-4">
            <button
              type="button"
              onClick={() => clearSection(activeSection)}
              className="text-[13px] font-medium text-[#ededea] transition hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#ecece8]"
            >
              Done
            </button>
          </div>
        </>
      )}
    </DashboardPopoverPanel>
  );
}
