"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Check,
  Columns3,
  Tag,
  UserCheck,
  UserRound,
  UserRoundX,
} from "lucide-react";

import {
  EMPTY_BOARD_CARD_FILTERS,
  hasAppliedBoardCardFilters,
  normalizeBoardCardFilters,
  type BoardCardDueState,
  type BoardCardFilters,
} from "@/lib/board-card-filters";

import type { BoardLabel, BoardList, BoardMember } from "./board-types";
import { DashboardPopoverPanel } from "./dashboard-popover-panel";
import { getAvatarFallback } from "./workspace-utils";

type FilterSection = "assignees" | "labels" | "creators" | "lists" | null;

type BoardFilterPopoverProps = {
  appliedFilters: BoardCardFilters;
  boardLabels: BoardLabel[];
  boardLists: BoardList[];
  boardMembers: BoardMember[];
  onApply: (filters: BoardCardFilters) => void;
};

function FilterSectionButton({
  active,
  icon: Icon,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  icon: typeof UserCheck;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex w-full items-center justify-between rounded-[10px] border border-white/14 bg-white/8 px-3 py-2.5 text-left transition"
          : "flex w-full items-center justify-between rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
      }
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[#d8d8d3]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-medium text-[#f1f1ed]">
            {label}
          </span>
          <span className="block truncate text-[10px] text-[#85857f]">
            {meta}
          </span>
        </span>
      </span>
      <Check
        className={
          active
            ? "h-4 w-4 text-white"
            : "h-4 w-4 text-transparent"
        }
      />
    </button>
  );
}

function SelectionRow({
  checked,
  initials,
  label,
  meta,
  onToggle,
}: {
  checked: boolean;
  initials?: string;
  label: string;
  meta?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        checked
          ? "flex w-full items-center gap-3 rounded-[10px] border border-white/14 bg-white/8 px-3 py-2.5 text-left transition"
          : "flex w-full items-center gap-3 rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
      }
    >
      {initials ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d66c12] text-[11px] font-semibold text-white">
          {initials}
        </span>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[#d8d8d3]">
          <Check className={checked ? "h-4 w-4" : "h-4 w-4 opacity-0"} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-[#efefeb]">
          {label}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[10px] text-[#85857f]">
            {meta}
          </span>
        ) : null}
      </span>

      <span
        className={
          checked
            ? "h-4 w-4 rounded-full border border-[#2f6d4d] bg-[#143624]"
            : "h-4 w-4 rounded-full border border-white/10 bg-transparent"
        }
      />
    </button>
  );
}

function dueStateLabel(value: BoardCardDueState | null) {
  switch (value) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due today";
    case "this_week":
      return "Due this week";
    default:
      return "Any due date";
  }
}

