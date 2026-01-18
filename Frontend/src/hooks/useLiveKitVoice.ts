import { useState, useCallback, useRef, useEffect } from "react";
import { 
  Room, 
  RoomEvent, 
  Track,
  LocalParticipant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  ParticipantEvent,
  createLocalAudioTrack,
} from "livekit-client";

export type LiveKitVoiceStatus = 
  | "idle" 
  | "connecting"
  | "connected"
  | "listening" 
  | "processing" 
  | "error"
  | "disconnected";

interface UseLiveKitVoiceOptions {
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  onError?: (error: string) => void;
}

export const useLiveKitVoice = (options: UseLiveKitVoiceOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<LiveKitVoiceStatus>("idle");
  const [transcription, setTranscription] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(12).fill(0));
  const [error, setError] = useState<string | null>(null);
  
  const roomRef = useRef<Room | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);

  // Monitor audio levels from microphone
  const monitorAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isListening) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setAudioLevel(normalizedLevel);

    // Create bar levels for visualization
    const barCount = 12;
    const bars = Array.from({ length: barCount }, (_, i) => {
      const startIdx = Math.floor((i * dataArray.length) / barCount);
      const endIdx = Math.floor(((i + 1) * dataArray.length) / barCount);
      const slice = dataArray.slice(startIdx, endIdx);
      const barAvg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      return Math.min(barAvg / 128, 1);
    });
    
    setAudioLevels(bars);

    animationRef.current = requestAnimationFrame(monitorAudioLevels);
  }, [isListening]);

  // Setup audio monitoring
  const setupAudioMonitoring = useCallback(async (track: MediaStreamTrack) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const stream = new MediaStream([track]);
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      localTrackRef.current = track;

      monitorAudioLevels();
    } catch (err) {
      console.error("Error setting up audio monitoring:", err);
    }
  }, [monitorAudioLevels]);

  // Handle incoming transcription data
  const handleDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(payload);
      const data = JSON.parse(text);

      if (data.type === "transcription") {
        const transcriptText = data.text || "";
        setTranscription(transcriptText);
        options.onTranscriptionUpdate?.(transcriptText);

        if (data.is_final) {
          setStatus("processing");
          options.onTranscriptionComplete?.(transcriptText);
        }
      } else if (data.type === "agent_response") {
        // Handle agent response if needed
        console.log("Agent response:", data.text);
      }
    } catch (err) {
      console.error("Error parsing data:", err);
    }
  }, [options]);

  // Connect to LiveKit room
  const connect = useCallback(async () => {
    try {
      setStatus("connecting");
      setError(null);

      // Generate room name
      const roomName = `eureka-intake-${Date.now()}`;
      const identity = `user-${Math.random().toString(36).substring(7)}`;

      // Get token from backend
      const response = await fetch("http://localhost:5000/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, identity }),
      });

      if (!response.ok) {
        throw new Error("Failed to get LiveKit token");
      }

      const { token, url } = await response.json();

      // Create room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log("Connected to room");
        setStatus("connected");
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from room");
        setStatus("disconnected");
        setIsListening(false);
      });

      room.on(RoomEvent.DataReceived, handleDataReceived);

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        console.log("Track subscribed:", track.kind);
      });

      // Connect to the room
      await room.connect(url, token);
      roomRef.current = room;

      // Create and publish local audio track
      const localAudioTrack = await createLocalAudioTrack({
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      });

      await room.localParticipant.publishTrack(localAudioTrack);
      
      // Setup audio monitoring
      const mediaStreamTrack = localAudioTrack.mediaStreamTrack;
      if (mediaStreamTrack) {
        await setupAudioMonitoring(mediaStreamTrack);
      }

      setIsListening(true);
      setStatus("listening");

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect";
      console.error("LiveKit connection error:", err);
      setError(errorMsg);
      setStatus("error");
      options.onError?.(errorMsg);
    }
  }, [handleDataReceived, setupAudioMonitoring, options]);

  // Disconnect from room
  const disconnect = useCallback(async () => {
    try {
      // Stop audio monitoring
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      localTrackRef.current = null;

      // Disconnect room
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
      }

      setIsListening(false);
      setStatus("idle");
      setAudioLevel(0);
      setAudioLevels(new Array(12).fill(0));
      setTranscription("");
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      disconnect();
    } else {
      connect();
    }
  }, [isListening, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isListening,
    status,
    transcription,
    audioLevel,
    audioLevels,
    error,
    connect,
    disconnect,
    toggleListening,
    room: roomRef.current,
  };
};
