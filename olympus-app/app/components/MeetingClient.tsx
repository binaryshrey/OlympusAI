"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import { createClient, AnamClient } from "@anam-ai/js-sdk";
import { connectElevenLabs, stopElevenLabs } from "../../lib/elevenlabs";

interface Config {
  anamSessionToken: string;
  elevenLabsAgentId: string;
  error?: string;
}

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface MeetingClientProps {
  autoStart?: boolean;
  duration?: number;
  user: any;
  projectId: string;
}

export default function MeetingClient({
  autoStart = false,
  duration = 2,
  user,
  projectId,
}: MeetingClientProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [showVideo, setShowVideo] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [endingMessage, setEndingMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const anamClientRef = useRef<AnamClient | null>(null);
  const agentAudioInputStreamRef = useRef<any>(null);
  const configRef = useRef<Config | null>(null);
  const hasInitialized = useRef(false);
  const hasAutoStarted = useRef(false);
  const isIntentionalDisconnectRef = useRef(false);

  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.email.split("@")[0];

  const addMessage = (role: "user" | "agent" | "system", text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setIsLoading(true);
    isIntentionalDisconnectRef.current = false;

    try {
      if (
        !configRef.current ||
        !anamClientRef.current ||
        !agentAudioInputStreamRef.current
      ) {
        throw new Error("Session not initialized. Please refresh the page.");
      }

      console.log("[ElevenLabs] Connecting...");

      await connectElevenLabs(configRef.current.elevenLabsAgentId, {
        onReady: () => {
          setIsConnected(true);
          addMessage(
            "system",
            "Connected. Share your project requirements with the AI PM.",
          );
        },
        onAudio: (audio: string) => {
          agentAudioInputStreamRef.current?.sendAudioChunk(audio);
        },
        onUserTranscript: (text: string) => addMessage("user", text),
        onAgentTranscript: (text: string) => addMessage("agent", text),
        onDisconnect: () => {
          if (!isIntentionalDisconnectRef.current) {
            console.log("[ElevenLabs] Unexpected disconnect");
            showError("Connection lost. Please try again.");
          }
          setIsConnected(false);
        },
        onError: (err: Error) => {
          console.error("[ElevenLabs] Error:", err);
          showError(err.message);
          setIsConnected(false);
        },
      });
    } catch (err) {
      console.error("[Meeting] Start error:", err);
      showError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    isIntentionalDisconnectRef.current = true;
    setIsEnding(true);
    setEndingMessage("Ending meeting...");

    stopElevenLabs();

    if (anamClientRef.current) {
      try {
        await anamClientRef.current.stopStreaming();
        console.log("[Meeting] Anam streaming stopped");
      } catch (err) {
        console.error("[Meeting] Error stopping Anam:", err);
      }
    }

    setShowVideo(false);
    setIsConnected(false);
    setEndingMessage("Saving your meeting...");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setEndingMessage("Preparing your summary...");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[Meeting] Navigating to summary page");
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "meeting_conversation",
          JSON.stringify(messages),
        );
        console.log("[Meeting] Saved conversation to sessionStorage");
      }
    } catch (err) {
      console.error("[Meeting] Failed to save conversation:", err);
    }

    router.push(`/summary/${projectId}`);
  };

  const handleToggle = () => {
    if (isConnected) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const getMessageLabel = (role: string) => {
    switch (role) {
      case "user":
        return "You";
      case "agent":
        return "AI PM";
      default:
        return "•";
    }
  };

  // Initialize Anam session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (hasInitialized.current) {
        console.log("[Meeting] Already initialized, skipping...");
        return;
      }

      console.log("[Meeting] Initializing session...");
      hasInitialized.current = true;

      try {
        if (anamClientRef.current) {
          try {
            console.log("[Meeting] Cleaning up existing session...");
            await anamClientRef.current.stopStreaming();
            anamClientRef.current = null;
          } catch (err) {
            console.error("[Meeting] Error cleaning up:", err);
          }
        }

        console.log("[Meeting] Fetching config from /api/meeting...");
        const res = await fetch("/api/meeting");
        const config: Config = await res.json();

        if (!res.ok) {
          throw new Error(config.error || "Failed to get config");
        }

        console.log("[Meeting] Initializing avatar...");

        const anamClient = createClient(config.anamSessionToken, {
          disableInputAudio: true,
        });

        if (videoRef.current) {
          await anamClient.streamToVideoElement(videoRef.current.id);
          console.log("[Meeting] Avatar ready");
        }

        const agentAudioInputStream = anamClient.createAgentAudioInputStream({
          encoding: "pcm_s16le",
          sampleRate: 16000,
          channels: 1,
        });

        anamClientRef.current = anamClient;
        agentAudioInputStreamRef.current = agentAudioInputStream;
        configRef.current = config;
        setShowVideo(true);

        console.log("[Meeting] Session initialized");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error("[Meeting] Initialization error:", err);
        showError(err instanceof Error ? err.message : "Failed to initialize");
        hasInitialized.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (
      autoStart &&
      !hasAutoStarted.current &&
      !isConnected &&
      !isLoading &&
      !isInitializing &&
      hasInitialized.current
    ) {
      console.log("[Meeting] Auto-starting meeting...");
      hasAutoStarted.current = true;
      setTimeout(() => {
        handleStart();
      }, 500);
    }
  }, [autoStart, isInitializing, isConnected, isLoading]);

  // Initialize user camera
  useEffect(() => {
    const initUserCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        userStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("[Camera] Failed to access user camera:", err);
      }
    };

    initUserCamera();

    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Countdown timer effect
  useEffect(() => {
    if (!isConnected || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleStop();
          addMessage("system", "Time's up. Meeting has ended!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isIntentionalDisconnectRef.current = true;
      stopElevenLabs();
      if (anamClientRef.current) {
        anamClientRef.current.stopStreaming();
      }
      hasInitialized.current = false;
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "#000" }}
    >
      <div className="absolute top-0 left-0 right-0 z-50 px-6 pt-4 lg:px-8">
        <nav className="flex flex-col items-center gap-2">
          <div className="w-full flex items-center justify-between">
            <a href="/dashboard" className="-m-1.5 p-1.5">
              <img
                className="h-8 drop-shadow-lg"
                src="/logodark.svg"
                alt="Nebula AI"
              />
            </a>
            <ProfileMenu user={user} />
          </div>
          <h1 className="text-white text-3xl font-medium">
            Nebula AI Product Manager Meeting
          </h1>

          <div className="flex items-center gap-4 mt-1">
            <p className="text-white/80 text-sm">
              Hello, {userName}! Your meeting ends in
            </p>

            {isConnected && (
              <div className="z-40">
                <div
                  className="bg-white/5 backdrop-blur-2xl border border-white/30 rounded-xl px-4 py-2 shadow-2xl"
                  style={{
                    boxShadow:
                      "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white font-semibold tabular-nums">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {isEnding && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg mt-6 font-medium">{endingMessage}</p>
          <p className="text-white/60 text-sm mt-2">Please wait...</p>
        </div>
      )}

      {isInitializing && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg mt-6 font-medium">
            Initializing Session
          </p>
          <p className="text-white/60 text-sm mt-2">
            Preparing your AI Product Manager
          </p>
        </div>
      )}

      {isLoading && !isInitializing && (
        <div className="absolute inset-0 bg-black/50 z-40 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg mt-4 font-medium">
            Starting Meeting...
          </p>
          <p className="text-white/60 text-sm mt-2">Get ready!</p>
        </div>
      )}

      {error && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-lg border border-red-600 rounded-lg px-6 py-3 max-w-md">
          <p className="text-white text-sm font-medium">{error}</p>
        </div>
      )}

      <div
        className="relative w-full max-w-5xl aspect-video bg-black"
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        <video
          ref={videoRef}
          id="anam-video-meeting"
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
      </div>

      <div className="absolute bottom-6 left-6 max-w-md w-full max-h-64 overflow-hidden">
        <div
          ref={transcriptRef}
          className="bg-white/5 backdrop-blur-2xl border border-white/30 rounded-xl p-4 space-y-2 overflow-y-auto max-h-64 shadow-2xl"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.4) transparent",
            boxShadow:
              "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {messages.length === 0 ? (
            <p className="text-white/60 text-xs">
              Conversation will appear here.
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="animate-fade-in">
                <span
                  className={`font-semibold ${
                    msg.role === "user"
                      ? "text-blue-400"
                      : msg.role === "agent"
                        ? "text-green-400"
                        : "text-white/60"
                  }`}
                >
                  {getMessageLabel(msg.role)}:
                </span>{" "}
                <span className="text-white/90 text-sm">{msg.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 w-64 h-40 overflow-hidden">
        <div
          className="relative w-full h-full bg-gray-900 border-2 border-white/30 shadow-2xl"
          style={{ borderRadius: "12px" }}
        >
          <video
            ref={userVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ borderRadius: "10px" }}
          />
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-white/90 text-xs font-medium">You</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="px-10 py-3 rounded-full font-semibold text-white shadow-2xl transition-all transform flex items-center gap-3 cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: isLoading
              ? "#6b7280"
              : isConnected
                ? "#dc2626"
                : "#10b981",
          }}
        >
          {isLoading ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Connecting...</span>
            </>
          ) : isConnected ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h12v12H6z" />
              </svg>
              <span>End Meeting</span>
            </>
          ) : (
            <>
              <span>Begin Meeting</span>
            </>
          )}
        </button>
      </div>

      {isConnected && showVideo && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 bg-green-500 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 20}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
