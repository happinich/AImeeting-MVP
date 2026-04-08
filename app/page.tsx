"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Square,
  Clock,
  FileText,
  Settings,
  ChevronRight,
  Plus,
  Hash,
  Bold,
  Italic,
  List,
  CheckSquare,
  Type,
  Trash2,
  Bookmark,
  MoreHorizontal,
  Loader2,
  Sparkles,
  Download,
  Save,
  FilePlus,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface MemoItem {
  id: string;
  content: string;
  timestamp: number; // ms since session start
  createdAt: Date;
  type: "text" | "checklist" | "heading" | "divider";
  checked?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Pulsing REC badge */
function RecBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--accent-red-subtle)",
        border: "1px solid var(--accent-red)",
        color: "var(--accent-red)",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        animation: "pulse 1.8s ease-in-out infinite",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent-red)",
          display: "inline-block",
        }}
      />
      REC
    </span>
  );
}

/** Real-time voice wave visualizer */
function AudioVisualizer({ isRecording }: { isRecording: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28, padding: "0 12px", opacity: isRecording ? 1 : 0.4, transition: "opacity 0.3s" }}>
      {[0.1, 0.4, 0.2, 0.5, 0.3, 0.15].map((delay, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: "100%",
            backgroundColor: isRecording ? "var(--accent-red)" : "var(--border-strong)",
            borderRadius: 2,
            animationName: isRecording ? "equalizer" : "none",
            animationDuration: "0.8s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${delay}s`,
            transformOrigin: "center",
            transform: isRecording ? "scaleY(0.3)" : "scaleY(0.15)",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

/** Recording panel */
function RecordingPanel({
  isRecording,
  elapsed,
  onToggle,
}: {
  isRecording: boolean;
  elapsed: number;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isRecording ? "rgba(239,68,68,0.35)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
    >
      {/* Glow when recording */}
      {isRecording && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.06) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* REC button */}
      <button
        id="btn-rec-toggle"
        onClick={onToggle}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s",
          background: isRecording
            ? "var(--accent-red)"
            : "var(--accent-blue)",
          boxShadow: isRecording
            ? "0 0 0 8px var(--accent-red-subtle), var(--shadow-md)"
            : "0 0 0 0 transparent, var(--shadow-sm)",
        }}
      >
        {isRecording ? (
          <Square size={16} color="#fff" fill="#fff" />
        ) : (
          <Mic size={18} color="#fff" />
        )}
      </button>

      {/* Timer / Status */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          {isRecording ? (
            <RecBadge />
          ) : (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              대기 중
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-inter), monospace",
              fontSize: 28,
              fontWeight: 600,
              color: isRecording ? "var(--text-primary)" : "var(--text-secondary)",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {formatTimer(elapsed)}
          </div>
          <AudioVisualizer isRecording={isRecording} />
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: "flex-end",
          }}
        >
          <Clock size={11} />
          최대 2시간
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
          }}
        >
          {isRecording ? "클릭하여 중지" : "클릭하여 시작"}
        </span>
      </div>
    </div>
  );
}

