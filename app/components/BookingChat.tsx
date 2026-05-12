'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC' };

interface Props {
  bookingId: string;
  myRole: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  myName?: string;
  onClose?: () => void;
}

export default function BookingChat({ bookingId, myRole, myName, onClose }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const r = await fetch(`${API}/bookings/${bookingId}/messages`, { headers: { Authorization: 'Bearer ' + token } });
      const d = await r.json();
      if (d.data) setMessages(d.data);
    } catch {}
  }, [bookingId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000); // Poll every 5 seconds
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    setSending(true);
    setError('');
    const token = localStorage.getItem('token') || '';
    try {
      const r = await fetch(`${API}/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ content: input.trim() }),
      });
      const d = await r.json();
      if (r.ok) { setInput(''); await load(); }
      else setError(d.error || 'Failed to send');
    } catch { setError('Connection error'); }
    setSending(false);
  }

  const roleColor: Record<string, string> = { CLIENT: C.blue, PROFESSIONAL: C.green, ADMIN: C.navy };
  const roleLabel: Record<string, string> = { CLIENT: 'Client', PROFESSIONAL: 'Professional', ADMIN: 'Admin' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>💬 Platform Chat</div>
          <div style={{ fontSize: 11, color: C.muted }}>Protected • No phones or emails shared</div>
        </div>
        {onClose && <button onClick={onClose} style={{ border: 0, background: 'transparent', fontSize: 18, cursor: 'pointer', color: C.muted }}>×</button>}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: C.soft, minHeight: 200, maxHeight: 350 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, padding: '20px 0' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg: any) => {
          const isMe = msg.sender_role === myRole;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ fontWeight: 700, color: roleColor[msg.sender_role] }}>{isMe ? 'You' : roleLabel[msg.sender_role]}</span>
                {' · '}{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{
                maxWidth: '80%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMe ? C.navy : '#fff',
                color: isMe ? '#fff' : C.ink,
                fontSize: 13, lineHeight: 1.4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: isMe ? 'none' : `1px solid ${C.border}`,
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <div style={{ padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', fontSize: 12 }}>{error}</div>}

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, background: '#fff' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message... (no phones or emails)"
          style={{ flex: 1, height: 40, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', color: C.ink }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{ padding: '0 16px', height: 40, borderRadius: 8, border: 0, background: C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending || !input.trim() ? 0.6 : 1 }}
        >
          {sending ? '...' : '→'}
        </button>
      </div>
    </div>
  );
}
