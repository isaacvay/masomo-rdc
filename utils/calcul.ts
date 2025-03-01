export interface Note {
  valeur: number;
  coefficient: number;
}

export const calculMoyenne = (notes: Note[]): number => {
  if (notes.length === 0) return 0;
  const total = notes.reduce((acc, note) => acc + (note.valeur * note.coefficient), 0);
  const sommeCoeff = notes.reduce((acc, note) => acc + note.coefficient, 0);
  return sommeCoeff ? total / sommeCoeff : 0;
};
