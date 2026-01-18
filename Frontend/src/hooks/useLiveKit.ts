import { useState, useEffect, useCallback } from "react";
import {
  Room,
  RoomEvent,
  DataPacket_Kind,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from "livekit-client";

export interface UseLiveKitProps {
  url: string;
  tokenEndpoint: string;
  roomName?: string;
  participantName?: string;
  onTranscription?: (text: string) => void;
}

export const useLiveKit = ({
  url,
  tokenEndpoint,
  roomName = "default-room",
  participantName = "user",
  onTranscription,
}: UseLiveKitProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(
    new Array(5).fill(0)
  );

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        const response = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: roomName,
            participant_name: participantName,
          }),
        });
        const data = await response.json();
        const token = data.token;

        const newRoom = new Room();

        newRoom.on(
          RoomEvent.DataReceived,
          (
            payload: Uint8Array,
            participant?: RemoteParticipant,
            _?: DataPacket_Kind,
            topic?: string
          ) => {
            if (topic === "transcription") {
              const text = new TextDecoder().decode(payload);
              if (onTranscription) {
                onTranscription(text);
              }
            }
          }
        );

        await newRoom.connect(url, token);
        setRoom(newRoom);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect to LiveKit:", error);
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [url, tokenEndpoint, roomName, participantName]);

  const toggleRecording = useCallback(async () => {
    if (!room) return;

    if (isRecording) {
      await room.localParticipant.setMicrophoneEnabled(false);
      setIsRecording(false);
    } else {
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsRecording(true);
    }
  }, [room, isRecording]);

  // Mock audio levels for visualization since we don't have easy access to raw audio data in this simple hook
  useEffect(() => {
    if (!isRecording) {
      setAudioLevels(new Array(5).fill(0));
      return;
    }

    const interval = setInterval(() => {
      setAudioLevels((prev) => prev.map(() => Math.random()));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return {
    isConnected,
    isRecording,
    toggleRecording,
    audioLevels,
  };
};
