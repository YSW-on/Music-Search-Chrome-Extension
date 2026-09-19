const searchBtn = document.getElementById("searchBtn");
const statusLog = document.getElementById("statusLog");
const albumArtDisplay = document.getElementById("albumArtDisplay");
const titleDisplay = document.getElementById("titleDisplay");
const artistDisplay = document.getElementById("artistDisplay");
const sign1 = document.getElementById("sign1");
const sign2 = document.getElementById("sign2");
const wrapper1 = document.getElementById("wrapper1");
const wrapper2 = document.getElementById("wrapper2");
const AUDD_API_TOKEN = "";

searchBtn.addEventListener("click", async () => {
    searchBtn.disabled = true;
    searchBtn.style.display = "none";
    sign1.style.display = "none";
    sign2.style.display = "none";
    statusLog.style.display = "block";
    statusLog.textContent = "Searching...";

    let audioData;
    let audioContext;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
            throw new Error("error: Cannot found tab");
        }

        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
        statusLog.textContent = "Loading audio stream...";

        audioData = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });
        
        statusLog.textContent = "Capturing audio...";
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(audioData);
        source.connect(audioContext.destination);

        statusLog.textContent = "Recording audio...";
        const recordedAudio = await recordAudio(audioData, 6000);

        statusLog.textContent = "Recognizing audio...";
        const result = await recognizeWithAudD(recordedAudio);

        if (result.result) {
            console.log(result);
            const song = result.result;
            const songUrl = song.song_link;
            albumArtDisplay.src = await getCoverImageFromLink(songUrl);
            titleDisplay.textContent = song.title;
            artistDisplay.textContent = song.artist;
            wrapper1.style.display = "none";
            wrapper2.style.display = "flex";
            statusLog.style.display = "none";
            albumArtDisplay.style.display = "block";
            albumArtDisplay.style.width = `${wrapper2.getBoundingClientRect().width}px`;
            
        } else {
            statusLog.textContent = "Failed to recognize";
        }
    } catch (error) {
        statusLog.textContent = error instanceof Error ? error.message : String(error);
    } finally {
        if (audioData) {
            audioData.getTracks().forEach((track) => track.stop());
        }
        if (audioContext && audioContext.state !== "closed") {
            await audioContext.close();
        }
    }
});

function recordAudio(data, durationMs = 6000) {
    return new Promise((resolve, reject) => {
        const recorder = new MediaRecorder(data, { mimeType: "audio/webm;codecs=opus" });
        const chunks = [];

        recorder.ondataavailable = (a) => {
            if (a.data.size > 0) {
                chunks.push(a.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            resolve(blob);
        };

        recorder.onerror = (a) => {
            reject(a.error || new Error("Failed to record"));
        };

        recorder.start();
        setTimeout(() => {
            if (recorder.state === "recording") {
                recorder.stop();
            }
        }, durationMs);
    });
}

async function recognizeWithAudD(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("api_token", AUDD_API_TOKEN);
    const response = await fetch("https://api.audd.io/", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error(`AudD request error: ${response.status}`);
    }
    return await response.json();
}

async function getCoverImageFromLink(songLink) {
    const res = await fetch(songLink);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const img = doc.querySelector("#bg img");
    return img ? img.src : null;
}