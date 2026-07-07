"use client";

import { useState, useRef, useCallback } from 'react';
import { Phone, MessageCircle, X, Send, MapPin, Package, Star, BadgeCheck, ChevronUp } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useRouter } from 'next/navigation';

// ─── Props ────────────────────────────────────────────────────────────────────
interface LiveTrackingBottomCardProps {
  rental: Listing;
  currentUserId: string;
  isOwner: boolean;
  // Other user's profile
  otherUserName?: string;
  otherUserPhoto?: string;
  otherUserDept?: string;
  otherUserPhone?: string;
  otherUserRoll?: string;
  otherUserCollege?: string;
  otherUserRating?: number;
  otherUserReviewCount?: number;
  otherUserVerified?: boolean;
  // Distance / ETA
  etaMin?: number;
  distanceM?: number;
  phase: 'pending' | 'live' | 'arrived';
  // Handoff actions
  onMarkHandedOver?: () => void;
  onMarkReceived?: () => void;
  onProblem?: () => void;
  onWrongItem?: () => void;
  onQuickMessage?: (msg: string) => void;
}

// ─── Snap positions (% of viewport height from bottom) ────────────────────────
const SNAP = { collapsed: 26, expanded: 68 } as const;

function getSmartSuggestions(etaMin: number | undefined, phase: string): string[] {
  if (phase === 'arrived') return ["I see you! 👋", "Coming down now", "At the entrance 🚪"];
  if (etaMin !== undefined && etaMin <= 2) return ["Almost there! 🏃", "I'm nearby", "Give me a sec"];
  return ["On my way 🚶", "Be there in ~5 min", "Waiting here ⏳"];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveTrackingBottomCard({
  rental, currentUserId, isOwner,
  otherUserName, otherUserPhoto, otherUserDept, otherUserPhone,
  otherUserRoll, otherUserCollege, otherUserRating, otherUserReviewCount, otherUserVerified,
  etaMin, distanceM, phase,
  onMarkHandedOver, onMarkReceived, onProblem, onWrongItem, onQuickMessage,
}: LiveTrackingBottomCardProps) {
  const router = useRouter();
  const [snapPct, setSnapPct] = useState<number>(SNAP.collapsed);
  const [showMsgSheet, setShowMsgSheet] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [handoffDone, setHandoffDone] = useState(false);
  const [receivedDone, setReceivedDone] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartSnap = useRef<number>(SNAP.collapsed);

  const isExpanded = snapPct >= SNAP.expanded - 5;
  const suggestions = getSmartSuggestions(etaMin, phase);

  // ── Drag gestures ────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartSnap.current = snapPct;
  }, [snapPct]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    // Swipe up > 30px → expand; swipe down > 30px → collapse
    if (dy > 30) setSnapPct(SNAP.expanded);
    else if (dy < -30) setSnapPct(SNAP.collapsed);
    dragStartY.current = null;
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapPct(p => p >= SNAP.expanded - 5 ? SNAP.collapsed : SNAP.expanded);
  }, []);

  const handleSendFree = useCallback(() => {
    if (freeText.trim()) {
      onQuickMessage?.(freeText.trim());
      setFreeText('');
      setShowMsgSheet(false);
    }
  }, [freeText, onQuickMessage]);

  // ── Initials ─────────────────────────────────────────────────────────────────
  const initials = otherUserName
    ? otherUserName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const distLabel = distanceM !== undefined
    ? distanceM <= 100 ? '🎯 Right here!' : `📍 ${distanceM}m away`
    : 'Locating…';

  const roleLabel = isOwner ? 'BORROWER' : 'OWNER';
  const roleColor = isOwner ? '#D97706' : '#0B57D0';
  const roleBg   = isOwner ? '#FEF3C7' : '#EEF0FF';

  return (
    <>
      {/* ── Bottom sheet ─────────────────────────────────────────────────────── */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: `${snapPct}vh`,
          maxWidth: 480,
          margin: '0 auto',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
          // Hardware-accelerated transitions
          transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'height',
        }}
      >
        {/* Glass sheet */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 40px rgba(83,74,183,0.14)',
          borderTop: '0.5px solid rgba(83,74,183,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* ── Drag handle ── */}
          <button
            onClick={toggleSnap}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: 10, paddingBottom: 8, cursor: 'pointer', gap: 2,
              flexShrink: 0,
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(83,74,183,0.2)' }} />
            <ChevronUp
              style={{
                width: 14, height: 14, color: '#94a3b8',
                transition: 'transform 0.3s ease',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* ── Scrollable content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 28px' }}>

            {/* ── Person row ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {otherUserPhoto ? (
                  <img
                    src={otherUserPhoto}
                    alt={otherUserName}
                    style={{
                      width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
                      border: '2.5px solid #0B57D0',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#0B57D0,#1A73E8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 18,
                    boxShadow: '0 4px 14px rgba(83,74,183,0.3)',
                  }}>{initials}</div>
                )}
                {/* Live indicator */}
                {phase === 'live' && (
                  <div style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 13, height: 13, borderRadius: '50%',
                    background: '#10B981', border: '2px solid #fff',
                  }} />
                )}
              </div>

              {/* Name + role + distance */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{
                    fontSize: 16, fontWeight: 800, color: '#0f172a',
                    fontFamily: "'Outfit', sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 130,
                  }}>
                    {otherUserName || 'Student'}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                    background: roleBg, color: roleColor, letterSpacing: '0.06em',
                  }}>
                    {roleLabel}
                  </span>
                  {otherUserVerified && (
                    <BadgeCheck style={{ width: 14, height: 14, color: '#10B981' }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  {distLabel}
                  {etaMin && distanceM && distanceM > 100 && (
                    <span style={{ color: '#0B57D0', fontWeight: 700, marginLeft: 6 }}>
                      · ~{etaMin} min
                    </span>
                  )}
                </div>
              </div>

              {/* Call button */}
              <a
                href={`tel:${otherUserPhone || '+919999999999'}`}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#059669,#10B981)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'; }}
              >
                <Phone style={{ width: 18, height: 18, color: '#fff' }} />
              </a>

              {/* Chat button */}
              <button
                onClick={() => router.push(`/chat/${rental.id}`)}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0B57D0,#1A73E8)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(83,74,183,0.3)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(83,74,183,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 14px rgba(83,74,183,0.3)'; }}
              >
                <MessageCircle style={{ width: 18, height: 18, color: '#fff' }} />
              </button>
            </div>

            {/* ── User detail chip row ── */}
            <div style={{
              display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14,
              background: '#F8FAFF', borderRadius: 14,
              padding: '10px 12px',
              border: '0.5px solid rgba(83,74,183,0.1)',
            }}>
              {[
                { icon: '🎓', label: otherUserDept || '—' },
                { icon: '🪪', label: otherUserRoll || '—' },
                { icon: '🏫', label: otherUserCollege || 'SVEC' },
              ].map(({ icon, label }) => (
                <span key={icon} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, color: '#475569',
                  background: '#fff', padding: '4px 10px', borderRadius: 20,
                  border: '0.5px solid rgba(83,74,183,0.12)',
                  flexShrink: 0,
                }}>
                  {icon} {label}
                </span>
              ))}
              {/* Rating */}
              {otherUserRating != null && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, color: '#D97706',
                  background: '#FFF7ED', padding: '4px 10px', borderRadius: 20,
                  border: '0.5px solid rgba(251,191,36,0.3)',
                }}>
                  <Star style={{ width: 11, height: 11, fill: '#F59E0B', color: '#F59E0B' }} />
                  {otherUserRating.toFixed(1)}
                  {otherUserReviewCount != null && (
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>({otherUserReviewCount})</span>
                  )}
                </span>
              )}
            </div>

            {/* ── Destination + item strip ── */}
            <div style={{
              display: 'flex', gap: 8, marginBottom: 14,
            }}>
              {/* Meetup point */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 7,
                background: '#F8FAFF', borderRadius: 12, padding: '8px 11px',
                border: '0.5px solid rgba(83,74,183,0.1)',
              }}>
                <MapPin style={{ width: 13, height: 13, color: '#0B57D0', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#0B57D0', letterSpacing: '0.06em', marginBottom: 1 }}>
                    MEETUP POINT
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rental.block || 'Campus Block'}
                  </div>
                </div>
              </div>

              {/* Item */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 7,
                background: '#F8FAFF', borderRadius: 12, padding: '8px 11px',
                border: '0.5px solid rgba(83,74,183,0.1)',
              }}>
                {rental.photoUrl ? (
                  <img src={rental.photoUrl} alt={rental.itemName}
                    style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: '#EEF0FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                  }}>{rental.icon || '📦'}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#0B57D0', letterSpacing: '0.06em', marginBottom: 1 }}>
                    ITEM
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rental.itemName}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CTA actions (phase-based) ── */}
            {phase === 'arrived' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isOwner ? (
                  <>
                    <button
                      disabled={handoffDone}
                      onClick={() => { setHandoffDone(true); onMarkHandedOver?.(); }}
                      style={{
                        width: '100%', height: 50, borderRadius: 14, border: 'none',
                        background: handoffDone ? '#F1F5F9' : 'linear-gradient(135deg,#0B57D0,#1A73E8)',
                        color: handoffDone ? '#94a3b8' : '#fff',
                        fontSize: 14, fontWeight: 800, cursor: handoffDone ? 'default' : 'pointer',
                        boxShadow: handoffDone ? 'none' : '0 4px 16px rgba(83,74,183,0.3)',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {handoffDone ? '✓ Waiting for borrower to confirm…' : '🤝 Hand Over Item'}
                    </button>
                    <button onClick={() => onProblem?.()} style={{
                      background: 'none', border: 'none', color: '#DC2626',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0',
                    }}>
                      Problem / Not here ›
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={receivedDone}
                      onClick={() => { setReceivedDone(true); onMarkReceived?.(); }}
                      style={{
                        width: '100%', height: 50, borderRadius: 14, border: 'none',
                        background: receivedDone ? '#F1F5F9' : 'linear-gradient(135deg,#059669,#10B981)',
                        color: receivedDone ? '#94a3b8' : '#fff',
                        fontSize: 14, fontWeight: 800, cursor: receivedDone ? 'default' : 'pointer',
                        boxShadow: receivedDone ? 'none' : '0 4px 16px rgba(16,185,129,0.3)',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {receivedDone ? '✓ Confirmed! Waiting for owner…' : '✅ I Received the Item!'}
                    </button>
                    <button onClick={() => onWrongItem?.()} style={{
                      background: 'none', border: 'none', color: '#DC2626',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0',
                    }}>
                      Wrong item / Not received ›
                    </button>
                  </>
                )}
              </div>
            ) : phase === 'pending' ? (
              <div style={{
                height: 46, background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#D97706',
                fontFamily: "'Outfit', sans-serif",
                border: '1px solid rgba(251,191,36,0.3)',
              }}>
                ⏳ Waiting for owner to approve…
              </div>
            ) : (
              /* Live — quick message chips */
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => onQuickMessage?.(s)}
                    style={{
                      flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                      background: '#EEF0FF', border: 'none',
                      color: '#0B57D0', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'transform 0.15s ease',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >{s}</button>
                ))}
                <button
                  onClick={() => setShowMsgSheet(true)}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                    background: '#0B57D0', border: 'none',
                    color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >✏ Custom</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Message Overlay ─────────────────────────────────────────────── */}
      {showMsgSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMsgSheet(false)}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(255,255,255,0.98)', borderRadius: '28px 28px 0 0',
            padding: '20px 20px 36px', maxWidth: 480, margin: '0 auto',
            animation: 'iy-msg-up 0.3s cubic-bezier(0.22,1,0.36,1) both',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <style>{`@keyframes iy-msg-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Quick Message
              </h3>
              <button onClick={() => setShowMsgSheet(false)} style={{
                background: '#F8FAFF', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer'
              }}>
                <X style={{ width: 15, height: 15, color: '#64748b' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { onQuickMessage?.(s); setShowMsgSheet(false); }}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: '#F8FAFF', border: '0.5px solid rgba(83,74,183,0.1)',
                    color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF0FF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F8FAFF'}
                >{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={e => e.key === 'Enter' && handleSendFree()}
                style={{
                  flex: 1, height: 44, borderRadius: 12, border: '1px solid #e2e8f0',
                  padding: '0 14px', fontSize: 13, outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  background: '#F8FAFF',
                }}
              />
              <button
                onClick={handleSendFree}
                disabled={!freeText.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none',
                  background: freeText.trim() ? '#0B57D0' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: freeText.trim() ? 'pointer' : 'default',
                  boxShadow: freeText.trim() ? '0 4px 12px rgba(83,74,183,0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Send style={{ width: 16, height: 16, color: freeText.trim() ? '#fff' : '#94a3b8' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
