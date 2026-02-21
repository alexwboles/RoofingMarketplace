import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function formatMessageDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

export default function MessageThread({ conversationId, currentUserEmail, currentUserName, currentUserRole, recipientName, projectAddress }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, "created_date", 200),
    refetchInterval: 5000,
  });

  // Mark incoming messages as read
  useEffect(() => {
    messages.forEach((m) => {
      if (!m.read && m.recipient_email === currentUserEmail) {
        base44.entities.Message.update(m.id, { read: true });
      }
    });
  }, [messages, currentUserEmail]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        sender_name: currentUserName,
        sender_role: currentUserRole,
        recipient_email: messages.find((m) => m.sender_email !== currentUserEmail)?.sender_email || "",
        recipient_name: recipientName,
        content,
        read: false,
        project_address: projectAddress,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["unread_count"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date label
  const grouped = [];
  let lastLabel = null;
  for (const m of messages) {
    const d = new Date(m.created_date);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
    if (label !== lastLabel) {
      grouped.push({ type: "divider", label });
      lastLabel = label;
    }
    grouped.push({ type: "message", data: m });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12">
            No messages yet. Start the conversation!
          </p>
        )}
        {grouped.map((item, i) =>
          item.type === "divider" ? (
            <div key={`divider-${i}`} className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">{item.label}</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
          ) : (
            <MessageBubble
              key={item.data.id}
              message={item.data}
              isMine={item.data.sender_email === currentUserEmail}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-100 p-3 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            className="resize-none text-sm min-h-[40px] max-h-32"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            size="icon"
            className="bg-amber-600 hover:bg-amber-700 shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${isMine ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-800"}`}>
        {!isMine && (
          <p className="text-[10px] font-semibold mb-0.5 text-slate-500 capitalize">
            {message.sender_name || message.sender_role}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-amber-200" : "text-slate-400"} text-right`}>
          {formatMessageDate(message.created_date)}
          {isMine && message.read && <span className="ml-1">✓✓</span>}
        </p>
      </div>
    </div>
  );
}