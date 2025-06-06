import { useState, useRef } from 'react';
import { UploadCloud, Play, Pause, StopCircle } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'audio/mpeg') {
      setError('Only MP3 files are allowed.');
      setSelectedFile(null);
      setAudioURL(null);
      return;
    }
    setError('');
    setSelectedFile(file);
    setAudioURL(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    setAudioChunks([]);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    } else if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'recorded_audio.webm', { type: 'audio/webm' });
      setSelectedFile(audioFile);
      setAudioURL(URL.createObjectURL(audioBlob));
    };
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('audio', selectedFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (err) {
      setError('Error transcribing audio. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 font-sans text-gray-100">
      <div className="max-w-2xl mx-auto bg-gray-800 border border-gray-700 rounded-xl shadow-md p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-purple-400">Your words in any language you want</h1>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <div className="flex flex-col space-y-4 items-center">
          <input
            type="file"
            accept="audio/mpeg"
            onChange={handleFileChange}
            className="file:bg-purple-600 file:text-white file:px-4 file:py-2 file:rounded file:cursor-pointer"
          />

          <div className="flex gap-4">
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <Play size={18} /> Start
            </button>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              <Pause size={18} /> Pause
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              <StopCircle size={18} /> Stop
            </button>
          </div>

          {audioURL && (
            <audio controls src={audioURL} className="w-full mt-4" />
          )}

          <button
            onClick={handleTranscribe}
            disabled={!selectedFile}
            className={`mt-6 px-6 py-2 rounded shadow ${selectedFile
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
          >
            Upload and Transcribe
          </button>



          {transcript && (
            <div className="mt-6 text-sm bg-gray-700 p-4 rounded text-white w-full">
              <h3 className="text-purple-400 font-semibold mb-2">Transcript</h3>
              <p>{transcript}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
