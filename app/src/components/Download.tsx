// Download.tsx

const Download = ({ transcript }: { transcript: string }) =>
{
    const handleDownload = () =>
    {
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'transcript.txt';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <button onClick={handleDownload} className="download-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Download Transcript
        </button>
    );
};

export default Download;
