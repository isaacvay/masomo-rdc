// src/data/sections.ts
export interface Section {
    name: string;
    subjects: string[];
    maxima: number[];
  }
  
  export const sections: Section[] = [
    {
      name: 'MAXIMA',
      subjects: ['Religion', 'Educ. Civ. & Morale', 'Éducation à la vie'],
      // indices : 0,1,2 = 1er P, 2ème P, Exam; 3 = total 1er sem; 4,5,6 = 3ème P, 4ème P, Exam; 7 = total 2ème sem; 8 = total général
      maxima: [10, 10, 20, 40, 10, 10, 20, 40, 80],
    },
    {
      name: 'MAXIMA',
      subjects: [
        'Anglais',
        'Géo/Actualité',
        'Histoire',
        'Chimie',
        'Physique',
        'Mécanisme',
        'Instr. Meth. Mes.',
        'Techno Mécanique',
      ], 
      maxima: [20, 20, 40, 80, 20, 20, 40, 80, 160],
    },
    {
      name: 'MAXIMA',
      subjects: ['Informatique', 'Dessin Électrique', 'Dessin Industriel',],
      maxima: [40, 40, 80, 160, 40, 40, 80, 160, 320],
    },
    {
      name: 'MAXIMA',
      subjects: ['Électricité Générale', 'Mécanique Générale'],
      maxima: [50, 50, 100, 200, 50, 50, 100, 200, 400],
    },
  ];
  