export function BoardFilterPopover({
  appliedFilters,
  boardLabels,
  boardLists,
  boardMembers,
  onApply,
}: BoardFilterPopoverProps) {
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [openSection, setOpenSection] = useState<FilterSection>(null);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

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

  function setDueState(value: BoardCardDueState) {
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

  function toggleUnassigned() {
    setDraftFilters((current) =>
      normalizeBoardCardFilters({
        ...current,
        assigneeIds: current.unassigned ? current.assigneeIds : [],
        unassigned: !current.unassigned,
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

  function handleClear() {
    setDraftFilters(EMPTY_BOARD_CARD_FILTERS);
    setOpenSection(null);
  }

  return (
    <DashboardPopoverPanel className="h-[min(430px,calc(100vh-86px))]">
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-sm font-semibold text-[#f4f4f1]">Filters</p>
        <p className="mt-0.5 text-[11px] text-[#8f8f89]">
          Apply board filters only when you are ready.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="grid gap-2">
          <FilterSectionButton
            active={openSection === "assignees"}
            icon={UserCheck}
            label="Assignees"
            meta={
              draftFilters.unassigned
                ? "Unassigned only"
                : draftFilters.assigneeIds.length > 0
                  ? `${draftFilters.assigneeIds.length} selected`
                  : "Any assignee"
            }
            onClick={() =>
              setOpenSection((current) =>
                current === "assignees" ? null : "assignees",
              )
            }
          />
          <FilterSectionButton
            active={openSection === "labels"}
            icon={Tag}
            label="Labels"
            meta={
              draftFilters.labelIds.length > 0
                ? `${draftFilters.labelIds.length} selected`
                : "Any label"
            }
            onClick={() =>
              setOpenSection((current) =>
                current === "labels" ? null : "labels",
              )
            }
          />
          <FilterSectionButton
            active={openSection === "creators"}
            icon={UserRound}
            label="Creators"
            meta={
              draftFilters.creatorIds.length > 0
                ? `${draftFilters.creatorIds.length} selected`
                : "Any creator"
            }
            onClick={() =>
              setOpenSection((current) =>
                current === "creators" ? null : "creators",
              )
            }
          />
          <FilterSectionButton
            active={openSection === "lists"}
            icon={Columns3}
            label="Lists"
            meta={
              draftFilters.listIds.length > 0
                ? `${draftFilters.listIds.length} selected`
                : "All lists"
            }
            onClick={() =>
              setOpenSection((current) =>
                current === "lists" ? null : "lists",
              )
            }
          />
        </div>

        {openSection === "assignees" ? (
          <div className="space-y-2 rounded-[12px] border border-white/8 bg-black/10 p-2">
            <SelectionRow
              checked={draftFilters.unassigned}
              label="Unassigned only"
              meta="Show cards without any assignee"
              onToggle={toggleUnassigned}
            />
            {sortedMembers.map((member) => (
              <SelectionRow
                key={member.id}
                checked={draftFilters.assigneeIds.includes(member.userId)}
                initials={getAvatarFallback(member.user.name)}
                label={member.user.name}
                meta={member.user.email}
                onToggle={() => toggleSelection("assigneeIds", member.userId)}
              />
            ))}
          </div>
        ) : null}

        {openSection === "labels" ? (
          <div className="space-y-2 rounded-[12px] border border-white/8 bg-black/10 p-2">
            {sortedLabels.map((label) => (
              <SelectionRow
                key={label.id}
                checked={draftFilters.labelIds.includes(label.id)}
                label={label.name}
                meta={label.color}
                onToggle={() => toggleSelection("labelIds", label.id)}
              />
            ))}
          </div>
        ) : null}

        {openSection === "creators" ? (
          <div className="space-y-2 rounded-[12px] border border-white/8 bg-black/10 p-2">
            {sortedMembers.map((member) => (
              <SelectionRow
                key={member.id}
                checked={draftFilters.creatorIds.includes(member.userId)}
                initials={getAvatarFallback(member.user.name)}
                label={member.user.name}
                meta={member.user.email}
                onToggle={() => toggleSelection("creatorIds", member.userId)}
              />
            ))}
          </div>
        ) : null}

        {openSection === "lists" ? (
          <div className="space-y-2 rounded-[12px] border border-white/8 bg-black/10 p-2">
            {sortedLists.map((list) => (
              <SelectionRow
                key={list.id}
                checked={draftFilters.listIds.includes(list.id)}
                label={list.title}
                onToggle={() => toggleSelection("listIds", list.id)}
              />
            ))}
          </div>
        ) : null}

        <div className="rounded-[12px] border border-white/8 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#d4d4cf]" />
            <p className="text-[12px] font-medium text-[#f1f1ed]">Due date</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["overdue", "today", "this_week"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDueState(value)}
                className={
                  draftFilters.dueState === value
                    ? "rounded-[10px] border border-white/14 bg-white/8 px-2 py-2 text-[11px] text-white transition"
                    : "rounded-[10px] border border-white/7 bg-white/[0.025] px-2 py-2 text-[11px] text-[#bdbdb7] transition hover:bg-white/[0.05]"
                }
              >
                {dueStateLabel(value)}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="rounded-[10px] border border-white/8 bg-black/10 px-3 py-2">
              <span className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[#7f7f7a]">
                <CalendarDays className="h-3.5 w-3.5" />
                From
              </span>
              <input
                type="date"
                value={draftFilters.dueFrom}
                onChange={(event) => setDateField("dueFrom", event.target.value)}
                className="w-full bg-transparent text-[12px] text-[#efefeb] outline-none"
              />
            </label>
            <label className="rounded-[10px] border border-white/8 bg-black/10 px-3 py-2">
              <span className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[#7f7f7a]">
                <CalendarDays className="h-3.5 w-3.5" />
                To
              </span>
              <input
                type="date"
                value={draftFilters.dueTo}
                onChange={(event) => setDateField("dueTo", event.target.value)}
                className="w-full bg-transparent text-[12px] text-[#efefeb] outline-none"
              />
            </label>
          </div>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={toggleWithoutDueDate}
              className={
                draftFilters.withoutDueDate
                  ? "flex items-center gap-2 rounded-[10px] border border-white/14 bg-white/8 px-3 py-2 text-[12px] text-white transition"
                  : "flex items-center gap-2 rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2 text-[12px] text-[#bdbdb7] transition hover:bg-white/[0.05]"
              }
            >
              <CalendarOff className="h-4 w-4" />
              No due date
            </button>
            <button
              type="button"
              onClick={toggleUnassigned}
              className={
                draftFilters.unassigned
                  ? "flex items-center gap-2 rounded-[10px] border border-white/14 bg-white/8 px-3 py-2 text-[12px] text-white transition"
                  : "flex items-center gap-2 rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2 text-[12px] text-[#bdbdb7] transition hover:bg-white/[0.05]"
              }
            >
              <UserRoundX className="h-4 w-4" />
              No assignee
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/8 p-3">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-[10px] px-2 py-2 text-[12px] font-medium text-[#9a9a95] transition hover:text-white"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(normalizeBoardCardFilters(draftFilters))}
          className="ui-pressed-button rounded-[10px] border px-3 py-2 text-[12px] font-medium transition"
        >
          {hasAppliedBoardCardFilters(draftFilters) ? "Apply filters" : "Apply"}
        </button>
      </div>
    </DashboardPopoverPanel>
  );
}
