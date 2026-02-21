import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2 } from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationList({ currentUserEmail, onSelect, selectedConversationId }) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["all_messages", currentUserEmail],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ sender_email: currentUserEmail }, "-created_date", 500),
        base44.entities.Message.filter({ recipient_email: currentUserEmail }, "-created_date", 500),
      ]);
      return [...sent, ...received];
    },
    refetchInterval: 10000,
  });

  // Build conversation summaries keyed by conversation_id
  const conversations = React.useMemo(() => {
    const map = {};
    for (const m of messages) {
      const cid = m.conversation_id;
      if (!map[cid]) {
        map[cid] = {
          conversation_id: cid,
          otherName: m.sender_email === currentUserEmail ? m.recipient_name : m.sender_name,
          otherEmail: m.sender_email === currentUserEmail ? m.recipient_email : m.sender_email,
          project_address: m.project_address,
          lastMessage: m,
          unread: 0,
        };
      }
      if (!m.read && m.recipient_email === currentUserEmail) {
        map[cid].unread++;
      }
      if (new Date(m.created_date) > new Date(map[cid].lastMessage.created_date)) {
        map[cid].lastMessage = m;
      }
    }
    return Object.values(map).sort(
      (a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [messages, currentUserEmail]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {conversations.map((conv) => (
        <button
          key={conv.conversation_id}
          onClick={() => onSelect(conv)}
          className={cn(
            "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
            selectedConversationId === conv.conversation_id && "bg-amber-50 border-l-2 border-amber-500"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {conv.otherName || conv.otherEmail}
              </p>
              {conv.project_address && (
                <p className="text-xs text-slate-400 truncate mb-0.5">{conv.project_address}</p>
              )}
              <p className="text-xs text-slate-500 truncate">{conv.lastMessage.content}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="text-[10px] text-slate-400">
                {isToday(new Date(conv.lastMessage.created_date))
                  ? format(new Date(conv.lastMessage.created_date), "h:mm a")
                  : format(new Date(conv.lastMessage.created_date), "MMM d")}
              </p>
              {conv.unread > 0 && (
                <Badge className="bg-amber-600 text-white text-[10px] h-4 min-w-4 flex items-center justify-center px-1">
                  {conv.unread}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}