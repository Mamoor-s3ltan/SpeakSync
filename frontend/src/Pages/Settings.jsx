import { useEffect, useState } from "react";
import { Monitor, Mic, Video, Globe, Check } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function Settings() {
  const { settings, update } = useSettings();
  const [devices, setDevices] = useState({ audioinput: [], videoinput: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((devList) => {
        setDevices({
          audioinput: devList.filter((d) => d.kind === "audioinput"),
          videoinput: devList.filter((d) => d.kind === "videoinput"),
        });
      })
      .catch(() => {
        navigator.mediaDevices.enumerateDevices().then((devList) => {
          setDevices({
            audioinput: devList.filter((d) => d.kind === "audioinput"),
            videoinput: devList.filter((d) => d.kind === "videoinput"),
          });
        });
      });
  }, []);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6">Settings</h1>
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><Globe className="w-5 h-5 text-blue-600" /><h2 className="text-xl font-bold text-black">Language Preferences</h2></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">My Language (I speak)</label>
                <select value={settings.primaryLang} onChange={e => update({ primaryLang: e.target.value, secondaryLang: e.target.value === "en" ? "ur" : "en" })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="en">🇬🇧 English</option>
                  <option value="ur">🇵🇰 اردو (Urdu)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Translate To</label>
                <select value={settings.secondaryLang} onChange={e => update({ secondaryLang: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="en">🇬🇧 English</option>
                  <option value="ur">🇵🇰 اردو (Urdu)</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div><div className="font-medium text-black">Enable Auto-Translation</div><div className="text-sm text-gray-600">Start translating automatically when a peer joins</div></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.autoTranslate} onChange={e => update({ autoTranslate: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><Mic className="w-5 h-5 text-green-600" /><h2 className="text-xl font-bold text-black">Audio Settings</h2></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Microphone</label>
                <select value={settings.micDeviceId} onChange={e => update({ micDeviceId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="default">Default Microphone</option>
                  {devices.audioinput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone (${d.deviceId.slice(0,8)})`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Speaker</label>
                <select value={settings.speakerDeviceId} onChange={e => update({ speakerDeviceId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="default">Default Speaker</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><Video className="w-5 h-5 text-purple-600" /><h2 className="text-xl font-bold text-black">Video Settings</h2></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Camera</label>
                <select value={settings.cameraDeviceId} onChange={e => update({ cameraDeviceId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="default">Default Camera</option>
                  {devices.videoinput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera (${d.deviceId.slice(0,8)})`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Video Quality</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Auto</option>
                  <option>720p</option>
                  <option>1080p</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><Monitor className="w-5 h-5 text-gray-600" /><h2 className="text-xl font-bold text-black">UI Preferences</h2></div>
            <div className="flex items-center justify-between">
              <div><div className="font-medium text-black">Show Live Captions</div><div className="text-sm text-gray-600">Show translated text on video tiles during calls</div></div>
              <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.showCaptions} onChange={e => update({ showCaptions: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}