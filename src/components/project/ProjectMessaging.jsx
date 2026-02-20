import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Image, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ProjectMessaging({ messages = [], senderName, senderRole, onSend }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((f) => base44.integrations.Core.UploadFile({ file: f }))
      );
      setPendingImages((prev) => [...prev, ...uploaded.map((r) => r.file_url)]);
    } catch (err) {
      toast.error("Failed to upload image");
    }
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
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <CardTitle className="text-lg font-semibold">Project Chat</CardTitle>
          <span className="ml-auto text-xs text-slate-400">{messages.length} messages</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Message thread */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto mb-3 pr-1">
          {messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8 italic">
              No messages yet. Start the conversation!
            </p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_role === senderRole;
            return (
              <div key={i} className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                    {(msg.sender || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className={cn("max-w-[78%] space-y-1.5")}>
                  {!isMe && (
                    <p className="text-[10px] font-semibold text-slate-500 ml-1">{msg.sender}</p>
                  )}
                  {msg.text && (
                    <div className={cn("rounded-2xl px-3.5 py-2.5 text-sm", isMe ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800")}>
                      {msg.text}
                    </div>
                  )}
                  {msg.images?.length > 0 && (
                    <div className={cn("flex flex-wrap gap-1.5", isMe ? "justify-end" : "justify-start")}>
                      {msg.images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-40 h-32 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, "_blank")}
                          />
                          <a
                            href={url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-1.5 right-1.5 bg-black/50 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3 text-white" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className={cn("text-[10px] px-1", isMe ? "text-right text-slate-500" : "text-slate-400")}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
            {pendingImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="pending" className="w-16 h-16 object-cover rounded-lg" />
                <button
                  onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="h-9 text-sm flex-1"
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