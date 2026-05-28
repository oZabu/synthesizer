import React from "react";
import { toneEngine } from "../audio/ToneEngine";
import { saveAudio } from "../utils/api";

interface FileUploaderProps {
  onFileLoaded: (name: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      await toneEngine.loadFile(url);
      await saveAudio(file);
      onFileLoaded(file.name);
    }
  };

  return (
    <div className="file-uploader">
      <label htmlFor="audio-upload" className="upload-label">
        Choose Audio File (WAV/MP3)
      </label>
      <input
        id="audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
};
