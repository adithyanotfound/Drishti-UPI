"use client";

import { useEffect, useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import type { IDetectedBarcode } from "@yudiel/react-qr-scanner/dist/types/IDetectedBarcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUserByUpi, postPayment } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeftRight, Check, X } from "lucide-react";

function extractUpiIdFromQR(content: string): string | null {
  try {
    const url = new URL(content);
    if (url.protocol.startsWith("upi")) {
      const pa = url.searchParams.get("pa");
      return pa;
    }
  } catch {
    // non-url formats
    const match = content.match(/pa=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export default function ScanPage() {
  const router = useRouter();
  const { signedIn, upiId: myUpi } = useUserStore();
  const [detectedUpi, setDetectedUpi] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualUpi, setManualUpi] = useState("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<"processing" | "success" | "failed">("processing");
  const [overlayAmount, setOverlayAmount] = useState<string>("");
  const [overlayReceiver, setOverlayReceiver] = useState<string>("");

  function playChime() {
    try {
      const w = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctx) return;
  
      const ctx = new Ctx();
      const now = ctx.currentTime;
  
      // This helper now creates a fundamental tone and a quieter harmonic
      const createBellTone = (startTime: number, fundamental: number, volume: number) => {
        const osc1 = ctx.createOscillator(); // Main tone
        const osc2 = ctx.createOscillator(); // Harmonic
        const gain = ctx.createGain();
  
        // --- Volume Envelope (shared for both oscillators) ---
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);
  
        // --- Oscillator 1: Fundamental Tone ---
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(fundamental, startTime);
        osc1.connect(gain);
  
        // --- Oscillator 2: Harmonic (one octave higher, quieter) ---
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(fundamental * 2, startTime); // The harmonic
        // Connect the harmonic through its own gain to make it quieter
        const harmonicGain = ctx.createGain();
        harmonicGain.gain.value = 0.4; // Harmonic is 40% volume of the main tone
        osc2.connect(harmonicGain).connect(gain);
        
        // Connect the main gain to the output
        gain.connect(ctx.destination);
  
        // Schedule playback
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.45);
        osc2.stop(startTime + 0.45);
      };
  
      // --- Create the "Ding Ding" melody ---
      createBellTone(now, 880, 0.3); // A5
      createBellTone(now + 0.2, 1174.66, 0.3); // D6 (a perfect fourth)
  
    } catch (error) {
      console.error("Could not play payment chime:", error);
    }
  }

  useEffect(() => {
    if (overlayPhase === "success") {
      playChime();
    }
  }, [overlayPhase]);

  useEffect(() => {
    if (!signedIn) router.replace("/login");
  }, [signedIn, router]);

  const receiverUpi = manualMode ? manualUpi : detectedUpi || "";
  const username = useMemo(() => {
    if (!receiverUpi) return "";
    return receiverUpi.split("@")[0];
  }, [receiverUpi]);

  async function onConfirm() {
    const value = parseFloat(amount);
    if (!myUpi || !receiverUpi || !Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!receiverUpi.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g., someone@upi)");
      return;
    }
    if (myUpi.trim().toLowerCase() === receiverUpi.trim().toLowerCase()) {
      toast.error("You cannot pay yourself");
      return;
    }
    try {
      // Start overlay in processing phase
      setOverlayAmount(value.toString());
      setOverlayReceiver(recipientName || username || receiverUpi.split("@")[0]);
      setShowOverlay(true);
      setOverlayPhase("processing");

      const res = await postPayment({ sender: myUpi, receiver: receiverUpi, amount: value });
      // Try to use backend-provided username if available
      const backendName = (res && res.receiver && res.receiver.username) || "";
      if (backendName) setOverlayReceiver(backendName);

      setOpen(false);
      setAmount("");
      setManualUpi("");
      setManualMode(false);

      // After 2 seconds, transition to success phase
      setTimeout(() => {
        setOverlayPhase("success");
      }, 2000);
    } catch (e) {
      const message = typeof e === "string" ? e : "Payment failed";
      toast.error(message);
      // Show failed overlay
      if (!showOverlay) {
        setOverlayAmount(value.toString());
        setOverlayReceiver(recipientName || username || receiverUpi.split("@")[0]);
        setShowOverlay(true);
      }
      setOverlayPhase("failed");
    }
  }

  return (
    <div className="pb-20">
      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden border">
          <Scanner
            styles={{ container: { width: "100%" } }}
            onScan={(detected: IDetectedBarcode[]) => {
              const text: string | undefined = detected?.[0]?.rawValue;
              if (!text) return;
              const upi = extractUpiIdFromQR(text);
              if (upi) {
                setDetectedUpi(upi);
                setManualMode(false);
                setOpen(true);
                getUserByUpi(upi).then((info) => setRecipientName(info?.username || ""));
              } else {
                toast("Invalid QR content");
              }
            }}
            onError={(error) => {
              console.error(error);
              toast.error("Scanner error");
            }}
          />
        </div>
        <Button
          className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800"
          onClick={() => {
            setManualMode(true);
            setOpen(true);
          }}
        >
          Enter UPI ID manually
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {manualMode ? "Enter recipient UPI ID" : `Pay to ${recipientName || username}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 min-h-[220px] flex flex-col justify-start">
            {manualMode && (
              <Input
                type="text"
                placeholder="recipient@upi"
                value={manualUpi}
                onChange={(e) => setManualUpi(e.target.value.trim())}
                className="h-12 rounded-xl"
              />
            )}
            {!manualMode && (
              <div className="rounded-xl bg-neutral-100 p-3 text-sm">
                <div className="text-gray-500">Username</div>
                <div className="font-medium">{recipientName || username || '—'}</div>
                <div className="mt-2 text-gray-500">UPI ID</div>
                <div className="font-mono break-all">{detectedUpi}</div>
              </div>
            )}
            <Input
              inputMode="decimal"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                setAmount(v);
              }}
              className="h-12 rounded-xl"
            />
            <Button className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800" onClick={onConfirm}>
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />

      {showOverlay && (
        <div className={`fixed inset-0 z-50 ${overlayPhase === "processing" ? "bg-yellow-700" : overlayPhase === "success" ? "bg-green-600" : "bg-red-600"} text-white flex items-center justify-center transition-colors duration-500`}> 
          {/* Close button (only after success) */}
          {(overlayPhase === "success" || overlayPhase === "failed") && (
            <button
              aria-label="Close"
              className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30"
              onClick={() => {
                setShowOverlay(false);
                router.replace("/dashboard");
              }}
            >
              <X className="text-white" />
            </button>
          )}

          <div className="flex flex-col items-center gap-4 px-6 text-center">
            {overlayPhase === "processing" ? (
              <>
                <ArrowLeftRight size={72} className="text-black/80 animate-slide-lr" />
                <div className="text-lg font-medium animate-pop-in">Processing payment...</div>
              </>
            ) : overlayPhase === "success" ? (
              <>
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md animate-pop-in">
                  <Check size={56} className="text-green-600" />
                </div>
                <div className="text-lg font-semibold animate-pop-in" style={{ animationDelay: '120ms' }}>
                  ₹{overlayAmount} has been paid successfully
                </div>
                <div className="text-sm opacity-90 animate-pop-in" style={{ animationDelay: '240ms' }}>to {overlayReceiver}</div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md animate-pop-in">
                  <X size={56} className="text-red-600" />
                </div>
                <div className="text-lg font-semibold animate-pop-in" style={{ animationDelay: '120ms' }}>
                  Payment failed
                </div>
                <div className="text-sm opacity-90 animate-pop-in" style={{ animationDelay: '240ms' }}>₹{overlayAmount} to {overlayReceiver}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


