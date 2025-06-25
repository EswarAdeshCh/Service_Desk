"use client"

import { useState, useEffect, useRef } from "react"

const CommunicationWindow = ({ complaintId, name }) => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [complaintId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`http://localhost:8000/api/messages/complaint/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId,
          message: message.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.data])
        setMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="communication-window">
      <div className="communication-header">
        <h4>Communication Thread</h4>
        <p className="communication-id">Issue ID: {complaintId}</p>
      </div>

      <div className="messages-container">
        {messages.length > 0 ? (
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg._id} className={`message ${msg.senderName === name ? "message-sent" : "message-received"}`}>
                <div className="message-header">
                  <span className="message-sender">{msg.senderName}</span>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <div className="message-input-container">
        <textarea
          className="message-input"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={2}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={!message.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}

export default CommunicationWindow
