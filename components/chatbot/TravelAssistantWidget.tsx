"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send, Bot, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  link?: { href: string; label: string };
}

const FAQ_OPTIONS = [
  {
    q: "How does the booking flow work?",
    a: "Booking is straightforward: 1) Select your tour, 2) Choose a valid departure date and traveler count, 3) Review your guaranteed pricing summary, and 4) Confirm your reservation reference.",
    link: { href: "/tours", label: "Browse Available Tours" },
  },
  {
    q: "What is your cancellation policy?",
    a: "Most tours offer free cancellation up to 14 to 30 days prior to departure for a 100% full refund. Each tour page lists its specific cancellation policy.",
    link: { href: "/tours", label: "Check Tour Terms" },
  },
  {
    q: "How do I filter by budget or difficulty?",
    a: "On the /tours page, use our filter sidebar to adjust min/max budget, select difficulty (Easy, Medium, Difficult), and filter by duration.",
    link: { href: "/tours", label: "Open Tour Filters" },
  },
  {
    q: "I forgot my password or have login trouble",
    a: "You can sign in with your registered email and password. In demo mode, you can also use our instant demo sign-in buttons on the /login page.",
    link: { href: "/login", label: "Go to Login Page" },
  },
  {
    q: "How can I contact the concierge?",
    a: "Our concierge team is available 24/7 at concierge@touroholic.com or by calling +1 (800) 555-TOUR.",
    link: { href: "/#footer", label: "View Contact Details" },
  },
];

export default function TravelAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "bot",
      text: "Hello! I am Touroholic's Expedition Concierge. How can I assist you with your travels today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSelectFaq = (faq: typeof FAQ_OPTIONS[0]) => {
    const userMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: faq.q };
    const botMsg: Message = {
      id: `b-${Date.now() + 1}`,
      sender: "bot",
      text: faq.a,
      link: faq.link,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim().toLowerCase();
    const userMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: input };

    let botResponse =
      "I am an automated rule-based concierge. For specific booking questions, explore our guided tour directory or click below to contact our concierge.";
    let link: { href: string; label: string } | undefined = { href: "/tours", label: "Explore Tours" };

    if (query.includes("cancel") || query.includes("refund")) {
      botResponse = "Most expeditions offer free cancellation up to 14 days before departure for a full refund.";
      link = { href: "/tours", label: "View Cancellation Terms" };
    } else if (query.includes("price") || query.includes("cost") || query.includes("budget")) {
      botResponse = "Tours start from $890 and go up to $3,450 for luxury Serengeti safaris. You can filter by price on our Explore page.";
      link = { href: "/tours", label: "Filter by Price" };
    } else if (query.includes("book") || query.includes("reserve")) {
      botResponse = "To book, open any tour page, select your preferred departure date, choose traveler count, and confirm your reservation.";
      link = { href: "/tours", label: "Browse Tours" };
    }

    const botMsg: Message = {
      id: `b-${Date.now() + 1}`,
      sender: "bot",
      text: botResponse,
      link,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white px-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 font-medium text-sm group"
          aria-label="Open expedition concierge"
        >
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span>Need Travel Help?</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-[#e8e3d8] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#124e3f] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Touroholic Concierge</h3>
                <p className="text-[11px] text-emerald-200">Instant Travel & Booking Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick FAQ Pills */}
          <div className="bg-[#fbfaf8] border-b border-[#e8e3d8] p-2.5 overflow-x-auto flex gap-1.5 scrollbar-none">
            {FAQ_OPTIONS.map((f, i) => (
              <button
                key={i}
                onClick={() => handleSelectFaq(f)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-[#124e3f] hover:text-white text-stone-700 border border-[#e2dcce] transition-colors shrink-0"
              >
                {f.q}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fbfaf8]/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#124e3f] text-white rounded-br-xs"
                      : "bg-white text-stone-800 border border-[#e8e3d8] shadow-sm rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.link && (
                    <Link
                      href={m.link.href}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-[#124e3f] hover:underline"
                    >
                      <span>{m.link.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#e8e3d8] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tours, booking, or cancellation..."
              className="flex-1 px-3 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
            />
            <button
              type="submit"
              className="p-2 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl transition-colors shrink-0"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
