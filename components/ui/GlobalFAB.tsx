"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function GlobalFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const defaultCategory = pathname.startsWith("/category/")
    ? pathname.split("/category/")[1]
    : "";

  return (
    <>
      {/* Pill FAB */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 20,
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#5B4CDB",
          color: "#fff",
          padding: "0 18px",
          height: 44,
          borderRadius: 50,
          border: "none",
          boxShadow: "0 4px 16px rgba(91,76,219,0.45)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Plus size={16} />
        List Item
      </button>

      {/* Bottom Sheet */}
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div onClick={() => setIsOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s" }} />
          
          {/* Sheet */}
          <div style={{ position: "relative", background: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 20px", maxHeight: "90vh", overflowY: "auto", animation: "slideUpSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", fontFamily: "'Syne', sans-serif" }}>List an Item</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Category</label>
                <select defaultValue={defaultCategory} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 14 }}>
                  <option value="">Select Category</option>
                  <option value="calculator">Calculator</option>
                  <option value="drafter">Drafter</option>
                  <option value="lab-coat">Lab Coat</option>
                  <option value="laptop">Laptop</option>
                  <option value="camera">Camera</option>
                  <option value="geometry">Geometry</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Item Name</label>
                <input type="text" placeholder="e.g. Casio fx-991EX" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Brand</label>
                <input type="text" placeholder="e.g. Casio" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Condition</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {['New', 'Good', 'Fair'].map(cond => (
                    <button key={cond} style={{ flex: 1, padding: "8px 0", borderRadius: 20, border: "1px solid #e2e8f0", background: cond === 'Good' ? "#5B4CDB" : "#fff", color: cond === 'Good' ? "#fff" : "#475569", fontSize: 13, fontWeight: 600 }}>{cond}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Price per hour (₹)</label>
                <input type="number" placeholder="15" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Photos (Up to 4)</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, border: "1px dashed #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", background: "#f8fafc" }}><Plus size={24} /></div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Description (Optional)</label>
                <textarea placeholder="Add any specific details..." rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14, resize: "none" }} />
              </div>

              <button onClick={() => { setIsOpen(false); alert("Item Listed!"); }} style={{ width: "100%", padding: "14px", background: "#5B4CDB", color: "#fff", borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, marginTop: 8 }}>
                List Item
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}
