"use client";

import { useState } from "react";

type FlaggedStory = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  children: { name: string } | null;
};

export default function AdminFlaggedList({ items }: { items: FlaggedStory[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleReview(id: string, action: "approve" | "reject") {
    setBusyId(id);
    await fetch(`/api/admin/flagged/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    window.location.reload();
  }

  if (items.length === 0) {
    return <p className="text-slate-400">Nothing pending.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border border-slate-800 rounded-xl p-4">
          <p className="font-serif italic mb-1">{item.title}</p>
          <p className="text-slate-400 text-xs mb-2">
            For {item.children?.name || "unknown child"} · {new Date(item.created_at).toLocaleString()}
          </p>
          <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">{item.content}</p>
          <div className="flex gap-3">
            <button
              disabled={busyId === item.id}
              onClick={() => handleReview(item.id, "approve")}
              className="bg-emerald-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-sm"
            >
              Approve &amp; send
            </button>
            <button
              disabled={busyId === item.id}
              onClick={() => handleReview(item.id, "reject")}
              className="bg-rose-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-sm"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
