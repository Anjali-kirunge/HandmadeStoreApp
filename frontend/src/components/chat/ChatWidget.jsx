import { useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiX, FiSend, FiUser, FiCpu } from 'react-icons/fi';
import { sendChatMessage } from '../../services/chatService';
import Logo from '../common/Logo';
import './ChatWidget.css';

const MAX_HISTORY = 10;

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [open, messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = nextMessages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage({ message: text, history });
      const reply = res.data?.reply || 'Sorry, I could not understand that.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Something went wrong. Please try again in a moment.';
      setMessages((prev) => [...prev, { role: 'error', content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-window" role="dialog" aria-label="Store assistant chat">
          <div className="chat-header">
            <div className="chat-header-title">
              <Logo size={32} showWordmark={false} />
              <div>
                <strong>Store Assistant</strong>
                <span className="chat-header-sub">Handmade Store AI helper</span>
              </div>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <FiX />
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Hi there! I&apos;m the Handmade Store assistant.</p>
                <p>
                  Ask me about our handcrafted products, categories, and prices - for example,
                  &quot;Do you have a leather tote bag?&quot;
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>
                {msg.role !== 'user' && <FiCpu className="chat-msg-avatar" />}
                {msg.role === 'user' && <FiUser className="chat-msg-avatar" />}
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <FiCpu className="chat-msg-avatar" />
                <div className="chat-bubble typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              maxLength={500}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close store assistant' : 'Open store assistant'}
      >
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
};

export default ChatWidget;
