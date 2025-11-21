"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import Vapi from "@vapi-ai/web";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vapi, setVapi] = useState<any>(null);
  const [lastMessage, setLastMessage] = useState<string>("");

  // Initialize VAPI
  useEffect(() => {
    const client = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY!);
    setVapi(client);

    return () => {
      client.stop();
    };
  }, []);

  // Subscribe to events
  useEffect(() => {
    if (!vapi) return;

    const handleCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const handleCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);
    const handleMessage = (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setMessages((prev) => [...prev, { role: msg.role, content: msg.transcript }]);
      }
    };
    const handleError = (err: any) => console.error("VAPI Error:", err);

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
    };
  }, [vapi]);

  useEffect(() => {
    if (messages.length > 0) setLastMessage(messages[messages.length - 1].content);
  }, [messages]);

  // Handle feedback
  useEffect(() => {
    const handleGenerateFeedback = async () => {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });
      if (success && id) router.push(`/interview/${interviewId}/feedback`);
      else router.push("/");
    };

    if (callStatus === CallStatus.FINISHED) {
      type === "generate" ? router.push("/") : handleGenerateFeedback();
    }
  }, [callStatus, messages]);

  const handleCall = async () => {
    if (!vapi) return;

    setCallStatus(CallStatus.CONNECTING);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vapi.attachMicrophone(stream);
    } catch (err) {
      console.error("Mic access denied:", err);
      setCallStatus(CallStatus.INACTIVE);
      return;
    }

    try {
      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!);
      } else {
        const formattedQuestions = questions?.map((q) => `- ${q}`).join("\n") || "";
        await vapi.start(interviewer, { variableValues: { questions: formattedQuestions } });
      }
    } catch (err) {
      console.error("VAPI start error:", err);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    vapi?.stop();
    setCallStatus(CallStatus.FINISHED);
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="AI" width={65} height={54} />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image src="/user-avatar.png" alt="User" width={120} height={120} className="rounded-full object-cover"/>
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p key={lastMessage} className={cn("transition-opacity duration-500 opacity-0","animate-fadeIn opacity-100")}>
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-4">
        {callStatus !== CallStatus.ACTIVE ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span className={cn("absolute animate-ping rounded-full opacity-75", callStatus !== CallStatus.CONNECTING && "hidden")} />
            <span className="relative">{callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? "Call" : ". . ."}</span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>End</button>
        )}
      </div>
    </>
  );
};

export default Agent;
