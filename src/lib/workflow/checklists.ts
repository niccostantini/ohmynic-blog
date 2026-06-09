export type ChecklistItem = { label: string; checked: boolean };

export const TRANSITION_CHECKLISTS: Record<string, {
  title: string;
  confirmLabel: string;
  noteRequired: boolean;
  notePlaceholder: string;
  items: string[];
}> = {
  'draft→review': {
    title: 'Invia in revisione',
    confirmLabel: 'Invia',
    noteRequired: false,
    notePlaceholder: 'Note opzionali per il revisore...',
    items: [
      'Ho controllato ortografia e grammatica',
      'Ho inserito tutte le fonti che conosco',
      "L'articolo è completo e pronto per la revisione",
    ],
  },
  'review→approved': {
    title: 'Approva articolo',
    confirmLabel: 'Approva',
    noteRequired: false,
    notePlaceholder: 'Note opzionali...',
    items: [
      'La struttura narrativa è solida',
      'I dati numerici sono stati verificati',
      'Le citazioni dirette sono controllate',
      'Le fonti esterne sono raggiungibili e pertinenti',
      "Il titolo e l'excerpt rispecchiano il contenuto",
    ],
  },
  'approved→published': {
    title: 'Pubblica articolo',
    confirmLabel: 'Pubblica',
    noteRequired: false,
    notePlaceholder: 'Note opzionali...',
    items: [
      "L'articolo è stato approvato dall'editor",
      'Nessun rischio legale evidente',
      'SEO e metadati sono corretti',
      'La data di pubblicazione è quella giusta',
    ],
  },
};
