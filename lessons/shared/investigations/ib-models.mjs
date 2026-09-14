// Public teaching models. No storage, network, assessment or mastery side effects.
// Finance is a constant-rate, single-initial-amount model, not a transaction ledger.
const fail = (code = 'ib_invalid_input') => { throw new RangeError(code); };
const number = value => typeof value === 'number' && Number.isFinite(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const checked = value => { if (!number(value)) fail('ib_numeric_range'); return Object.is(value, -0) ? 0 : value; };
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function sequenceInput(first, index, count) {
  if (!number(first) || !integer(index, 1, 500) || !integer(count, 0, 500)) fail();
}

export function arithmetic({first = 12, difference = 4, index = 8, count = 8} = {}) {
  sequenceInput(first, index, count);
  if (!number(difference)) fail();
  const termAt = n => checked(first + (n - 1) * difference);
  const sumTo = n => n === 0 ? 0 : checked(n * (first / 2 + termAt(n) / 2));
  const rows = Array.from({length: Math.max(index, count)}, (_, i) => ({index: i + 1, term: termAt(i + 1), sum: sumTo(i + 1)}));
  return freeze({model: 'arithmetic', first, difference, index, count, term: termAt(index), sum: sumTo(count), rows});
}

export function geometric({first = 6, ratio = 2, index = 5, count = 5} = {}) {
  sequenceInput(first, index, count);
  if (!number(ratio)) fail();
  // Recurrence defines r=0 too: a,0,0,...; the quotient test then becomes unavailable.
  const termAt = n => checked(first === 0 ? 0 : first * ratio ** (n - 1));
  const sumTo = n => {
    if (n === 0 || first === 0) return 0;
    if (ratio === 1) return checked(first * n);
    if (ratio === 0) return first;
    // expm1 avoids subtracting almost equal numbers for ratios close to +1.
    return checked(ratio > 0 ? first * Math.expm1(n * Math.log(ratio)) / (ratio - 1) : first * (1 - ratio ** n) / (1 - ratio));
  };
  const rows = Array.from({length: Math.max(index, count)}, (_, i) => ({index: i + 1, term: termAt(i + 1), sum: sumTo(i + 1)}));
  return freeze({model: 'geometric', first, ratio, index, count, term: termAt(index), sum: sumTo(count), rows});
}

export function finance({principal = 5000, annualRatePercent = 4, compoundsPerYear = 4, years = 3, kind = 'compound', inflationPercent = 0} = {}) {
  if (![principal, annualRatePercent, years, inflationPercent].every(number) || principal < 0 || years < 0 || inflationPercent <= -100 ||
      !integer(compoundsPerYear, 1, 365) || !['compound', 'simple', 'depreciation'].includes(kind)) fail();
  const m = compoundsPerYear, periods = Math.round(m * years);
  // A plotted point is a completed credit period, never an unexplained fractional credit.
  if (!integer(periods, 0, 1200) || Math.abs(periods - m * years) > 8 * Number.EPSILON * Math.max(1, periods)) fail('ib_credit_date');
  if (kind === 'depreciation' && (m !== 1 || annualRatePercent < 0 || annualRatePercent > 100)) fail();
  const periodicFactor = kind === 'depreciation' ? 1 - annualRatePercent / 100 : 1 + annualRatePercent / (100 * m);
  if (periodicFactor <= 0 && kind !== 'depreciation') fail();
  const simpleAt = t => checked(principal * (1 + annualRatePercent * t / 100));
  const balanceAt = period => kind === 'simple' ? simpleAt(period / m) : checked(principal === 0 ? 0 : principal * periodicFactor ** period);
  const rows = Array.from({length: periods + 1}, (_, period) => {
    const t = period / m, balance = balanceAt(period);
    if (balance < 0) fail('ib_finance_domain');
    const simple = kind === 'depreciation' ? null : simpleAt(t);
    return {period, years: t, balance, simpleBalance: simple !== null && simple >= 0 ? simple : null,
      realBalance: checked(balance / (1 + inflationPercent / 100) ** t)};
  });
  const final = rows.at(-1);
  const effectiveAnnualRatePercent = kind === 'simple' ? null : checked(100 * (periodicFactor ** m - 1));
  const realAnnualRatePercent = kind === 'simple' ? null : checked(100 * (periodicFactor ** m / (1 + inflationPercent / 100) - 1));
  return freeze({model: 'finance', kind, principal, annualRatePercent, compoundsPerYear: m, years: periods / m, periods, inflationPercent,
    periodicFactor: kind === 'simple' ? null : periodicFactor, balance: final.balance, simpleBalance: final.simpleBalance,
    interest: checked(final.balance - principal), realBalance: final.realBalance, effectiveAnnualRatePercent, realAnnualRatePercent, rows});
}

// Decimal input values are the intended classroom quantities. For a floating-point
// comparison very close to a boundary, compare their finite decimal rationals exactly.
// This keeps "above 121" distinct from "at least 121" for 100(1.1)^n.
function decimalFraction(value) {
  const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  const shift = Number(exponent) - fraction.length;
  const numerator = BigInt(whole + fraction);
  return shift >= 0 ? [numerator * 10n ** BigInt(shift), 1n] : [numerator, 10n ** BigInt(-shift)];
}
function exactOrder(initial, factor, period, target) {
  const [a, b] = decimalFraction(initial), [c, d] = decimalFraction(factor), [e, f] = decimalFraction(target);
  const lhs = a * c ** BigInt(period) * f, rhs = e * b * d ** BigInt(period);
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}
export function firstThreshold({initial, factor, target, relation = 'atLeast', maxPeriods = 1000} = {}) {
  if (![initial, factor, target].every(number) || initial < 0 || factor < 0 || target < 0 || !integer(maxPeriods, 0, 1200) ||
      !['atLeast', 'above', 'atMost', 'below'].includes(relation)) fail();
  let previous = null;
  for (let period = 0; period <= maxPeriods; period += 1) {
    const value = checked(initial === 0 ? 0 : initial * factor ** period);
    // Away from the boundary the floating-point order suffices. The exact fallback
    // also distinguishes a tiny positive balance from zero after numeric underflow.
    const near = Math.abs(value - target) <= 16 * Number.EPSILON * Math.max(Math.abs(value), Math.abs(target), Number.MIN_VALUE);
    const order = near ? exactOrder(initial, factor, period, target) : (value < target ? -1 : 1);
    const matches = relation === 'above' ? order > 0 : relation === 'atLeast' ? order >= 0 : relation === 'below' ? order < 0 : order <= 0;
    if (matches) return freeze({found: true, period, value, previous, relation, target, checkedThrough: period});
    previous = {period, value, matches: false};
  }
  return freeze({found: false, period: null, value: null, previous, relation, target, checkedThrough: maxPeriods});
}
