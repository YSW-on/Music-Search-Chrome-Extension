[English](README.md) | [한국어](README.ko.md)

## Overview

A Chrome extension that detects music playing in the currently active tab and displays the album cover, title, and artist.
Music recognition is powered by the AudD API.

## How to Use

1. Go to [AudD Dashboard](https://dashboard.audd.io/) and log in to your account.
2. Reveal and copy the value of `Your api_token:`.

**CAUTION: Keep your personal AudD API token private and never share it with anyone.**

3. Paste the API token into the following line in `popup.js`:
```javascript
const AUDD_API_TOKEN = "";
```
4. Open `chrome://extensions/` in Chrome.
5. Enable Developer mode.
6. Click "Load unpacked" and select the project folder.

## How It Works

1. When the Search button is clicked, the extension gets the ID of the currently active tab.
2. It uses the tab ID to obtain a `streamId` that can be used to capture the tab's audio.
3. It uses the streamId to obtain the audio stream from the current tab.
4. To keep the captured audio audible, the extension creates a Web Audio API audio source from the captured stream and connects it to the audio output.
5. It records the audio stream for 6 seconds using the MediaRecorder API and converts the recording into a Blob.
6. It sends the Blob and API token to the AudD API using a POST request.
7. If AudD successfully identifies the track, the extension extracts information such as the title, artist, and song_link from the response.
8. It fetches the album artwork from the web page specified by the song_link returned by AudD.
9. It displays the album artwork, title, and artist in the extension popup.

## Notes

- The recognition result and album information are provided by the AudD API and may not always be accurate.
- Music recognition is unavailable when the API request limit is reached.
- Recognition may fail when the audio differs significantly from the original track, such as when it is a cover version or contains substantial background noise.
- AudD may occasionally return a different song with a similar melody or audio segment.
- Even when recognition is successful, the returned result may reference an album different from the original release, such as a compilation album.
