import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000";

function useScramble(target, trigger) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!target || target === "—") return;
    const chars = "0123456789";
    let iteration = 0;
    const final = String(target);
    const interval = setInterval(() => {
      setDisplay(
        final.split("").map((char, i) => {
          if (i < iteration) return char;
          if (char === "." || char === "$" || char === "," || char === "B") return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      iteration += 0.4;
      if (iteration >= final.length) { setDisplay(final); clearInterval(interval); }
    }, 35);
    return () => clearInterval(interval);
  }, [target, trigger]);
  return display;
}

function StockCard({ tk, d }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const price = useScramble(d?.current_price ? `$${d.current_price}` : null, visible);
  const mcap = useScramble(d?.market_cap_bn ? `$${d.market_cap_bn}B` : null, visible);
  const eps = useScramble(d?.eps ? String(d.eps) : null, visible);
  const pe = useScramble(d?.pe_ratio ? (+d.pe_ratio).toFixed(1) : null, visible);
  const isBuy = d?.recommendation === "buy" || d?.recommendation === "strong buy";

  return (
    <div ref={ref} style={p.stockCard}>
      <div style={p.stockTop}>
        <span style={p.stockTicker}>{tk}</span>
        <span style={{ ...p.stockBadge, background: isBuy ? "#e8f5e9" : "#fff3e0", color: isBuy ? "#2e7d32" : "#e65100" }}>
          {d?.recommendation?.toUpperCase() || "loading"}
        </span>
      </div>
      <div style={p.stockCompany}>{d?.company || "Loading..."}</div>
      <div style={p.stockPrice}>{price}</div>
      <div style={p.stockMeta}>
        <div><div style={p.metaLabel}>Market Cap</div><div style={p.metaVal}>{mcap}</div></div>
        <div><div style={p.metaLabel}>EPS</div><div style={p.metaVal}>{eps}</div></div>
        <div><div style={p.metaLabel}>P/E</div><div style={p.metaVal}>{pe}</div></div>
      </div>
    </div>
  );
}