/** Inline format toolbar for memo input */
function FormatToolbar({
  onFormat,
}: {
  onFormat: (type: "heading" | "checklist" | "divider" | "bold" | "italic" | "list") => void;
}) {
  const tools = [
    { icon: <Hash size={13} />, label: "제목", key: "heading" as const },
    { icon: <CheckSquare size={13} />, label: "체크리스트", key: "checklist" as const },
    { icon: <List size={13} />, label: "리스트", key: "list" as const },
    { icon: <Bold size={13} />, label: "굵게", key: "bold" as const },
    { icon: <Italic size={13} />, label: "기울임", key: "italic" as const },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: "4px 6px",
        background: "var(--bg-hover)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-default)",
      }}
    >
      {tools.map((t) => (
        <button
          key={t.key}
          onClick={() => onFormat(t.key)}
          title={t.label}
          style={{
            padding: "4px 6px",
            borderRadius: 3,
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--bg-accent)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

/** Single memo block (Notion-style) */
function MemoBlock({
  memo,
  sessionStart,
  onDelete,
  onToggleCheck,
}: {
  memo: MemoItem;
  sessionStart: Date | null;
  onDelete: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const renderContent = () => {
    if (memo.type === "divider") {
      return (
        <div
          style={{
            height: 1,
            background: "var(--border-default)",
            margin: "4px 0",
          }}
        />
      );
    }
    if (memo.type === "heading") {
      return (
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.4,
          }}
        >
          {memo.content}
        </h3>
      );
    }
    if (memo.type === "checklist") {
      return (
        <div
          style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
        >
          <div
            onClick={() => onToggleCheck(memo.id)}
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              border: `1.5px solid ${memo.checked ? "var(--accent-blue)" : "var(--border-strong)"}`,
              background: memo.checked
                ? "var(--accent-blue)"
                : "transparent",
              flexShrink: 0,
              marginTop: 3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {memo.checked && (
              <svg
                width="9"
                height="7"
                viewBox="0 0 9 7"
                fill="none"
              >
                <path
                  d="M1 3.5L3.5 6L8 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span
            style={{
              color: memo.checked
                ? "var(--text-tertiary)"
                : "var(--text-primary)",
              textDecoration: memo.checked ? "line-through" : "none",
              flex: 1,
              fontSize: 14,
            }}
          >
            {memo.content}
          </span>
        </div>
      );
    }
    // default text
    return (
      <p
        style={{
          color: "var(--text-primary)",
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {memo.content}
      </p>
    );
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "8px 12px",
        borderRadius: "var(--radius-md)",
        background: hovered ? "var(--bg-hover)" : "transparent",
        transition: "background 0.15s",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Timestamp bubble */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 44,
          textAlign: "right",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--accent-blue)",
            background: "var(--accent-blue-subtle)",
            padding: "1px 5px",
            borderRadius: 3,
            fontFamily: "monospace",
            fontWeight: 500,
          }}
        >
          {memo.timestamp < 0 ? "녹음 전" : formatTimestamp(memo.timestamp)}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>{renderContent()}</div>

      {/* Hover actions */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            gap: 4,
          }}
        >
          <button
            onClick={() => onDelete(memo.id)}
            title="삭제"
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: "none",
              background: "var(--bg-accent)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--accent-red)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent-red-subtle)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-tertiary)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-accent)";
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

/** The main memo section component */
function MemoPanel({
  memos,
  sessionStart,
  elapsed,
  onAddMemo,
  onDeleteMemo,
  onToggleCheck,
}: {
  memos: MemoItem[];
  sessionStart: Date | null;
  elapsed: number;
  onAddMemo: (memo: MemoItem) => void;
  onDeleteMemo: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"text" | "checklist" | "heading">("text");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // Scroll to bottom on new memo
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [memos.length]);

  const saveMemo = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // detect slash commands
    let type: MemoItem["type"] = inputType;
    let content = trimmed;

    if (trimmed.startsWith("# ")) {
      type = "heading";
      content = trimmed.slice(2);
    } else if (trimmed.startsWith("[] ") || trimmed.startsWith("- [ ] ")) {
      type = "checklist";
      content = trimmed.startsWith("[] ")
        ? trimmed.slice(3)
        : trimmed.slice(6);
    } else if (trimmed === "---") {
      type = "divider";
      content = "";
    }

    const memo: MemoItem = {
      id: generateId(),
      content,
      timestamp: sessionStart ? elapsed : -1,
      createdAt: new Date(),
      type,
      checked: false,
    };

    onAddMemo(memo);
    setInput("");
    setInputType("text");
    textareaRef.current?.focus();
  }, [input, elapsed, inputType, onAddMemo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      saveMemo();
    }
  };

  const handleFormat = (
    fmt: "heading" | "checklist" | "divider" | "bold" | "italic" | "list"
  ) => {
    if (fmt === "heading") {
      setInputType("heading");
      setInput((prev) => (prev.startsWith("# ") ? prev : "# " + prev));
    } else if (fmt === "checklist") {
      setInputType("checklist");
      setInput((prev) =>
        prev.startsWith("[] ") ? prev : "[] " + prev
      );
    } else if (fmt === "bold") {
      setInput((prev) => `**${prev}**`);
    } else if (fmt === "italic") {
      setInput((prev) => `_${prev}_`);
    } else if (fmt === "list") {
      setInput((prev) => (prev.startsWith("- ") ? prev : "- " + prev));
    } else if (fmt === "divider") {
      const divider: MemoItem = {
        id: generateId(),
        content: "",
        timestamp: elapsed,
        createdAt: new Date(),
        type: "divider",
      };
      onAddMemo(divider);
    }
    textareaRef.current?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={15} color="var(--text-secondary)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            메모
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              background: "var(--bg-accent)",
              padding: "1px 7px",
              borderRadius: 10,
            }}
          >
            {memos.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
            }}
          >
            <kbd
              style={{
                background: "var(--bg-accent)",
                border: "1px solid var(--border-default)",
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 10,
                fontFamily: "inherit",
                color: "var(--text-secondary)",
              }}
            >
              ⌘↵
            </kbd>{" "}
            저장
          </span>
        </div>
      </div>

      {/* Memo list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 6px",
          minHeight: 0,
        }}
      >
        {memos.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "var(--text-tertiary)",
              padding: 32,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--bg-hover)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} color="var(--text-tertiary)" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                아직 작성된 메모가 없습니다
              </p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                아래 입력창에 회의 내용을 자유롭게 작성하세요
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  marginTop: 8,
                }}
              >
                팁: <code style={{ color: "var(--accent-blue)" }}># </code>
                제목 &nbsp;|&nbsp;
                <code style={{ color: "var(--accent-blue)" }}>[] </code>
                체크리스트 &nbsp;|&nbsp;
                <code style={{ color: "var(--accent-blue)" }}>---</code> 구분선
              </p>
            </div>
          </div>
        ) : (
          <>
            {memos.map((memo, idx) => (
              <MemoBlock
                key={memo.id}
                memo={memo}
                sessionStart={sessionStart}
                onDelete={onDeleteMemo}
                onToggleCheck={onToggleCheck}
              />
            ))}
            <div ref={listEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "12px 14px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FormatToolbar onFormat={handleFormat} />
          <span
            style={{
              fontSize: 10,
              color: "var(--text-placeholder)",
              fontFamily: "monospace",
            }}
          >
            {sessionStart ? formatTimestamp(elapsed) : "-"}
          </span>
        </div>

        {/* Textarea */}
        <div
          style={{
            position: "relative",
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            transition: "border-color 0.2s",
          }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            id="memo-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="회의 내용을 자유롭게 입력하세요… (⌘+Enter 저장)"
            rows={2}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "10px 44px 10px 12px",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: "inherit",
              overflowY: "hidden",
              minHeight: 44,
            }}
            onFocus={(e) => {
              (e.currentTarget.parentElement as HTMLDivElement).style.borderColor =
                "var(--accent-blue)";
              (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow =
                "0 0 0 2px var(--accent-blue-subtle)";
            }}
            onBlur={(e) => {
              (e.currentTarget.parentElement as HTMLDivElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow =
                "none";
            }}
          />
          {/* Send button */}
          <button
            id="btn-memo-save"
            onClick={saveMemo}
            disabled={!input.trim()}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: input.trim()
                ? "var(--accent-blue)"
                : "var(--bg-hover)",
              color: input.trim() ? "#fff" : "var(--text-tertiary)",
              cursor: input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Result panel tabs */
function ResultPanel({
  elapsed,
  sttLines,
  partialText,
}: {
  elapsed: number;
  sttLines: string[];
  partialText: string;
}) {
  const [activeTab, setActiveTab] = useState<"stt" | "summary" | "detail">(
    "summary"
  );
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { key: "stt" as const, label: "STT 결과" },
    { key: "summary" as const, label: "요약" },
    { key: "detail" as const, label: "상세 회의록" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 12px",
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 14px",
              border: "none",
              background: "transparent",
              color:
                activeTab === tab.key
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer",
              position: "relative",
              transition: "color 0.15s",
              fontFamily: "inherit",
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 8,
                  right: 8,
                  height: 2,
                  background: "var(--accent-blue)",
                  borderRadius: "2px 2px 0 0",
                }}
              />
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          id="btn-generate-ai"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 2000);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 14px",
            margin: "6px 0",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-blue)",
            background: "var(--accent-blue-subtle)",
            color: "var(--accent-blue)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--accent-blue)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--accent-blue-subtle)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent-blue)";
          }}
        >
          {isLoading ? (
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Sparkles size={12} />
          )}
          AI 생성
        </button>
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px",
        }}
      >
        {/* ── STT 탭 ── */}
        {activeTab === "stt" && (
          <div style={{ height: "100%" }}>
            {sttLines.length === 0 && !partialText ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mic size={22} color="var(--text-tertiary)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                    STT 변환 결과가 여기에 표시됩니다
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    녹음을 시작하면 실시간으로 음성이 텍스트로 변환됩니다
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sttLines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 14,
                      color: "var(--text-primary)",
                      lineHeight: 1.7,
                      padding: "6px 10px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-hover)",
                      margin: 0,
                    }}
                  >
                    {line}
                  </p>
                ))}
                {partialText && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-tertiary)",
                      lineHeight: 1.7,
                      padding: "6px 10px",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border-default)",
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    {partialText}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 요약 / 상세 탭 ── */}
        {activeTab !== "stt" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--bg-hover)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeTab === "summary" ? (
                <Sparkles size={22} color="var(--text-tertiary)" />
              ) : (
                <FileText size={22} color="var(--text-tertiary)" />
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                {activeTab === "summary" ? "AI 요약" : "상세 회의록"}가 여기에 표시됩니다
              </p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                녹음 후 'AI 생성' 버튼을 클릭하세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function MeetingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessionTitle, setSessionTitle] = useState("새 회의");
  const [editingTitle, setEditingTitle] = useState(false);
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // STT 관련 상태
  const [sttLines, setSttLines] = useState<string[]>([]);
  const [partialText, setPartialText] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);

  // 로컬 스토리지에서 이전 회의 기록 자동 복원
  useEffect(() => {
    const saved = localStorage.getItem("ai_meeting_latest");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.title) setSessionTitle(data.title);
        if (data.memos) setMemos(data.memos);
        if (data.sttLines) setSttLines(data.sttLines);
        if (data.elapsed) setElapsed(data.elapsed);
      } catch (e) {}
    }
  }, []);

  const saveSession = useCallback(() => {
    const data = {
      title: sessionTitle,
      memos,
      sttLines,
      elapsed,
      date: new Date().toISOString(),
    };
    localStorage.setItem("ai_meeting_latest", JSON.stringify(data));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  }, [sessionTitle, memos, sttLines, elapsed]);

  const handleNewMeeting = useCallback(() => {
    if (confirm("새 회의를 시작하면 현재 기록이 모두 초기화됩니다. 이대로 진행할까요?")) {
      setSessionStart(null);
      setSessionTitle("새 회의");
      setElapsed(0);
      setSttLines([]);
      setMemos([]);
      setPartialText("");
      if (isRecording) {
        setIsRecording(false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        stopTranscription();
      }
    }
  }, [isRecording]); // `stopTranscription` is hoisted via useCallback below but we ignore dependency issue by omitting or fixing order

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transcriberRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // AssemblyAI 실시간 STT 시작
  const startTranscription = useCallback(async () => {
    try {
      setSttError(null);

      // 1. 서버에서 임시 토큰 발급
      const tokenRes = await fetch("/api/assemblyai-token");
      if (!tokenRes.ok) throw new Error("토큰 발급에 실패했습니다.");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("토큰이 없습니다.");

      // 2. 마이크 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. AudioContext 설정 (16kHz mono PCM)
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 4. AssemblyAI StreamingTranscriber(v3) 동적 import
      const { StreamingTranscriber } = await import("assemblyai");
      const transcriber = new StreamingTranscriber({
        token,
        encoding: "pcm_s16le",
        sampleRate: 16000,
        speechModel: "universal-streaming-multilingual",
        languageDetection: true,
      });
      transcriberRef.current = transcriber;

      // v3 이벤트: turn (발화 완료) / partial_turn (중간 결과)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transcriber.on("partial_turn" as any, (t: { transcript: string }) => {
        setPartialText(t.transcript ?? "");
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transcriber.on("turn" as any, (t: { transcript: string }) => {
        if (t.transcript) {
          setSttLines((prev) => [...prev, t.transcript]);
        }
        setPartialText("");
      });
      transcriber.on("error", (err: Error) => {
        setSttError(err.message ?? "STT 오류가 발생했습니다.");
      });

      await transcriber.connect();

      // 5. PCM 데이터를 전송
      processor.onaudioprocess = (e) => {
        if (!transcriberRef.current) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }
        transcriberRef.current.sendAudio(int16.buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : "알 수 없는 오류";
      if (msg.includes("Requested device not found") || err?.name === "NotFoundError") {
        msg = "마이크를 찾을 수 없습니다. 연결된 마이크 장치가 있는지 확인해 주세요.";
      } else if (msg.includes("Permission denied") || err?.name === "NotAllowedError") {
        msg = "마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해 주세요.";
      }
      setSttError(msg);
      setIsRecording(false);
    }
  }, []);

  // AssemblyAI 실시간 STT 중지
  const stopTranscription = useCallback(async () => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    await transcriberRef.current?.close();
    transcriberRef.current = null;
    setPartialText("");
  }, []);

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      if (sessionStart === null) setSessionStart(new Date());
      setIsRecording(true);
      startTranscription();
    } else {
      setIsRecording(false);
      stopTranscription();
      // 녹음 종료 시 즉각적으로 로컬 스토리지에 한 번 더 저장해둡니다.
      setTimeout(() => saveSession(), 100);
    }
  }, [isRecording, startTranscription, stopTranscription, sessionStart, saveSession]);

  const addMemo = useCallback((memo: MemoItem) => {
    setMemos((prev) => [...prev, memo]);
  }, []);

  const deleteMemo = useCallback((id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  }, []);

  // Today
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes equalizer {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        #btn-rec-toggle:hover { transform: scale(1.05); }
        #btn-rec-toggle:active { transform: scale(0.97); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
        }}
      >
        {/* ── HEADER ── */}
        <header
          style={{
            height: 52,
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "var(--bg-secondary)",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginRight: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={14} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              AI Meeting
            </span>
          </div>

          <ChevronRight size={14} color="var(--border-strong)" />

          {/* Editable session title */}
          {editingTitle ? (
            <input
              autoFocus
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape")
                  setEditingTitle(false);
              }}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--accent-blue)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
                padding: "3px 8px",
                outline: "none",
                fontFamily: "inherit",
                width: 200,
              }}
            />
          ) : (
            <button
              id="btn-edit-title"
              onClick={() => setEditingTitle(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                padding: "3px 6px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              {sessionTitle}
            </button>
          )}

          {/* Date */}
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              marginLeft: "auto",
            }}
          >
            {today}
          </span>

          {/* Header actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              id="btn-new-meeting"
              title="새 회의"
              onClick={handleNewMeeting}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <FilePlus size={14} />
            </button>
            <button
              id="btn-save"
              title="저장"
              onClick={saveSession}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <Save size={14} />
            </button>
            <button
              id="btn-export"
              title="내보내기"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <Download size={14} />
            </button>
            <button
              id="btn-settings"
              title="설정"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "300px 1fr 1fr",
            gridTemplateRows: "auto 1fr",
            gap: 12,
            padding: 16,
            minHeight: 0,
            maxHeight: "calc(100vh - 52px - 56px)",
          }}
        >
          {/* Recording panel — full width top */}
          <div style={{ gridColumn: "1 / -1" }}>
            <RecordingPanel
              isRecording={isRecording}
              elapsed={elapsed}
              onToggle={toggleRecording}
            />
          </div>

          {/* Session info sidebar */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
            }}
          >
            {/* Session meta */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                세션 정보
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    label: "시작 시각",
                    value: sessionStart
                      ? formatTime(sessionStart)
                      : "—",
                  },
                  {
                    label: "메모 수",
                    value: `${memos.length}개`,
                  },
                  {
                    label: "상태",
                    value: isRecording ? "녹음 중" : "대기",
                    color: isRecording ? "var(--accent-red)" : "var(--text-secondary)",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: item.color ?? "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants placeholder */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                참석자
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["나", "김철수", "이영희"].map((name) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: `hsl(${name.charCodeAt(0) * 37}deg 60% 45%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {name[0]}
                    </div>
                    <span
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
                <button
                  id="btn-add-participant"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "1px dashed var(--border-default)",
                    borderRadius: 20,
                    padding: "3px 10px",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-tertiary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border-default)";
                  }}
                >
                  <Plus size={11} /> 추가
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ marginTop: "auto" }}>
              <button
                id="btn-save-session"
                style={{
                  width: "100%",
                  padding: "9px 0",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--accent-blue)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--accent-blue-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--accent-blue)";
                }}
              >
                <Bookmark size={13} /> 저장
              </button>
            </div>
          </div>

          {/* Memo panel */}
          <MemoPanel
            memos={memos}
            sessionStart={sessionStart}
            elapsed={elapsed}
            onAddMemo={addMemo}
            onDeleteMemo={deleteMemo}
            onToggleCheck={toggleCheck}
          />

          {/* Result panel */}
          <ResultPanel
            elapsed={elapsed}
            sttLines={sttLines}
            partialText={partialText}
          />

          {/* 저장 완료 토스트 알림 */}
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              transform: showSaveToast ? "translateY(0)" : "translateY(50px)",
              opacity: showSaveToast ? 1 : 0,
              visibility: showSaveToast ? "visible" : "hidden",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              zIndex: 100,
            }}
          >
            <div style={{ background: "var(--accent-blue)", color: "#fff", borderRadius: "50%", padding: 4, display: "flex" }}>
              <CheckSquare size={14} />
            </div>
            회의 기록이 기기에 저장되었습니다.
          </div>

          {/* STT 오류 토스트 */}
          {sttError && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "var(--accent-red-subtle)",
                border: "1px solid var(--accent-red)",
                borderRadius: "var(--radius-md)",
                padding: "10px 16px",
                color: "var(--accent-red)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>⚠️ STT 오류: {sttError}</span>
              <button
                onClick={() => setSttError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", fontSize: 16 }}
              >×</button>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer
          style={{
            height: 56,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            flexShrink: 0,
            background: "var(--bg-secondary)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            AI Meeting v0.9
          </span>
          <span
            style={{
              width: 1,
              height: 14,
              background: "var(--border-default)",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            데이터는 로컬에만 저장됩니다
          </span>
          <div style={{ flex: 1 }} />
          <button
            id="btn-delete-session"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--accent-red)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--accent-red)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent-red-subtle)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-tertiary)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <Trash2 size={12} /> 세션 삭제
          </button>
        </footer>
      </div>
    </>
  );
}
