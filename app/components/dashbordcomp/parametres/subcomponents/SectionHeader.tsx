import React from 'react';

type SectionHeaderProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
};

export default function SectionHeader({ title, description, icon }: SectionHeaderProps) {
  return (
    <div className="flex gap-3 mb-6">
      <div className="bg-purple-100 p-2 rounded-lg text-purple-600">{icon}</div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );
}
