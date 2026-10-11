/** La letra baja con la longitud para que la respuesta quepa sin scroll. */
export const lengthTier = (t: string) => (t.length > 520 ? "xlong" : t.length > 280 ? "long" : undefined);
