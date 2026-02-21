import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ConversationList from "@/components/messaging/ConversationList";
import MessageThread from "@/components/messaging/MessageThread";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Inbox() {
  const [user, setUser] = useState(null);
  const [roofer, setRoofer] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      if (u) {
        const roofers = await base44.entities.Roofer.filter({ email: u.email });
        setRoofer(roofers[0] || null);
      }
    }
    load();
  }, []);

  const currentUserEmail = user?.email || "";
  const currentUserName = roofer
    ? roofer.contact_name || roofer.company_name
    : user?.full_name || user?.email || "Homeowner";
  const currentUserRole = roofer ? "roofer" : "homeowner";

  const handleSelect = (conv) => {
    setSelectedConv(conv);
    setShowList(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Please log in to access your inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto h-[calc(100vh-56px)] flex border-x border-slate-100 bg-white shadow-sm">
        {/* Sidebar - conversation list */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${!showList ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-600" />
              Messages
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentUserEmail}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              currentUserEmail={currentUserEmail}
              onSelect={handleSelect}
              selectedConversationId={selectedConv?.conversation_id}
            />
          </div>
        </div>

        {/* Main thread area */}
        <div className={`flex-1 flex flex-col ${showList && "hidden md:flex"}`}>
          {selectedConv ? (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setShowList(true)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedConv.otherName || selectedConv.otherEmail}
                  </p>
                  {selectedConv.project_address && (
                    <p className="text-xs text-slate-400">{selectedConv.project_address}</p>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <MessageThread
                  conversationId={selectedConv.conversation_id}
                  currentUserEmail={currentUserEmail}
                  currentUserName={currentUserName}
                  currentUserRole={currentUserRole}
                  recipientName={selectedConv.otherName}
                  projectAddress={selectedConv.project_address}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}