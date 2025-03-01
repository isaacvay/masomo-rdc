import { calculMoyenne, Note } from '@/utils/calcul';

describe('calculMoyenne', () => {
  test('calcule correctement la moyenne pondérée', () => {
    const notes: Note[] = [
      { valeur: 15, coefficient: 2 },
      { valeur: 10, coefficient: 1 }
    ];
    const moyenne = calculMoyenne(notes);
    expect(moyenne).toBeCloseTo((15*2 + 10*1) / (2+1));
  });

  test('retourne 0 si aucune note', () => {
    expect(calculMoyenne([])).toBe(0);
  });
});
