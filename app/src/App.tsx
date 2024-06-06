import { useState } from 'react';
import './App.css';
import TranscriptDisplay from './components/TranscriptDisplay';

const App = () =>
{
  const [recording, setRecording] = useState(false);


  return (
    <div className="app">
      <h1 className="text-xl font-bold mb-2">Live Transcription</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setRecording(!recording)}
      >
        {recording ? 'Stop' : 'Start'}
      </button>
      <TranscriptDisplay recording={recording} />

    </div>
  );
};

export default App;
