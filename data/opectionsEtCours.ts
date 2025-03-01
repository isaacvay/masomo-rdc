export interface Subject {
  name: string;
  icon: string;
}

export interface Section {
  category: string;
  subjects: Subject[];
}

export const data: Section[] = [
  {
    category: "C.O",
    subjects: [
      { name: "Informatique", icon: "💻" },
      { name: "Français", icon: "📖" },
      { name: "Mathématiques", icon: "📐" },
      { name: "Géographie", icon: "🌍" },
    ],
  },
  {
    category: "Math Physique",
    subjects: [
      { name: "Informatique", icon: "💻" },
      { name: "Français", icon: "📖" },
      { name: "Mathématiques", icon: "📐" },
      { name: "Géographie", icon: "🌍" },
    ],
  },
];
