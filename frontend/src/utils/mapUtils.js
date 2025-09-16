import { blockColors, singleUnitColors } from '../colors';

export function getCenter(coords) {
  const latSum = coords.reduce((sum, c) => sum + c.lat, 0);
  const lonSum = coords.reduce((sum, c) => sum + c.lon, 0);
  return { lat: latSum / coords.length, lon: lonSum / coords.length };
}

export const getBlockColor = (units) => {
  if (units.length === 1) {
    const status = units[0].status || 'Ubehandlet';
    return singleUnitColors[status].fill;
  } else {
    const statuses = units.map(u => u.status);
    const uniqueStatuses = [...new Set(statuses.filter(s => s !== 'Ubehandlet'))];

    if (uniqueStatuses.length === 0) return blockColors.Ubehandlet;
    if (uniqueStatuses.length === 1) {
      return blockColors[uniqueStatuses[0]] || blockColors.Ubehandlet;
    }
    return blockColors.Mixed;
  }
};

export const createBlockId = (addr) => {
  // Handter leiligheiter spesielt:
  if (addr.adresse_tekst.includes('-H') || addr.adresse_tekst.includes('-L') || 
      addr.adresse_tekst.includes('-K') || addr.adresse_tekst.includes('-U')) {
    // "Enerhauggata 3-K0108" → "Enerhauggata 3"
    return addr.adresse_tekst.split('-')[0];
  }
  
  // For vanlege adresser (utan leiligheitsnummer):
  const addressParts = addr.adresse_tekst.split(' ');
  const streetName = addressParts.slice(0, -1).join(' ');
  const number = addressParts[addressParts.length - 1];
  const baseNumber = number.replace(/[^0-9]/g, '');
  return `${streetName} ${baseNumber}`;
};

