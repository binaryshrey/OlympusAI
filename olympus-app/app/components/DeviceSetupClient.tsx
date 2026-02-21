"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Camera, Mic } from "lucide-react";

export default function DeviceSetupClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [micPermission, setMicPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [cameraPermission, setCameraPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeout(() => {
      requestMicrophonePermission();
      requestCameraPermission();
    }, 500);

    return () => {
      cleanupStreams();
    };
  }, []);

  useEffect(() => {
    if (cameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = cameraStream;
      videoPreviewRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    }
  }, [cameraStream]);

  const cleanupStreams = () => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setMicPermission("granted");

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermission("denied");
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setCameraPermission("granted");

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        try {
          await videoPreviewRef.current.play();
        } catch (playError) {
          console.error("Error playing video:", playError);
        }
      }
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermission("denied");
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    cleanupStreams();
    router.push("/meeting");
  };

  const allPermissionsGranted =
    micPermission === "granted" && cameraPermission === "granted";

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Setup Your Devices
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            We need access to your microphone and camera for a seamless meeting
            with our AI Product Manager.
          </p>
        </div>

        <div className="space-y-6">
          {/* Microphone Check */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    micPermission === "granted"
                      ? "bg-green-100"
                      : micPermission === "denied"
                        ? "bg-red-100"
                        : "bg-gray-100"
                  }`}
                >
                  <Mic
                    className={`w-6 h-6 ${
                      micPermission === "granted"
                        ? "text-green-600"
                        : micPermission === "denied"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Microphone</h3>
                  <p className="text-sm text-gray-600">
                    {micPermission === "granted" && "Working perfectly!"}
                    {micPermission === "denied" && "Permission denied"}
                    {micPermission === "pending" && "Requesting access..."}
                  </p>
                </div>
              </div>
              {micPermission === "granted" && (
                <Check className="w-6 h-6 text-green-600" />
              )}
              {micPermission === "denied" && (
                <X className="w-6 h-6 text-red-600" />
              )}
            </div>

            {micPermission === "granted" && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Audio Level</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{
                      width: `${Math.min((audioLevel / 128) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Speak to test your microphone
                </p>
              </div>
            )}

            {micPermission === "denied" && (
              <button
                onClick={requestMicrophonePermission}
                className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                Try Again
              </button>
            )}
          </div>

          {/* Camera Check */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    cameraPermission === "granted"
                      ? "bg-green-100"
                      : cameraPermission === "denied"
                        ? "bg-red-100"
                        : "bg-gray-100"
                  }`}
                >
                  <Camera
                    className={`w-6 h-6 ${
                      cameraPermission === "granted"
                        ? "text-green-600"
                        : cameraPermission === "denied"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Camera</h3>
                  <p className="text-sm text-gray-600">
                    {cameraPermission === "granted" && "Working perfectly!"}
                    {cameraPermission === "denied" && "Permission denied"}
                    {cameraPermission === "pending" && "Requesting access..."}
                  </p>
                </div>
              </div>
              {cameraPermission === "granted" && (
                <Check className="w-6 h-6 text-green-600" />
              )}
              {cameraPermission === "denied" && (
                <X className="w-6 h-6 text-red-600" />
              )}
            </div>

            {cameraPermission === "granted" && (
              <div className="mt-4">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video bg-gray-900 rounded-lg max-h-120 object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <p className="text-xs text-gray-500 mt-2">Camera preview</p>
              </div>
            )}

            {cameraPermission === "denied" && (
              <button
                onClick={requestCameraPermission}
                className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push("/onboard-team")}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm font-semibold"
          >
            Back
          </button>
          <button
            onClick={handleStart}
            disabled={!allPermissionsGranted || isLoading}
            className="cursor-pointer flex-1 px-4 py-3 bg-black text-white rounded-md text-sm font-semibold disabled:opacity-50"
          >
            {isLoading && (
              <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
            )}
            {isLoading ? "Starting..." : "Start Meeting"}
          </button>
        </div>

        {!allPermissionsGranted && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Please grant both microphone and camera permissions to continue
          </p>
        )}
      </div>
    </div>
  );
}
