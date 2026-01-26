const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEntry = (entry = {}) => ({
  valor: toFiniteNumber(entry?.valor),
  porcentaje: toFiniteNumber(entry?.porcentaje),
});

export const normalizeExtrasPayload = (extras = {}) => {
  const camposPersonalizados = Array.isArray(extras.camposPersonalizados)
    ? extras.camposPersonalizados
        .map((campo) => ({
          nombre: campo?.nombre?.trim() || '',
          valor: toFiniteNumber(campo?.valor),
          porcentaje: toFiniteNumber(campo?.porcentaje),
        }))
        .filter((campo) => campo.nombre || campo.valor > 0)
    : [];

  return {
    creditoCamioneta: normalizeEntry(extras.creditoCamioneta),
    envio: normalizeEntry(extras.envio),
    camposPersonalizados,
  };
};

export const calculateExtrasTotal = (extras = {}) => {
  const entries = [];
  if (extras.creditoCamioneta) entries.push(extras.creditoCamioneta);
  if (extras.envio) entries.push(extras.envio);
  if (Array.isArray(extras.camposPersonalizados)) {
    entries.push(...extras.camposPersonalizados);
  }

  return entries.reduce((total, extra) => {
    const valorBase = toFiniteNumber(extra.valor);
    const porcentaje = toFiniteNumber(extra.porcentaje);
    return total + valorBase * (1 + porcentaje / 100);
  }, 0);
};
