import { useEffect, useState, useCallback, useRef } from "react";

type Message = {
  id: number;
  patient_id: number;
  sender: "doctor" | "patient";
  message: string;
  created_at: string;
};

type ChatProps = {
  patientId: number;
  role: "patient" | "doctor";
};

const Chat = ({ patientId, role }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null); // ✅ STEP 2 ADDED

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/${patientId}`
      );

      const data = await res.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [patientId]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      await fetch("http://localhost:5000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          sender: role,
          message: input,
        }),
      });

      setInput("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Polling
  useEffect(() => {
    const loadMessages = async () => {
      await fetchMessages();
    };

    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ✅ Auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>{role === "doctor" ? "Doctor Chat" : "Patient Chat"}</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.sender === role;

          return (
            <div
              key={msg.id}
              style={{
                textAlign: isCurrentUser ? "right" : "left",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  backgroundColor: isCurrentUser
                    ? "#4f46e5"
                    : "#e5e7eb",
                  color: isCurrentUser ? "white" : "black",
                }}
              >
                {msg.message}
              </span>
            </div>
          );
        })}

        {/* ✅ Scroll Anchor */}
        <div ref={bottomRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
        style={{ marginRight: "8px" }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
