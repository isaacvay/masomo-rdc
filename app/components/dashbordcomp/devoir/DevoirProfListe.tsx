import React from 'react';
import { Devoir } from './DevoirProf';
import { FaPlus } from 'react-icons/fa';

const statusClasses = {
  "À rendre": "bg-blue-100 text-blue-800",
  "Rendu": "bg-green-100 text-green-800",
  "default": "bg-red-100 text-red-800"
};

interface DevoirProfListeProps {
  devoirs: Devoir[];
  onSelect: (devoir: Devoir) => void;
  onCreate: () => void;
}

const DevoirProfListe: React.FC<DevoirProfListeProps> = ({ devoirs, onSelect, onCreate }) => {
  const getStatusClass = (status: string) => statusClasses[status as keyof typeof statusClasses] || statusClasses.default;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          aria-label="Ajouter un devoir"
        >
          <FaPlus className="text-sm" />
          <span>Nouveau devoir</span>
        </button>
      </div>

      {devoirs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Aucun devoir à afficher</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {devoirs.map((devoir) => (
            <li key={devoir.id}>
              <article 
                onClick={() => onSelect(devoir)}
                className="p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <header className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{devoir.titre}</h3>
                    <p className="text-gray-600 text-sm">{devoir.matiere}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(devoir.statut)} whitespace-nowrap`}>
                    {devoir.statut}
                  </span>
                </header>
                <footer className="mt-3">
                  <p className="text-gray-500 text-sm">{devoir.date}</p>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DevoirProfListe;