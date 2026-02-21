import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function UnreadBadge({ email }) {
  const { data: count = 0 } = useQuery({
    queryKey: ["unread_count", email],
    queryFn: async () => {
      if (!email) return 0;
      const msgs = await base44.entities.Message.filter({ recipient_email: email, read: false }, "-created_date", 100);
      return msgs.length;
    },
    refetchInterval: 15000,
    enabled: !!email,
  });

  if (!count) return null;

  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold ml-1">
      {count > 9 ? "9+" : count}
    </span>
  );
}