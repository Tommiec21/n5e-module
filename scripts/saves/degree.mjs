/** Reused from King’s N5e resolver at commit6c17e1a, with natural20 precedence confirmed by the user. */
export const DEGREE = { CRITICAL_FAILURE: 0, FAILURE: 1, SUCCESS: 2, CRITICAL_SUCCESS: 3 };
export const DEGREE_KEYS = ["critFailure", "failure", "success", "critSuccess"];


export function degreeOfSuccess(total, dc, { natural, isSave = true, shift = 0, margin = 5 } = {}) {
  let degree;
  if ( total >= dc + margin ) degree = DEGREE.CRITICAL_SUCCESS;
  else if ( total >= dc ) degree = DEGREE.SUCCESS;
  else if ( total <= dc - margin ) degree = DEGREE.CRITICAL_FAILURE;
  else degree = DEGREE.FAILURE;
  degree = Math.max(0, Math.min(3, degree + shift));
  if ( isSave && natural === 20 && degree < DEGREE.SUCCESS ) degree = DEGREE.SUCCESS;
  return { degree, key: DEGREE_KEYS[degree] };
}
