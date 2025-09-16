// Farger for eneboliger (enkeltbolig)
export const singleUnitColors = {
  Ja: { fill: 'green', border: 'green' },
  Nei: { fill: 'red', border: 'red' },
  'Ikke hjemme': { fill: 'orange', border: 'orange' },
  Ubehandlet: { fill: '#ffffff', border: '#878787' }, // default
};

// Farger for blokker (flere enheter)
export const blockColors = {
  Ja: '#006600',           // mørk grønn
  Nei: '#b30000',          // mørk rød
  'Ikke hjemme': '#b36b00',// mørk oransje
  Ubehandlet: '#ffffff',    // mørk blå
  Mixed: '#800080',         // lilla for blanding
};

// Farge for ytre ring rundt blokk
export const blockRing = {
  color: '#4c4c4c', // svart kant
  weight: 2,
  fillOpacity: 0,
};
