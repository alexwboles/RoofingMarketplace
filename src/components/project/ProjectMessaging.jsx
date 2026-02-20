import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectMessaging({ messages = [], senderName, senderRole, onSend }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ sender: senderName, sender_role: senderRole, text: text.trim(), timestamp: new Date().toISOString() });
    setText("");
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <CardTitle className="text-lg font-semibold">Project Chat</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-72 overflow-y-auto mb-3 pr-1">
          {messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 italic">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_role === senderRole;
            return (
              <div key={i} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5", isMe ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800")}>
                  {!isMe && <p className="text-[10px] font-semibold mb-0.5 text-slate-500">{msg.sender}</p>}
                  <p className="text-sm">{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-slate-400" : "text-slate-400")}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="h-9 text-sm"
          />
          <Button onClick={handleSend} size="icon" className="h-9 w-9 bg-slate-800 hover:bg-slate-700 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}