function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let prog = 0;
    const t = setInterval(() => {
      prog += 3;
      setProgress(prog);
      if (prog >= 100) { clearInterval(t); setTimeout(onDone, 300); }
    }, 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={ls.wrap}>
      <div style={ls.inner}>
        <div style={ls.logo}>◈</div>
        <div style={ls.name}>FinSight AI</div>
        <div style={ls.sub}>Financial Intelligence Platform</div>
        <div style={ls.barWrap}><div style={{ ...ls.bar, width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}

const ls = {
  wrap: { position: "fixed", inset: 0, background: "#fff8f5", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  inner: { textAlign: "center" },
  logo: { fontSize: 52, color: "#f89880", marginBottom: 12 },
  name: { fontSize: 32, fontWeight: 700, color: "#1a0a00", fontFamily: "'Georgia', serif", marginBottom: 4 },
  sub: { fontSize: 12, color: "#c4815a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 32 },
  barWrap: { width: 200, height: 2, background: "#fed8b1", borderRadius: 2, margin: "0 auto", overflow: "hidden" },
  bar: { height: "100%", background: "linear-gradient(90deg, #f89880, #fed8b1)", transition: "width 0.1s" },
};

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [stocks, setStocks] = useState({});
  const [question, setQuestion] = useState("");
  const [ticker, setTicker] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const resRef = useRef();

  useEffect(() => {
    ["AAPL", "MSFT", "NVDA", "TSLA"].forEach(async (t) => {
      try {
        const r = await axios.get(`${API}/stock/${t}`);
        setStocks(prev => ({ ...prev, [t]: r.data }));
      } catch {}
    });
  }, []);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const r = await axios.post(`${API}/ask`, { question, ticker: ticker.trim().toUpperCase() || "" });
      setAnswer({ text: r.data.answer, route: r.data.route });
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setAnswer({ text: "Could not reach the API. Make sure the backend is running.", route: null });
    }
    setLoading(false);
  };

  if (!loaded) return <LoadingScreen onDone={() => setLoaded(true)} />;

  return (
    <div style={p.page}>
      {/* NAV */}
      <nav style={p.nav}>
        <div style={p.navBrand}>
          <span style={p.navLogo}>◈</span>
          <span style={p.navName}>FinSight AI</span>
        </div>
        <div style={p.navLinks}>
          {["Markets", "Research", "Company Analysis", "SEC Filings"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} style={p.navLink}>{l}</a>
          ))}
        </div>
        <a href="#research" style={p.navCta}>Try Free →</a>
      </nav>

      {/* HERO */}
      <section style={p.hero}>
        <div style={p.heroPill}>AI-Powered · Real-Time · Intelligent</div>
        <h1 style={p.heroTitle}>Research any company.<br /><span style={p.heroAccent}>Instantly.</span></h1>
        <p style={p.heroDesc}>FinSight AI combines live market data, SEC filing analysis, and LLaMA 3.3 to give you professional-grade financial intelligence in seconds.</p>
        <div style={p.heroActions}>
          <a href="#research" style={p.btnPrimary}>Start Researching →</a>
          <a href="#markets" style={p.btnOutline}>View Live Markets</a>
        </div>
        <div style={p.heroStats}>
          {[["Live Data", "Any listed stock"], ["AI Model", "LLaMA 3.3 70B"], ["SEC Filings", "RAG-powered"]].map(([n, l]) => (
            <div key={n} style={p.heroStat}>
              <div style={p.heroStatNum}>{n}</div>
              <div style={p.heroStatLabel}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={p.divider} />

      {/* MARKETS */}
      <section id="markets" style={p.section}>
        <div style={p.sectionTag}>Live Markets</div>
        <h2 style={p.sectionTitle}>Real-time market intelligence.</h2>
        <p style={p.sectionDesc}>Live prices and metrics for the world's most tracked stocks, updated in real time.</p>
        <div style={p.stockGrid}>
          {["AAPL", "MSFT", "NVDA", "TSLA"].map(tk => (
            <StockCard key={tk} tk={tk} d={stocks[tk]} />
          ))}
        </div>
      </section>

      <div style={p.divider} />

      {/* HOW IT WORKS */}
      <section style={p.section}>
        <div style={p.sectionTag}>How It Works</div>
        <h2 style={p.sectionTitle}>Three agents. One answer.</h2>
        <div style={p.steps}>
          {[
            { n: "01", title: "You ask a question", desc: "Type any financial question — about revenue, risks, stock price, management commentary, or market trends." },
            { n: "02", title: "Router decides", desc: "A LLaMA-powered router decides whether to fetch live market data, search SEC filings, or combine both sources." },
            { n: "03", title: "You get an answer", desc: "A structured, cited answer is returned in seconds — sourced from live yfinance data or indexed 10-K filings." },
          ].map(s => (
            <div key={s.n} style={p.step}>
              <div style={p.stepNum}>{s.n}</div>
              <div style={p.stepTitle}>{s.title}</div>
              <div style={p.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={p.divider} />

      {/* AI RESEARCH */}
      <section id="research" style={p.section}>
        <div style={p.sectionTag}>AI Research</div>
        <h2 style={p.sectionTitle}>Ask anything. Get answers.</h2>
        <p style={p.sectionDesc}>Powered by LLaMA 3.3 70B with live market data and SEC filing context.</p>
        <div style={p.researchBox}>
          <div style={p.suggestions}>
            {["What is Apple's revenue?", "NVIDIA risk factors", "Tesla stock price", "Microsoft vs Apple margins"].map(s => (
              <button key={s} style={p.suggChip} onClick={() => setQuestion(s)}>{s}</button>
            ))}
          </div>
          <div style={p.inputRow}>
            <input style={p.input} placeholder="Ask a financial question..." value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()} />
            <input style={p.tickerInput} placeholder="Ticker e.g. AAPL" value={ticker} onChange={e => setTicker(e.target.value)} />
            <button style={p.btnPrimary} onClick={ask} disabled={loading}>{loading ? "..." : "Ask →"}</button>
          </div>
          {answer && (
            <div ref={resRef} style={p.answerBox}>
              {answer.route && <div style={p.routeTag}>→ {answer.route.toUpperCase()}</div>}
              <div style={p.answerText}>{answer.text}</div>
            </div>
          )}
        </div>
      </section>

      <div style={p.divider} />

      {/* FEATURES */}
      <section style={p.section}>
        <div style={p.sectionTag}>Capabilities</div>
        <h2 style={p.sectionTitle}>Everything financial research needs.</h2>
        <div style={p.featGrid}>
          {[
            { icon: "📈", title: "Live Market Data", desc: "Real-time prices, P/E ratios, market cap, EPS, and analyst recommendations for any listed stock globally." },
            { icon: "📄", title: "SEC Filing Analysis", desc: "RAG pipeline over 10-K filings. Ask about risk factors, revenue drivers, and management commentary." },
            { icon: "🤖", title: "Multi-Agent Router", desc: "LLaMA 3.3 automatically routes your question to the right data source — live data, documents, or both." },
            { icon: "🌍", title: "Global Coverage", desc: "Works for NYSE, NASDAQ, NSE, BSE stocks. Just add .NS for Indian stocks like TCS.NS or RELIANCE.NS." },
            { icon: "📊", title: "Financial Analytics", desc: "Power BI dashboard with revenue trends, gross margins, and EPS comparisons across Apple, NVIDIA, and Microsoft." },
            { icon: "⚡", title: "Instant Answers", desc: "Powered by Groq's LPU inference — the fastest LLaMA inference available, answers in under 2 seconds." },
          ].map(f => (
            <div key={f.title} style={p.featCard}>
              <div style={p.featIcon}>{f.icon}</div>
              <div style={p.featTitle}>{f.title}</div>
              <div style={p.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={p.divider} />

      {/* TECH STACK */}
      <section style={{ ...p.section, textAlign: "center" }}>
        <div style={p.sectionTag}>Tech Stack</div>
        <h2 style={p.sectionTitle}>Built on modern AI infrastructure.</h2>
        <div style={p.techRow}>
          {["LangChain", "ChromaDB", "Groq", "LLaMA 3.3 70B", "FastAPI", "yfinance", "React", "Power BI"].map(t => (
            <div key={t} style={p.techChip}>{t}</div>
          ))}
        </div>
      </section>

      <div style={p.divider} />

      {/* FOOTER */}
      <footer style={p.footer}>
        <div style={p.footerBrand}>
          <span style={p.navLogo}>◈</span>
          <span style={{ ...p.navName, fontSize: 20 }}>FinSight AI</span>
        </div>
        <div style={p.footerDesc}>An AI-powered financial research platform built with LangChain, Groq, and FastAPI.</div>
        <div style={p.footerMeta}>Built by Aisna · BITS Pilani, Hyderabad · 2025</div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', sans-serif; background: #fff8f5; }
        a { text-decoration: none; }
        html { scroll-behavior: smooth; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const p = {
  page: { background: "#fff8f5", color: "#1a0a00", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" },
  nav: { position: "sticky", top: 0, background: "rgba(255,248,245,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #fed8b1", padding: "16px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 },
  navBrand: { display: "flex", alignItems: "center", gap: 10 },
  navLogo: { fontSize: 28, color: "#f89880" },
  navName: { fontSize: 18, fontWeight: 700, color: "#1a0a00", fontFamily: "'DM Serif Display', serif" },
  navLinks: { display: "flex", gap: 32 },
  navLink: { fontSize: 14, color: "#7a4030", fontWeight: 500 },
  navCta: { background: "#f89880", color: "#fff", padding: "8px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600 },
  hero: { padding: "100px 64px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.6s ease" },
  heroPill: { display: "inline-block", background: "#fed8b1", color: "#c4501a", fontSize: 11, padding: "5px 14px", borderRadius: 20, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 },
  heroTitle: { fontSize: 60, fontWeight: 400, fontFamily: "'DM Serif Display', serif", color: "#1a0a00", lineHeight: 1.15, margin: "0 0 20px" },
  heroAccent: { color: "#f89880" },
  heroDesc: { fontSize: 17, color: "#7a4030", lineHeight: 1.8, maxWidth: 560, margin: "0 auto 32px" },
  heroActions: { display: "flex", gap: 14, justifyContent: "center", marginBottom: 48 },
  btnPrimary: { background: "#f89880", color: "#fff", border: "none", borderRadius: 28, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnOutline: { background: "transparent", color: "#f89880", border: "1.5px solid #f89880", borderRadius: 28, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  heroStats: { display: "flex", gap: 48, justifyContent: "center" },
  heroStat: { textAlign: "center" },
  heroStatNum: { fontSize: 15, fontWeight: 700, color: "#1a0a00", fontFamily: "'DM Serif Display', serif" },
  heroStatLabel: { fontSize: 12, color: "#b07060", marginTop: 2 },
  divider: { height: 1, background: "#fed8b1", margin: "0 64px" },
  section: { padding: "80px 64px", maxWidth: 1100, margin: "0 auto" },
  sectionTag: { display: "inline-block", background: "#fed8b1", color: "#c4501a", fontSize: 11, padding: "4px 12px", borderRadius: 20, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16, fontWeight: 600 },
  sectionTitle: { fontSize: 40, fontWeight: 400, fontFamily: "'DM Serif Display', serif", color: "#1a0a00", margin: "0 0 12px" },
  sectionDesc: { fontSize: 15, color: "#7a4030", lineHeight: 1.7, maxWidth: 520, marginBottom: 40 },
  stockGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 },
  stockCard: { background: "#fff", border: "1px solid #fed8b1", borderRadius: 14, padding: 22 },
  stockTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  stockTicker: { fontSize: 16, fontWeight: 800, color: "#f89880", fontFamily: "'DM Serif Display', serif" },
  stockBadge: { fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, textTransform: "uppercase" },
  stockCompany: { fontSize: 12, color: "#b07060", marginBottom: 10 },
  stockPrice: { fontSize: 26, fontWeight: 700, color: "#1a0a00", fontFamily: "'DM Serif Display', serif", marginBottom: 14, fontVariantNumeric: "tabular-nums" },
  stockMeta: { display: "flex", justifyContent: "space-between" },
  metaLabel: { fontSize: 10, color: "#c4a090", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 },
  metaVal: { fontSize: 13, color: "#1a0a00", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  steps: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 },
  step: { padding: "28px", background: "#fff", border: "1px solid #fed8b1", borderRadius: 14 },
  stepNum: { fontSize: 28, fontWeight: 700, color: "#f89880", fontFamily: "'DM Serif Display', serif", marginBottom: 12 },
  stepTitle: { fontSize: 17, fontWeight: 600, color: "#1a0a00", marginBottom: 8 },
  stepDesc: { fontSize: 14, color: "#7a4030", lineHeight: 1.7 },
  researchBox: { background: "#fff", border: "1px solid #fed8b1", borderRadius: 16, padding: 32 },
  suggestions: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  suggChip: { background: "#fff8f5", border: "1px solid #fed8b1", color: "#f89880", padding: "7px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 500 },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, background: "#fff8f5", border: "1.5px solid #fed8b1", borderRadius: 10, color: "#1a0a00", padding: "12px 16px", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif" },
  tickerInput: { width: 120, background: "#fff8f5", border: "1.5px solid #fed8b1", borderRadius: 10, color: "#1a0a00", padding: "12px 14px", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif" },
  answerBox: { marginTop: 20, padding: 20, background: "#fff8f5", border: "1px solid #fed8b1", borderRadius: 10 },
  routeTag: { fontSize: 10, color: "#f89880", fontWeight: 700, letterSpacing: "1.5px", marginBottom: 8, textTransform: "uppercase" },
  answerText: { fontSize: 15, color: "#1a0a00", lineHeight: 1.8 },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  featCard: { background: "#fff", border: "1px solid #fed8b1", borderRadius: 14, padding: 24 },
  featIcon: { fontSize: 28, marginBottom: 12 },
  featTitle: { fontSize: 16, fontWeight: 600, color: "#1a0a00", marginBottom: 8, fontFamily: "'DM Serif Display', serif" },
  featDesc: { fontSize: 13, color: "#7a4030", lineHeight: 1.7 },
  techRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 28 },
  techChip: { background: "#fff", border: "1px solid #fed8b1", color: "#c4501a", padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 500 },
  footer: { background: "#fff", borderTop: "1px solid #fed8b1", padding: "48px 64px", textAlign: "center" },
  footerBrand: { display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 12 },
  footerDesc: { fontSize: 14, color: "#7a4030", marginBottom: 8 },
  footerMeta: { fontSize: 12, color: "#c4a090" },
};