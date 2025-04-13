import { Devoir, OptionQCM } from './DevoirProf';

export type QuestionType = 'texte' | 'qcm';

export interface Question {
  id: string;
  numero: number;
  enonce: string;
  type: QuestionType;
  points: number;
  options?: OptionQCM[];
}

export interface DevoirProfFormProps {
  cours: string;
  classe: string;
  initialData?: Omit<Devoir, "id">;
  onSubmit: (devoir: Omit<Devoir, "id">) => void;
  onCancel: () => void;
}

export interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (id: string, field: keyof Question, value: any) => void;
  onRemove: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (qId: string, oId: string, field: keyof OptionQCM, value: string | boolean) => void;
  onRemoveOption: (qId: string, oId: string) => void;
}