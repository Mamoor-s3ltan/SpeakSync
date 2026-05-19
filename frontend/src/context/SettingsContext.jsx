import { createContext, useContext, useState, useEffect } from "react";

const defaults = {
  primaryLang:     "en",
  secondaryLang:   "ur",
  autoTranslate:   true,
  showCaptions:    true,
  micDeviceId:     "default",
  speakerDeviceId: "default",
  cameraDeviceId:  "default",
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("meetingSettings");
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch { return defaults; }
  });

  useEffect(() => {
    localStorage.setItem("meetingSettings", JSON.stringify(settings));
  }, [settings]);

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);