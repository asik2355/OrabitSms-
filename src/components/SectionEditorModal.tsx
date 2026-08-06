import React, { useState } from "react";
import { X, Sparkles, Check, Plus, Trash2, Edit2 } from "lucide-react";
import { SiteConfig, SectionKey } from "../types";

interface SectionEditorModalProps {
  sectionKey: SectionKey | null;
  config: SiteConfig;
  onSaveConfig: (updated: SiteConfig) => void;
  onClose: () => void;
  onAiRefine: (sectionKey: SectionKey, prompt: string) => void;
  isGenerating: boolean;
}

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  sectionKey,
  config,
  onSaveConfig,
  onClose,
  onAiRefine,
  isGenerating,
}) => {
  const [localConfig, setLocalConfig] = useState<SiteConfig>(config);
  const [aiPrompt, setAiPrompt] = useState("");

  if (!sectionKey) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Edit2 className="w-4 h-4 text-blue-400" />
            <span>সেকশন এডিটর ({sectionKey.toUpperCase()})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Refine Assistant Header */}
        <div className="p-3 bg-amber-950/40 border-b border-amber-800/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini AI দিয়ে এই সেকশন রিরাইট করুন</span>
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="যেমন: এটিকে আরও আকর্ষনীয় ও সহজ বাংলায় লিখুন..."
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => onAiRefine(sectionKey, aiPrompt)}
              disabled={isGenerating}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isGenerating ? "রিরাইট হচ্ছে..." : "AI রিরাইট"}
            </button>
          </div>
        </div>

        {/* Dynamic Form Editor per Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* HERO EDIT */}
          {sectionKey === "hero" && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ব্যাজ ট্যাগ (Badge):</label>
                <input
                  type="text"
                  value={localConfig.hero.badge}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      hero: { ...localConfig.hero, badge: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্রধান হেডলাইন (Title):</label>
                <textarea
                  rows={2}
                  value={localConfig.hero.title}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      hero: { ...localConfig.hero, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">সাবটাইটেল / বিবরণ (Subtitle):</label>
                <textarea
                  rows={3}
                  value={localConfig.hero.subtitle}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      hero: { ...localConfig.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">প্রাইমারি বাটন টেক্সট:</label>
                  <input
                    type="text"
                    value={localConfig.hero.ctaPrimary}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        hero: { ...localConfig.hero, ctaPrimary: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">সেকেন্ডারি বাটন টেক্সট:</label>
                  <input
                    type="text"
                    value={localConfig.hero.ctaSecondary}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        hero: { ...localConfig.hero, ctaSecondary: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">হিরো ব্যানার ইমেজ URL:</label>
                <input
                  type="text"
                  value={localConfig.hero.heroImage}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      hero: { ...localConfig.hero, heroImage: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100"
                />
              </div>
            </div>
          )}

          {/* FEATURES EDIT */}
          {sectionKey === "features" && (
            <div className="space-y-4">
              <label className="block font-semibold text-slate-300">বৈশিষ্ট্যসমূহ (Features):</label>
              {localConfig.features.map((feat, idx) => (
                <div key={feat.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-400">
                    <span>বৈশিষ্ট্য #{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => {
                      const updated = [...localConfig.features];
                      updated[idx].title = e.target.value;
                      setLocalConfig({ ...localConfig, features: updated });
                    }}
                    placeholder="Feature Title"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={feat.description}
                    onChange={(e) => {
                      const updated = [...localConfig.features];
                      updated[idx].description = e.target.value;
                      setLocalConfig({ ...localConfig, features: updated });
                    }}
                    placeholder="Description"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* SERVICES EDIT */}
          {sectionKey === "services" && (
            <div className="space-y-4">
              <label className="block font-semibold text-slate-300">সেবাসমূহ (Services):</label>
              {localConfig.services.map((srv, idx) => (
                <div key={srv.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={srv.title}
                    onChange={(e) => {
                      const updated = [...localConfig.services];
                      updated[idx].title = e.target.value;
                      setLocalConfig({ ...localConfig, services: updated });
                    }}
                    placeholder="Service Title"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={srv.description}
                    onChange={(e) => {
                      const updated = [...localConfig.services];
                      updated[idx].description = e.target.value;
                      setLocalConfig({ ...localConfig, services: updated });
                    }}
                    placeholder="Service Details"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                  <input
                    type="text"
                    value={srv.price || ""}
                    onChange={(e) => {
                      const updated = [...localConfig.services];
                      updated[idx].price = e.target.value;
                      setLocalConfig({ ...localConfig, services: updated });
                    }}
                    placeholder="Price tag"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ABOUT EDIT */}
          {sectionKey === "about" && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">শিরোনাম (Title):</label>
                <input
                  type="text"
                  value={localConfig.about.title}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      about: { ...localConfig.about, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">আমাদের বিবরণ (Story):</label>
                <textarea
                  rows={4}
                  value={localConfig.about.story}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      about: { ...localConfig.about, story: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* PRICING EDIT */}
          {sectionKey === "pricing" && (
            <div className="space-y-4">
              {localConfig.pricing.map((plan, idx) => (
                <div key={plan.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-300">
                    <span>প্যাকেজ #{idx + 1}: {plan.name}</span>
                  </div>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => {
                      const updated = [...localConfig.pricing];
                      updated[idx].name = e.target.value;
                      setLocalConfig({ ...localConfig, pricing: updated });
                    }}
                    placeholder="Plan Name"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                  <input
                    type="text"
                    value={plan.price}
                    onChange={(e) => {
                      const updated = [...localConfig.pricing];
                      updated[idx].price = e.target.value;
                      setLocalConfig({ ...localConfig, pricing: updated });
                    }}
                    placeholder="Price"
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* CONTACT EDIT */}
          {sectionKey === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">অফিশিয়াল ইমেইল:</label>
                <input
                  type="email"
                  value={localConfig.contact.email}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, email: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ফোন নাম্বার:</label>
                <input
                  type="text"
                  value={localConfig.contact.phone}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, phone: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ঠিকানা:</label>
                <input
                  type="text"
                  value={localConfig.contact.address}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, address: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
