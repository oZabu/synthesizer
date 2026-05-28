export interface SynthSettings {
  pitch: number;
  playbackRate: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  reverbWet: number;
  delayWet: number;
  delayTime: number;
  delayFeedback: number;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const saveSettings = async (settings: SynthSettings) => {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  return res.ok;
};

export const loadSettings = async (): Promise<SynthSettings | null> => {
  const res = await fetch('/api/settings', {
    headers: getHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Object.keys(data).length > 0 ? data : null;
};

export const saveAudio = async (file: File) => {
  const formData = new FormData();
  formData.append('audio', file);
  
  const res = await fetch('/api/audio', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });
  return res.ok ? await res.json() : null;
};

export const loadAudio = async (): Promise<{ filename: string; url: string } | null> => {
  const res = await fetch('/api/audio', {
    headers: getHeaders(),
  });
  if (!res.ok) return null;
  return await res.json();
};
