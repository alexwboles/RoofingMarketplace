import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Image, X, Loader2, Download, Phone, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const QUICK_REPLIES = [
  "When can you start?",
  "Can you send an estimate?",
  "What materials will you use?",
  "Are you licensed and insured?",
];

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, isMe }) {
  return (
    <div className={cn("flex gap-2.5 group", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
          {(msg.sender || "?")[0].toUpperCase()}
        </div>
      )}
      <div className={cn("max-w-[78%] space-y-1")}>
        {!isMe && (
          <p className="text-[10px] font-semibold text-slate-500 ml-1">{msg.sender}
            <span className="font-normal text-slate-400 ml-1.5 capitalize">{msg.sender_role && `· ${msg.sender_role}`}</span>
          </p>
        )}
        {msg.text && (
          <div className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isMe
              ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-br-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
          )}>
            {msg.text}
          </div>
        )}
        {msg.images?.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", isMe ? "justify-end" : "justify-start")}>
            {msg.images.map((url, idx) => (
              <div key={idx} className="relative group/img">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-44 h-36 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  onClick={() => window.open(url, "_blank")}
                />
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3 text-white" />
                </a>
              </div>
            ))}
          </div>
        )}
        <p className={cn("text-[10px] px-1", isMe ? "text-right text-slate-400" : "text-slate-400")}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
      {isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
          {(msg.sender || "Me")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function ProjectMessaging({ messages = [], senderName, senderRole, onSend, project }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = await Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f })));
    setPendingImages((prev) => [...prev, ...uploaded.map((r) => r.file_url)]);
    setUploading(false);
    e.target.value = "";
  };

  const handleSend = () => {
    if (!text.trim() && pendingImages.length === 0) return;
    onSend({
      sender: senderName,
      sender_role: senderRole,
      text: text.trim(),
      images: pendingImages,
      timestamp: new Date().toISOString(),
    });
    setText("");
    setPendingImages([]);
    inputRef.current?.focus();
  };

  const handleQuickReply = (reply) => {
    setText(reply);
    inputRef.current?.focus();
  };

  const otherParty = senderRole === "homeowner" ? project?.roofer_company : project?.homeowner_name;
  const otherPhone = senderRole === "homeowner" ? project?.roofer_phone : project?.homeowner_phone;
  const otherEmail = senderRole === "homeowner" ? null : project?.homeowner_email;

  return (
    <Card className="border-slate-200 flex flex-col" style={{ maxHeight: 680 }}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">
                {otherParty ? `Chat with ${otherParty}` : "Project Chat"}
              </CardTitle>
              <p className="text-[10px] text-slate-400">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {/* Contact shortcuts */}
          <div className="flex items-center gap-1.5">
            {otherPhone && (
              <a href={`tel:${otherPhone}`}>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            {otherEmail && (
              <a href={`mailto:${otherEmail}`}>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Mail className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Message thread */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 bg-slate-50/50" style={{ minHeight: 280 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_role === senderRole;
              const prevMsg = messages[i - 1];
              const showDateDivider = i === 0 || (prevMsg && new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString());
              return (
                <React.Fragment key={i}>
                  {showDateDivider && msg.timestamp && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.timestamp).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}
                  <MessageBubble msg={msg} isMe={isMe} />
                </React.Fragment>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {messages.length === 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-slate-100 bg-white">
            {QUICK_REPLIES.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(qr)}
                className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-2.5 py-1 transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-2 bg-white border-t border-slate-100">
            {pendingImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="pending" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                <button
                  onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center w-4 h-4"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-center px-4 py-3 border-t border-slate-100 bg-white">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Attach photo"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </Button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            className="flex-1 h-9 px-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-9 w-9 bg-slate-800 hover:bg-slate-700 shrink-0"
            disabled={uploading || (!text.trim() && pendingImages.length === 0)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}