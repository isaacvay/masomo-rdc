import React from 'react';

type SettingToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-purple-600 transition-colors">
          <div className="absolute h-5 w-5 bg-white rounded-full shadow-sm transform transition-transform top-[2px] left-[2px] peer-checked:translate-x-5" />
        </div>
      </label>
    </div>
  );
}
