"use client";

import { useEffect, useRef, useState } from "react";

import { CalendarDays, MessageSquareText, MoreVertical, Plus } from "lucide-react";

import {
  type KanbanBoard,
  kanbanBoards,
} from "./dashboard-types";

type DashboardKanbanProps = {
  activeBoardId: string;
};

function getBoard(activeBoardId: string): KanbanBoard {
  return (
    kanbanBoards.find((board) => board.boardId === activeBoardId) ?? kanbanBoards[0]
  );
}

export function DashboardKanban({ activeBoardId }: DashboardKanbanProps) {
  const board = getBoard(activeBoardId);
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenColumnMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div className="scrollbar-hidden h-full min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden px-4 pb-0 pt-3">
      <div className="flex h-full min-h-0 min-w-max items-start gap-4 pr-4">
        {board.columns.map((column) => (
          <div
            key={column.id}
            className="relative h-full min-h-0 w-[296px] shrink-0 self-start"
            ref={openColumnMenuId === column.id ? menuRef : null}
          >
            <section
              className="flex max-h-full min-h-[220px] flex-col self-start rounded-[20px] border border-white/6 bg-[#111112] shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            >
              <header className="sticky top-0 z-[1] flex shrink-0 items-center justify-between rounded-t-[20px] bg-[#111112] px-4 py-3">
                <h3 className="text-[13px] font-medium text-[#ececea]">
                  {column.title}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setOpenColumnMenuId((currentValue) =>
                      currentValue === column.id ? null : column.id,
                    )
                  }
                  aria-label={`More options for ${column.title}`}
                  className="rounded-md p-1.5 text-[#727272] transition hover:bg-white/5 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </header>

              {openColumnMenuId === column.id ? (
                <div className="absolute right-3 top-13 z-10 min-w-[144px] rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
                  <button
                    type="button"
                    onClick={() => setOpenColumnMenuId(null)}
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                  >
                    <Plus className="h-4 w-4 text-[#7d7d7d]" />
                    <span>Add card</span>
                  </button>
                </div>
              ) : null}

              <div className="scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-1">
                <div className="flex min-h-full flex-col">
                  <div className="space-y-3">
                    {column.cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className="group w-full cursor-grab rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,#1a1a1b_0%,#141415_100%)] p-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.03)] ring-1 ring-white/[0.02] transition hover:-translate-y-0.5 hover:border-white/12 hover:bg-[linear-gradient(180deg,#1d1d1f_0%,#151516_100%)] hover:shadow-[0_18px_38px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)] active:cursor-grabbing"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {card.labels.map((label) => (
                            <span
                              key={label.id}
                              className="inline-flex rounded-full border px-1.75 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em]"
                              style={{
                                borderColor: `${label.color}55`,
                                backgroundColor: `${label.color}1a`,
                                color: label.color,
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>

                        <h4 className="mt-3 text-[14px] font-medium leading-5 text-[#f2f2f0] transition group-hover:text-white">
                          {card.title}
                        </h4>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex -space-x-1.5">
                            {card.assignees.map((assignee) => (
                              <span
                                key={assignee.id}
                                title={assignee.name}
                                className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-[#121213] text-[8px] font-semibold text-white"
                                style={{ backgroundColor: assignee.avatarColor }}
                              >
                                {assignee.initials}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-[#8a8a87]">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-black/20 px-1.75 py-0.5">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {card.dueDate}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquareText className="h-2.5 w-2.5" />
                              {card.commentCount}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div aria-hidden="true" className="min-h-16 flex-1" />

                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-[#747470] transition hover:text-[#d7d7d3]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add card</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}
