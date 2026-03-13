import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Play, Loader2, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Bid { supplier: string; price: number; delivery: string; reliability: number; round: number; }

const initialBids: Bid[] = [
  { supplier: "Reliance Polymers", price: 185, delivery: "3 days", reliability: 96, round: 0 },
  { supplier: "BASF India", price: 192, delivery: "5 days", reliability: 98, round: 0 },
  { supplier: "LG Chem", price: 178, delivery: "7 days", reliability: 94, round: 0 },
  { supplier: "Sabic Materials", price: 188, delivery: "4 days", reliability: 97, round: 0 },
];

export function SupplierAuctionDetail() {
  const [viewState, setViewState] = useState<"setup" | "bidding" | "result">("setup");
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [round, setRound] = useState(0);
  const [winner, setWinner] = useState<Bid | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startAuction = () => { setViewState("bidding"); setBids(initialBids); setRound(0); setWinner(null); };

  useEffect(() => {
    if (viewState !== "bidding") return;
    let r = 0;
    timerRef.current = setInterval(() => {
      r++;
      setRound(r);
      setBids(prev => prev.map(b => ({ ...b, price: Math.max(140, b.price - Math.floor(Math.random() * 6 + 1)), round: r })).sort((a, b) => a.price - b.price));
      if (r >= 8) {
        clearInterval(timerRef.current);
        setBids(prev => { const sorted = [...prev].sort((a, b) => a.price - b.price); setWinner(sorted[0]); return sorted; });
        setTimeout(() => setViewState("result"), 800);
      }
    }, 1200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewState]);

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4"><Users className="w-8 h-8" /></div>
            <h2 className="text-xl font-semibold mb-1">Supplier Reverse Auction</h2>
            <p className="text-sm text-muted-foreground mb-2 max-w-md text-center">Suppliers compete in real-time to offer the lowest raw material price. 8 automated rounds.</p>
            <p className="text-xs text-muted-foreground mb-8">{initialBids.length} suppliers · ABS Resin · 500kg</p>
            <Button onClick={startAuction} className="gap-2 h-11 px-6 rounded-xl"><Play className="w-4 h-4" /> Start Auction</Button>
          </motion.div>
        )}
        {viewState === "bidding" && (
          <motion.div key="bidding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(38,92%,50%/0.1)] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[hsl(38,92%,50%)]" /></div>
              <div><h2 className="text-lg font-semibold">Live Bidding — Round {round}/8</h2><p className="text-xs text-muted-foreground">ABS Resin · 500kg</p></div>
            </div>
            <div className="space-y-2.5">
              {bids.map((b, i) => (
                <motion.div key={b.supplier} layout className={`p-4 rounded-xl border ${i === 0 ? "border-[hsl(142,71%,45%/0.3)] bg-[hsl(142,71%,45%/0.03)]" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">{i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]">LEADING</span>}{b.supplier}</p>
                      <p className="text-xs text-muted-foreground">Delivery: {b.delivery} · Reliability: {b.reliability}%</p>
                    </div>
                    <motion.p key={b.price} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-xl font-bold">₹{b.price}/kg</motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {viewState === "result" && winner && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center py-8 mb-6">
              <div className="w-16 h-16 rounded-full bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center mb-4"><Trophy className="w-8 h-8 text-[hsl(142,71%,45%)]" /></div>
              <h2 className="text-xl font-semibold mb-1">Auction Complete</h2>
              <p className="text-sm text-muted-foreground mb-4">Winner: {winner.supplier} at ₹{winner.price}/kg</p>
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="text-center p-3 rounded-xl bg-[hsl(142,71%,45%/0.05)] border border-[hsl(142,71%,45%/0.2)]"><p className="text-lg font-bold text-[hsl(142,71%,45%)]">₹{winner.price}/kg</p><p className="text-[10px] text-muted-foreground">Final Price</p></div>
                <div className="text-center p-3 rounded-xl bg-muted/30"><p className="text-lg font-bold">₹{(185 - winner.price) * 500}</p><p className="text-[10px] text-muted-foreground">Total Savings</p></div>
                <div className="text-center p-3 rounded-xl bg-muted/30"><p className="text-lg font-bold">{winner.reliability}%</p><p className="text-[10px] text-muted-foreground">Reliability</p></div>
              </div>
            </div>
            <div className="space-y-2">{bids.map((b, i) => (<div key={b.supplier} className={`p-3 rounded-xl border flex items-center justify-between ${i === 0 ? "border-[hsl(142,71%,45%/0.3)] bg-[hsl(142,71%,45%/0.03)]" : "border-border"}`}><div className="flex items-center gap-2"><span className="text-xs font-medium w-5 text-center text-muted-foreground">#{i+1}</span><span className="text-sm font-medium">{b.supplier}</span></div><span className="text-sm font-semibold">₹{b.price}/kg</span></div>))}</div>
            <Button variant="outline" onClick={() => setViewState("setup")} className="w-full mt-6 rounded-xl">Run New Auction</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
