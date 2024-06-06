// TranscriptDisplay.tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Download from './Download';

const server_url = import.meta.env.VITE_SERVER_URL as string;
const socket = io(server_url, { transports: ['websocket'] });

const TranscriptDisplay = ({ recording }: { recording: boolean }) =>
{
    const [transcript, setTranscript] = useState('');
    const [showDownload, setShowDownload] = useState(false);


    async function getMicrophone()
    {
        const userMedia = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        return new MediaRecorder(userMedia);
    }

    async function openMicrophone(microphone: MediaRecorder): Promise<MediaRecorder>
    {
        microphone.ondataavailable = (event: BlobEvent) =>
        {
            console.log('socket.connected', socket.connected);

            if (event.data.size > 0 && socket.connected)
            {
                console.log('event.data.size > 0 && socket.connected');
                console.log(socket.id);
                socket.emit('packet-sent', event.data);
            }
            console.log('ttttttrigered');
        };

        microphone.start(500);

        microphone.onstart = () =>
        {
            console.log('client: microphone opened');
        };

        microphone.onstop = () =>
        {
            console.log('client: microphone closed');
        };

        socket.on('transcript', (newTranscript: string) =>
        {
            setTranscript(prev => `${prev} ${newTranscript}`);
        });

        return microphone;
    }

    async function closeMicrophone(microphone: MediaRecorder): Promise<void>
    {
        if (microphone)
        {
            microphone.stop();
            microphone.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
    }

    let microphone: MediaRecorder | null;

    const handleRecording = async () =>
    {
        if (recording)
        {
            setTranscript('');
            console.log('start recording')
            microphone = await getMicrophone();
            await openMicrophone(microphone);
            setShowDownload(false);
        } else
        {
            console.log('stop recording .....')
            await closeMicrophone(microphone as MediaRecorder); // Add type assertion here
            microphone = null;
            socket.off('transcript');
            if (transcript)
            {
                setShowDownload(true);
            }
        }
    };

    useEffect(() =>
    {

        handleRecording();

        return () =>
        {
            if (microphone)
            {
                closeMicrophone(microphone);
            }
            socket.off('transcript');
        };
    }, [recording, transcript]);

    return (
        <div className="transcript-display">
            <div className="bg-white shadow p-4 rounded-lg mt-4">
                {transcript || "No transcription yet..."}
            </div>
            {showDownload && <Download transcript={transcript} />}
        </div>
    );
};

export default TranscriptDisplay;
