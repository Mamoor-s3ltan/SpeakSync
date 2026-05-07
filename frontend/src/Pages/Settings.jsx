import { Monitor, Mic, Video, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Settings</h1>

        <div className="space-y-4 sm:space-y-6">
          {/* Language Preferences */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-black">
                Language Preferences
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Primary Language
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>English</option>
                  <option>Urdu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Secondary Language
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Urdu</option>
                  <option>English</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="font-medium text-black">
                    Enable Auto-Translation
                  </div>
                  <div className="text-sm text-gray-600">
                    Automatically translate all speech in meetings
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-black">Audio Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Microphone
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Default - Built-in Microphone</option>
                  <option>External Microphone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Speaker
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Default - Built-in Speaker</option>
                  <option>External Speaker</option>
                </select>
              </div>
            </div>
          </div>

          {/* Video Settings */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-black">Video Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Camera
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Default - Built-in Camera</option>
                  <option>External Camera</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Video Quality
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Auto</option>
                  <option>720p</option>
                  <option>1080p</option>
                </select>
              </div>
            </div>
          </div>

          {/* UI Preferences */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-black">UI Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Show Captions</div>
                  <div className="text-sm text-gray-600">
                    Display live translation captions during meetings
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
