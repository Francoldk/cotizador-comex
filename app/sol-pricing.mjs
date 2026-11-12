export const solModes = {
  courier: { label: 'Courier aéreo', rate: 20, unit: 'kg real' },
  grupo: { label: 'Marítimo Importa en Grupo', rate: 5, unit: 'kg real' },
  lcl: { label: 'Marítimo LCL', rate: 400, unit: 'm³' },
  all: { label: 'All Inclusive fijo', rate: 2335, unit: 'servicio' }
};

export const solDefaults = {
  rates: Object.fromEntries(Object.entries(solModes).map(([mode, { rate }]) => [mode, rate])),
  insurance: 3, taxes: 65, fee: 35, minKg: 45, maxKg: 400, maxCbm: 2
};

const round = value => Math.round(value * 100) / 100;
const valid = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

export function calculateSol({ mode, settings, goods, weight, volume }) {
  const fob = Number(goods);
  const kg = Number(weight);
  const cbm = Number(volume);
  const fixed = mode === 'all';
  const quantity = fixed ? 1 : mode === 'lcl' ? cbm : kg;
  const rate = settings.rates[mode];

  if (!valid(goods) || fob <= 0) return { error: 'Ingresá el valor FOB total en USD.' };
  if ([weight, volume].some(value => value !== '' && !valid(value))) {
    return { error: 'Ingresá un peso y un volumen válidos.' };
  }
  if (fixed) {
    const { minKg, maxKg, maxCbm } = settings;
    if (![minKg, maxKg, maxCbm].every(valid) || +maxKg < +minKg || +maxCbm <= 0) {
      return { error: 'Revisá los límites del All Inclusive.' };
    }
    if (kg <= 0 && cbm <= 0) return { error: 'Ingresá el peso real o el volumen.' };
    if ((kg > 0 && (kg < +minKg || kg > +maxKg)) || cbm > +maxCbm) {
      return { error: 'La carga queda fuera de los límites configurados para All Inclusive.' };
    }
  } else if (quantity <= 0) {
    return { error: mode === 'lcl' ? 'Ingresá el volumen en m³.' : 'Ingresá el peso real en kg.' };
  }

  const charges = fixed ? [rate] : [rate, settings.insurance, settings.taxes, settings.fee];
  if (!charges.every(valid)) return { error: 'Completá las tarifas y los porcentajes con valores válidos.' };

  const lines = fixed ? [
    { label: 'Servicio All Inclusive', detail: 'Flete, aduana y honorarios', amount: round(+rate) }
  ] : [
    { label: 'Flete internacional', detail: `${quantity} ${solModes[mode].unit} × USD ${rate}`, amount: round(quantity * +rate) },
    { label: 'Seguro estimado', detail: `${settings.insurance}% del FOB`, amount: round(fob * (+settings.insurance / 100)) },
    { label: 'Impuestos estimados', detail: `${settings.taxes}% del FOB`, amount: round(fob * (+settings.taxes / 100)) },
    { label: 'Honorarios', detail: 'Importe fijo', amount: round(+settings.fee) }
  ];

  const service = round(lines.reduce((total, line) => total + line.amount, 0));
  return { lines, fob: round(fob), service, total: round(round(fob) + service) };
}
