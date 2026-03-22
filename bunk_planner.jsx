import { useState, useEffect } from "react";

const REQUIRED = 0.75;

function safeBunks(A, T) {
  if (T === 0) return 0;
  return Math.max(0, Math.floor(A / REQUIRED - T));
}

function classesNeeded(A, T) {
  if (T === 0) return 0;
  if (A / T >= REQUIRED) return 0;
  return Math.ceil((REQUIRED * T - A) / (1 - REQUIRED));
}

function pct(A, T) {
  if (T === 0) return 0;
  return (A / T) * 100;
}

const COLORS = [
  "#FF6B35", "#00D4AA", "#7B61FF", "#FF3CAC", "#FFD166",
  "#06D6A0", "#EF476F", "#118AB2", "#F4A261", "#A8DADC"
];

const initialSubjects = [];

export default function App() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem("bunk_subjects");
      return saved ? JSON.parse(saved) : initialSubjects;
    } catch { return initialSubjects; }
  });
  const [view, setView] = useState("dashboard"); // dashboard | add | detail
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [form, setForm] = useState({ name: "", total: "", attended: "" });
  const [formErr, setFormErr] = useState("");
  const [simulateMap, setSimulateMap] = useState({});
  const [flash, setFlash] = useState(null); // { idx, type: 'attend'|'bunk' }

  useEffect(() => {
    localStorage.setItem("bunk_subjects", JSON.stringify(subjects));
  }, [subjects]);

  function addSubject() {
    const name = form.name.trim();
    const total = parseInt(form.total);
    const attended = parseInt(form.attended);
    if (!name) { setFormErr("Subject name is required."); return; }
    if (isNaN(total) || total < 0) { setFormErr("Total must be a non-negative number."); return; }
    if (isNaN(attended) || attended < 0) { setFormErr("Attended must be a non-negative number."); return; }
    if (attended > total) { setFormErr("Attended can't exceed total classes."); return; }
    const color = COLORS[subjects.length % COLORS.length];
    setSubjects(s => [...s, { name, total, attended, color, id: Date.now() }]);
    setForm({ name: "", total: "", attended: "" });
    setFormErr("");
    setView("dashboard");
  }

  function deleteSubject(idx) {
    setSubjects(s => s.filter((_, i) => i !== idx));
    setView("dashboard");
  }

  function markAttend(idx) {
    setSubjects(s => s.map((sub, i) => i === idx ? { ...sub, total: sub.total + 1, attended: sub.attended + 1 } : sub));
    setFlash({ idx, type: "attend" });
    setTimeout(() => setFlash(null), 800);
  }

  function markBunk(idx) {
    setSubjects(s => s.map((sub, i) => i === idx ? { ...sub, total: sub.total + 1 } : sub));
    setFlash({ idx, type: "bunk" });
    setTimeout(() => setFlash(null), 800);
  }

  // Overall stats
  const totalA = subjects.reduce((s, x) => s + x.attended, 0);
  const totalT = subjects.reduce((s, x) => s + x.total, 0);
  const overallPct = totalT > 0 ? (totalA / totalT) * 100 : 0;
  const dangerCount = subjects.filter(s => s.total > 0 && pct(s.attended, s.total) < 75).length;

  // Detail subject
  const det = selectedIdx !== null ? subjects[selectedIdx] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
      color: "#E8E8F0",
      padding: "0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .sub-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .sub-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .btn-pill { transition: all 0.15s ease; cursor: pointer; border: none; }
        .btn-pill:hover { filter: brightness(1.15); transform: scale(1.04); }
        .btn-pill:active { transform: scale(0.97); }
        .progress-bar { transition: width 0.7s cubic-bezier(.4,0,.2,1); }
        .flash-attend { animation: flashGreen 0.8s ease; }
        .flash-bunk { animation: flashRed 0.8s ease; }
        @keyframes flashGreen { 0%,100%{background:#1A1A2E} 40%{background:#003322} }
        @keyframes flashRed { 0%,100%{background:#1A1A2E} 40%{background:#330011} }
        input { outline: none; }
        input:focus { border-color: #7B61FF !important; }
        .sim-badge { animation: popIn 0.3s cubic-bezier(.175,.885,.32,1.275); }
        @keyframes popIn { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        .nav-tab { transition: all 0.15s ease; }
        .nav-tab:hover { color: #E8E8F0 !important; }
      `}</style>

      {/* TOP BAR */}
      <div style={{
        background: "#111118",
        borderBottom: "1px solid #1E1E2E",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", letterSpacing: "3px", color: "#7B61FF" }}>BUNKAL</span>
          <span style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", textTransform: "uppercase" }}>attendance tracker</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["dashboard", "add"].map(tab => (
            <button key={tab} className="nav-tab btn-pill" onClick={() => setView(tab)} style={{
              background: view === tab ? "#7B61FF" : "transparent",
              color: view === tab ? "#fff" : "#666",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "11px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              border: view === tab ? "none" : "1px solid #222",
            }}>
              {tab === "dashboard" ? "⚡ DASH" : "+ ADD"}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 20px" }}>

          {/* OVERALL CARD */}
          {subjects.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #111120 0%, #1A1130 100%)",
              border: "1px solid #2A1F5E",
              borderRadius: "16px",
              padding: "22px 24px",
              marginBottom: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#666", letterSpacing: "2px", marginBottom: "4px" }}>OVERALL ATTENDANCE</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "52px", lineHeight: 1, color: overallPct >= 75 ? "#00D4AA" : overallPct >= 65 ? "#FFD166" : "#EF476F" }}>
                    {overallPct.toFixed(1)}<span style={{ fontSize: "24px" }}>%</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#444", marginBottom: "6px" }}>{totalA} / {totalT} classes</div>
                  {dangerCount > 0 && (
                    <div style={{
                      background: "#2A0A0F",
                      border: "1px solid #EF476F44",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      color: "#EF476F",
                      letterSpacing: "0.5px",
                    }}>⚠ {dangerCount} subject{dangerCount > 1 ? "s" : ""} in danger</div>
                  )}
                  {dangerCount === 0 && subjects.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#00D4AA" }}>✓ all subjects safe</div>
                  )}
                </div>
              </div>
              <div style={{ background: "#0D0D1A", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div className="progress-bar" style={{
                  width: `${Math.min(overallPct, 100)}%`, height: "100%",
                  background: overallPct >= 75 ? "linear-gradient(90deg,#00D4AA,#7B61FF)" : overallPct >= 65 ? "#FFD166" : "#EF476F",
                  borderRadius: "4px",
                }} />
              </div>
              <div style={{ position: "relative", marginTop: "2px", height: "14px" }}>
                <div style={{ position: "absolute", left: "75%", top: 0, width: "1px", height: "8px", background: "#7B61FF66" }} />
                <div style={{ position: "absolute", left: "75%", top: "8px", fontSize: "9px", color: "#7B61FF88", transform: "translateX(-50%)" }}>75%</div>
              </div>
            </div>
          )}

          {/* SUBJECT CARDS */}
          {subjects.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              border: "1px dashed #222", borderRadius: "16px",
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📚</div>
              <div style={{ color: "#444", fontSize: "13px", letterSpacing: "1px" }}>No subjects yet.</div>
              <div style={{ color: "#333", fontSize: "11px", marginTop: "6px" }}>Tap + ADD to get started.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {subjects.map((sub, idx) => {
                const p = pct(sub.attended, sub.total);
                const sb = safeBunks(sub.attended, sub.total);
                const cn = classesNeeded(sub.attended, sub.total);
                const danger = sub.total > 0 && p < 75;
                const simBunk = simulateMap[sub.id];
                let simP = null, simSb = null;
                if (simBunk) {
                  simP = pct(sub.attended, sub.total + 1);
                  simSb = safeBunks(sub.attended, sub.total + 1);
                }
                const isFlash = flash && flash.idx === idx;
                return (
                  <div key={sub.id} className={`sub-card${isFlash ? (flash.type === "attend" ? " flash-attend" : " flash-bunk") : ""}`}
                    style={{
                      background: "#1A1A2E",
                      border: `1px solid ${danger ? "#EF476F33" : "#1E1E3E"}`,
                      borderLeft: `3px solid ${sub.color}`,
                      borderRadius: "12px",
                      padding: "18px 20px",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "0.5px", marginBottom: "3px" }}>{sub.name}</div>
                        <div style={{ fontSize: "11px", color: "#555" }}>{sub.attended}/{sub.total} attended</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "30px", lineHeight: 1,
                          color: p >= 75 ? "#00D4AA" : p >= 65 ? "#FFD166" : "#EF476F",
                        }}>{sub.total === 0 ? "--" : p.toFixed(1) + "%"}</div>
                        <button onClick={() => { setSelectedIdx(idx); setView("detail"); }} style={{
                          background: "#222", border: "none", borderRadius: "8px",
                          color: "#888", padding: "6px 10px", cursor: "pointer", fontSize: "14px",
                        }}>›</button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: "#0D0D1A", borderRadius: "4px", height: "5px", overflow: "hidden", marginBottom: "12px" }}>
                      <div className="progress-bar" style={{
                        width: `${Math.min(p, 100)}%`, height: "100%",
                        background: p >= 75 ? sub.color : p >= 65 ? "#FFD166" : "#EF476F",
                        borderRadius: "4px",
                        opacity: 0.9,
                      }} />
                    </div>

                    {/* Status line */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {danger ? (
                        <span style={{ background: "#2A0A0F", border: "1px solid #EF476F44", color: "#EF476F", borderRadius: "6px", padding: "3px 10px", fontSize: "11px" }}>
                          ⚠ attend {cn} more to recover
                        </span>
                      ) : (
                        <span style={{ background: "#0A1F18", border: "1px solid #00D4AA33", color: "#00D4AA", borderRadius: "6px", padding: "3px 10px", fontSize: "11px" }}>
                          ✓ {sb} safe bunk{sb !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>

                    {/* Simulate + Quick Actions */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <button className="btn-pill" onClick={() => markAttend(idx)} style={{
                        background: "#003322", color: "#00D4AA", padding: "6px 14px", borderRadius: "8px", fontSize: "11px", letterSpacing: "0.5px",
                      }}>+ Attended</button>
                      <button className="btn-pill" onClick={() => markBunk(idx)} style={{
                        background: "#1A0A12", color: "#EF476F", padding: "6px 14px", borderRadius: "8px", fontSize: "11px", letterSpacing: "0.5px",
                      }}>✗ Bunked</button>
                      <button className="btn-pill" onClick={() => setSimulateMap(m => ({ ...m, [sub.id]: !m[sub.id] }))} style={{
                        background: simBunk ? "#1A1030" : "#111", color: simBunk ? "#7B61FF" : "#555",
                        border: `1px solid ${simBunk ? "#7B61FF55" : "#222"}`,
                        padding: "6px 14px", borderRadius: "8px", fontSize: "11px", letterSpacing: "0.5px",
                      }}>⚡ If I bunk</button>
                    </div>

                    {/* Simulation result */}
                    {simBunk && (
                      <div className="sim-badge" style={{
                        marginTop: "10px", background: "#11102A", border: "1px solid #7B61FF33",
                        borderRadius: "8px", padding: "10px 14px",
                        display: "flex", gap: "18px", flexWrap: "wrap",
                      }}>
                        <div>
                          <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1.5px", marginBottom: "2px" }}>NEW %</div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: simP >= 75 ? "#00D4AA" : "#EF476F" }}>{simP.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1.5px", marginBottom: "2px" }}>SAFE BUNKS LEFT</div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: simSb > 0 ? "#7B61FF" : "#EF476F" }}>{simSb}</div>
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          {simP >= 75 ? (
                            <span style={{ color: "#00D4AA", fontSize: "11px" }}>✓ still safe to bunk</span>
                          ) : (
                            <span style={{ color: "#EF476F", fontSize: "11px" }}>✗ drops below 75%!</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD SUBJECT */}
      {view === "add" && (
        <div style={{ maxWidth: "480px", margin: "40px auto", padding: "0 20px" }}>
          <div style={{
            background: "#111118", border: "1px solid #1E1E2E",
            borderRadius: "16px", padding: "28px",
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "3px", marginBottom: "24px", color: "#7B61FF" }}>NEW SUBJECT</div>

            {[
              { label: "SUBJECT NAME", key: "name", type: "text", placeholder: "e.g. Data Structures" },
              { label: "TOTAL CLASSES", key: "total", type: "number", placeholder: "e.g. 42" },
              { label: "CLASSES ATTENDED", key: "attended", type: "number", placeholder: "e.g. 35" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>{field.label}</div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{
                    width: "100%", background: "#0D0D1A", border: "1px solid #222",
                    borderRadius: "8px", padding: "10px 14px", color: "#E8E8F0",
                    fontFamily: "inherit", fontSize: "13px",
                  }}
                />
              </div>
            ))}

            {formErr && <div style={{ color: "#EF476F", fontSize: "11px", marginBottom: "14px" }}>⚠ {formErr}</div>}

            <button className="btn-pill" onClick={addSubject} style={{
              width: "100%", background: "#7B61FF", color: "#fff",
              padding: "12px", borderRadius: "10px", fontSize: "12px",
              letterSpacing: "2px", textTransform: "uppercase", fontFamily: "inherit",
            }}>ADD SUBJECT</button>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === "detail" && det && (() => {
        const idx = selectedIdx;
        const p = pct(det.attended, det.total);
        const sb = safeBunks(det.attended, det.total);
        const cn = classesNeeded(det.attended, det.total);
        const danger = det.total > 0 && p < 75;
        return (
          <div style={{ maxWidth: "480px", margin: "0 auto", padding: "28px 20px" }}>
            <button className="btn-pill" onClick={() => setView("dashboard")} style={{
              background: "transparent", color: "#555", fontSize: "12px",
              letterSpacing: "1px", border: "none", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px",
            }}>‹ BACK</button>

            <div style={{
              background: "#111118", border: `1px solid ${det.color}44`,
              borderTop: `3px solid ${det.color}`,
              borderRadius: "16px", padding: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ fontSize: "16px", fontWeight: "500" }}>{det.name}</div>
                <button onClick={() => deleteSubject(idx)} style={{
                  background: "transparent", border: "none", color: "#333",
                  cursor: "pointer", fontSize: "14px",
                }} title="Delete">🗑</button>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px", color: p >= 75 ? "#00D4AA" : p >= 65 ? "#FFD166" : "#EF476F", lineHeight: 1 }}>
                {det.total === 0 ? "--" : p.toFixed(2) + "%"}
              </div>
              <div style={{ fontSize: "12px", color: "#555", margin: "6px 0 16px" }}>{det.attended} attended / {det.total} total</div>

              {/* Progress */}
              <div style={{ background: "#0D0D1A", borderRadius: "4px", height: "8px", overflow: "hidden", marginBottom: "4px" }}>
                <div className="progress-bar" style={{
                  width: `${Math.min(p, 100)}%`, height: "100%",
                  background: p >= 75 ? det.color : p >= 65 ? "#FFD166" : "#EF476F",
                  borderRadius: "4px",
                }} />
              </div>
              <div style={{ position: "relative", height: "16px", marginBottom: "20px" }}>
                <div style={{ position: "absolute", left: "75%", width: "1px", height: "8px", background: "#7B61FF" }} />
                <div style={{ position: "absolute", left: "75%", top: "8px", fontSize: "9px", color: "#7B61FF", transform: "translateX(-50%)" }}>75% required</div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "SAFE BUNKS LEFT", value: sb, color: sb > 0 ? "#00D4AA" : "#EF476F", show: !danger },
                  { label: "CLASSES TO RECOVER", value: cn, color: "#EF476F", show: danger },
                  { label: "CLASSES ATTENDED", value: det.attended, color: det.color, show: true },
                  { label: "TOTAL CONDUCTED", value: det.total, color: "#888", show: true },
                ].filter(x => x.show).map(stat => (
                  <div key={stat.label} style={{ background: "#0D0D1A", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "9px", color: "#444", letterSpacing: "1.5px", marginBottom: "4px" }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Alert */}
              {danger ? (
                <div style={{ background: "#1A0A0F", border: "1px solid #EF476F44", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px", color: "#EF476F" }}>
                  ⚠ You're in the danger zone. Attend {cn} more class{cn !== 1 ? "es" : ""} to hit 75%.
                </div>
              ) : sb <= 2 && sb >= 0 ? (
                <div style={{ background: "#1A1200", border: "1px solid #FFD16644", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px", color: "#FFD166" }}>
                  ⚡ Getting close — only {sb} safe bunk{sb !== 1 ? "s" : ""} remaining.
                </div>
              ) : (
                <div style={{ background: "#0A1A14", border: "1px solid #00D4AA33", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px", color: "#00D4AA" }}>
                  ✓ You can safely skip {sb} more class{sb !== 1 ? "es" : ""} and stay above 75%.
                </div>
              )}

              {/* Quick Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button className="btn-pill" onClick={() => markAttend(idx)} style={{
                  background: "#003322", color: "#00D4AA",
                  padding: "14px", borderRadius: "10px", fontSize: "12px", letterSpacing: "1px", fontFamily: "inherit",
                }}>✓ ATTENDED</button>
                <button className="btn-pill" onClick={() => markBunk(idx)} style={{
                  background: "#1A0A12", color: "#EF476F",
                  padding: "14px", borderRadius: "10px", fontSize: "12px", letterSpacing: "1px", fontFamily: "inherit",
                }}>✗ BUNKED</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
