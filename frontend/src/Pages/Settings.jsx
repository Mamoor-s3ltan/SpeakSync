import { useEffect, useState } from "react";
import { Mic, Video, Globe, Monitor, Volume2, Check } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function Settings() {
  const { settings, update } = useSettings();
  const [devices, setDevices] = useState({ audioinput: [], videoinput: [] });
  const [saved, setSaved] = useState(false);

  // Load real device list from browser
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .catch(() => navigator.mediaDevices.enumerateDevices())
      .then((devList) => {
        setDevices({
          audioinput: devList.filter((d) => d.kind === "audioinput"),
          videoinput: devList.filter((d) => d.kind === "videoinput"),
        });
      })
      .catch(() => {});
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Reusable toggle component
  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );

  // Reusable select component
  const Select = ({ value, onChange, children }) => (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
    >
      {children}
    </select>
  );

  // Reusable card component
  const Card = ({ icon: Icon, iconColor, title, children }) => (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h2 className="text-lg font-bold text-black">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  // Reusable row for toggle settings
  const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-black text-sm">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6">Settings</h1>

        <div className="space-y-4 sm:space-y-6">

          {/* ── 1. Language ── */}
          <Card icon={Globe} iconColor="text-blue-600" title="Language">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                My Language (I speak)
              </label>
              <Select
                value={settings.primaryLang}
                onChange={(e) =>
                  update({
                    primaryLang:   e.target.value,
                    secondaryLang: e.target.value === "en" ? "ur" : "en",
                  })
                }
              >
                <option value="en">🇬🇧 English</option>
                <option value="ur">🇵🇰 اردو (Urdu)</option>
              </Select>
              <p className="text-xs text-gray-400 mt-1.5">
                Translate to:{" "}
                <span className="font-medium text-gray-600">
                  {settings.secondaryLang === "ur" ? "🇵🇰 Urdu" : "🇬🇧 English"}
                </span>
                {" "}(auto-set)
              </p>
            </div>

            <ToggleRow
              label="Auto-Start Translation"
              desc="Start translating automatically when a peer joins"
              checked={settings.autoTranslate}
              onChange={(e) => update({ autoTranslate: e.target.checked })}
            />
          </Card>

          {/* ── 2. Microphone ── */}
          <Card icon={Mic} iconColor="text-green-600" title="Microphone">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Select Microphone
              </label>
              <Select
                value={settings.micDeviceId}
                onChange={(e) => update({ micDeviceId: e.target.value })}
              >
                <option value="default">Default Microphone</option>
                {devices.audioinput.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone (${d.deviceId.slice(0, 8)}…)`}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* ── 3. Camera ── */}
          <Card icon={Video} iconColor="text-purple-600" title="Camera">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Select Camera
              </label>
              <Select
                value={settings.cameraDeviceId}
                onChange={(e) => update({ cameraDeviceId: e.target.value })}
              >
                <option value="default">Default Camera</option>
                {devices.videoinput.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera (${d.deviceId.slice(0, 8)}…)`}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* ── 4. TTS Volume ── */}
          <Card icon={Volume2} iconColor="text-orange-500" title="TTS Volume">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-black">
                  Translated Voice Volume
                </label>
                <span className="text-sm font-semibold text-blue-600">
                  {Math.round(settings.ttsVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ttsVolume}
                onChange={(e) => update({ ttsVolume: parseFloat(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Controls the volume of the AI-translated voice during calls
              </p>
            </div>
          </Card>

          {/* ── 5. Captions ── */}
          <Card icon={Monitor} iconColor="text-gray-600" title="Display">
            <ToggleRow
              label="Show Live Captions"
              desc="Show original and translated text on video tiles during calls"
              checked={settings.showCaptions}
              onChange={(e) => update({ showCaptions: e.target.checked })}
            />
          </Card>

          {/* ── Save button ── */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}