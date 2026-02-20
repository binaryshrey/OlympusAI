"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Camera, Mic, AlertCircle } from "lucide-react";
import { upsertProject } from "../../lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface OnboardFormProps {
  user: User;
}

export default function OnboardForm({ user }: OnboardFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "permissions">("form");
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectName: "",
    jiraId: "SCRUM",
    targetPlatform: "",
    intendedUsers: "",
    timeline: "",
    description: "",
    duration: "1 minute",
    language: "English",
  });

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

  const handleContinueToPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.projectName.trim()) {
        throw new Error("Project name is required");
      }
      if (!formData.jiraId.trim()) {
        throw new Error("Jira Board ID is required");
      }
      if (!formData.targetPlatform) {
        throw new Error("Target Platform is required");
      }
      if (!formData.intendedUsers) {
        throw new Error("Intended Users is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Project description is required");
      }

      setStep("permissions");

      setTimeout(() => {
        requestMicrophonePermission();
        requestCameraPermission();
      }, 500);
    } catch (error) {
      console.error("Error during setup:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);

    try {
      // Save to Supabase
      const projectData = {
        user_id: user.id,
        user_email: user.email,
        project_name: formData.projectName,
        jira_id: formData.jiraId,
        target_platform: formData.targetPlatform,
        intended_users: formData.intendedUsers,
        description: formData.description,
        duration: formData.duration,
        language: formData.language,
      };

      const savedProject = await upsertProject(projectData);
      console.log("[Onboard] Project saved to database:", savedProject);

      // Store form data and project ID in sessionStorage for the summary page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "onboard_form_data",
          JSON.stringify({
            projectId: savedProject.id,
            projectName: formData.projectName,
            jiraId: formData.jiraId,
            targetPlatform: formData.targetPlatform,
            intendedUsers: formData.intendedUsers,
            description: formData.description,
            duration: formData.duration,
            language: formData.language,
          }),
        );
        console.log("[Onboard] Saved form data to sessionStorage");
      }

      toast.success("Project saved successfully!");

      // Navigate to meeting page with project ID
      setTimeout(() => {
        router.push(`/meeting/${savedProject.id}`);
      }, 1000);
    } catch (err) {
      console.error("[Onboard] Failed to save project:", err);
      toast.error("Failed to save project. Please try again.");
      setIsLoading(false);
    }
  };

  const allPermissionsGranted =
    micPermission === "granted" && cameraPermission === "granted";

  if (step === "permissions") {
    return (
      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Setup Your Devices
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              We need access to your microphone and camera for a seamless
              meeting with our AI Product Manager.
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
              onClick={() => {
                cleanupStreams();
                setStep("form");
                setMicPermission("pending");
                setCameraPermission("pending");
              }}
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

  return (
    <div className=" space-y-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nebula AI Orchestry Setup
        </h1>
        <p className="text-gray-600">
          Tell us about your project so our AI Product Manager can orchestrate
          end-to-end software delivery for you.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Configuration Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Configuration
            </h2>
            <p className="text-sm text-gray-600">
              Configure your project details to collaborate with our AI Product
              Manager
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="180">3 minutes</option>
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="English">🇺🇸 English</option>
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="French">🇫🇷 French</option>
                <option value="German">🇩🇪 German</option>
                <option value="Hindi">🇮🇳 Hindi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="projectName"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                required
                value={formData.projectName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="Enter your project name"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="jiraId"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Jira Board ID <span className="text-red-500">*</span>
              </label>
              <input
                id="jiraId"
                type="text"
                required
                value={formData.jiraId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Enter your Jira Board ID"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="targetPlatform"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Target Platform <span className="text-red-500">*</span>
              </label>
              <select
                id="targetPlatform"
                required
                value={formData.targetPlatform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetPlatform: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select target platform</option>
                <option value="Web Application">Web Application</option>
                <option value="Mobile (iOS)">Mobile (iOS)</option>
                <option value="Mobile (Android)">Mobile (Android)</option>
                <option value="Desktop Application">Desktop Application</option>
                <option value="Backend API">Backend API</option>
                <option value="Full Stack">Full Stack</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="intendedUsers"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Intended Users <span className="text-red-500">*</span>
              </label>
              <select
                id="intendedUsers"
                required
                value={formData.intendedUsers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    intendedUsers: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select intended users</option>
                <option value="Internal Team">Internal Team</option>
                <option value="Enterprise Clients">Enterprise Clients</option>
                <option value="General Public">General Public</option>
                <option value="Developers">Developers</option>
                <option value="Business Users">Business Users</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              What do you want to build? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              placeholder="Describe your functional and non-functional requirements here..."
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleContinueToPermissions}
        disabled={isLoading}
        className="w-full px-6 py-4 text-base bg-black text-white font-semibold rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
            Processing...
          </>
        ) : (
          "Continue to Device Setup"
        )}
      </button>
    </div>
  );
}
