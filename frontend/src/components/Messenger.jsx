import React from "react";
import Message from "./Message";
import { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/outline";
import AudioReactRecorder, { RecordState } from "audio-react-recorder";
import axios from "axios";
import base_url from "../constant";

const voiceApi = axios.create({ baseURL: base_url });
const get_time = () => {
  const today = new Date();
  return today.getHours() + ":" + today.getMinutes(); // + ":" + today.getSeconds();
};
export default function Messenger(params) {
  const scrollRef = useRef(); // for auto scrolling
  // conversations stock all conversations
  // TODO: save persistence on disk
  const [conversations, setConversations] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const onSentMessage = (event) => {
    // This function is actioned when user sent message
    event.stopPropagation();

    const message = document.getElementById("input_message").value;
    setConversations([
      ...conversations,
      { id: "user_uttered", text: message, createdAt: get_time() },
    ]);
    document.getElementById("input_message").value = "";
    setUserMessage(message);
  };

  useEffect(() => {
    // Auto scrolling
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  const onPressEnter = (event) => {
    event.stopPropagation();
    if (event.code === "Enter") {
      onSentMessage(event);
    }
  };

  // AUDIO MODULE SCRIPT
  const [recordState, setRecordState] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [displayWave, setDisplayWave] = useState(false);
  const start = () => {
    setDisplayWave(true);
    setRecordState(RecordState.START);
  };
  const pause = () => {
    setRecordState(RecordState.PAUSE);
  };
  const stop = () => {
    setRecordState(RecordState.STOP);
  };
  const onStop = (data) => {
    setAudioData(data);
    setDisplayWave(false);
    setConversations([
      ...conversations,
      { id: "user_uttered", audio: data, createdAt: get_time() },
    ]);
  };

  useEffect(() => {
    let message = { message: userMessage };
    voiceApi
      .post("/message/send", message, {
        headers: {
          "Content-type": "multipart/form-data",
        },
      })
      .then((bot_uttered) => {
        console.log("bot_uttered");
        console.log(bot_uttered.data.bot_uttered);
        setConversations([
          ...conversations,
          {
            id: "bot_uttered",
            text: bot_uttered.data.bot_uttered,
            createdAt: get_time(),
          },
        ]);
      });
  }, [userMessage]);

  useEffect(() => {
    var formData = new FormData();
    if (audioData) {
      formData.append("audio", audioData.blob);
    }
    voiceApi
      .post("/audio/send", formData, {
        headers: {
          "Content-type": "multipart/form-data",
        },
      })
      .then((bot_utter) => {
        setConversations([
          ...conversations,
          {
            id: "bot_uttered",
            text: bot_utter.data.bot_uttered,
            audio: bot_utter.data.audio,
            createdAt: get_time(),
          },
        ]);
      });
  }, [audioData]);

  const hidden = displayWave ? null : "hidden";
  const show = displayWave ? "hidden" : null;

  return (
    <>
      <div className="bg-gray-200 p-5 flex justify-center h-5/6">
        <div className="bg-gray-100 w-1/2 flex flex-col shadow-2xl rounded-xl">
          <div
            id="output_message"
            className="rounded-t-2xl flex-1 overflow-y-scroll scroll-auto p-5"
          >
            {conversations.map(({ id, text, audio, createdAt }, index) => (
              <div ref={scrollRef} key={`${id}-${index}`}>
                <Message
                  text={text}
                  audio={audio}
                  createdAt={createdAt}
                  own={id === "user_uttered"}
                />
              </div>
            ))}
          </div>
          <div className="flex p-3 h-20 bg-slate-500">
            <div className={`flex flex-1 ${show}`}>
              <input
                id="input_message"
                className="w-full p-3 flex-1 rounded-3xl"
                type="text"
                name="input"
                placeholder="Message..."
                onKeyUp={onPressEnter}
              />
              <div onClick={onSentMessage}>
                <PaperAirplaneIcon className="rounded-2xl h-12 rotate-90 cursor-pointer pl-1" />
              </div>
            </div>
            <div className={`flex flex-1 py-1 px-5 ${hidden}`}>
              <AudioReactRecorder
                state={recordState}
                onStop={onStop}
                backgroundColor="rgb(100 116 139)"
                foregroundColor="rgb(255 255 255)"
                canvasWidth={490}
                canvasHeight={55}
              />
            </div>
            <div className="flex">
              <button
                id="record"
                onClick={start}
                className="bg-green-500 w-12 shadow-3xl rounded-md mx-5"
              >
                Start
              </button>
              <button
                id="pause"
                onClick={pause}
                className="bg-yellow-300 w-12 shadow-3xl rounded-md"
              >
                Pause
              </button>
              <button
                id="stop"
                onClick={stop}
                className="bg-red-500 w-12 shadow-3xl rounded-md mx-5"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
