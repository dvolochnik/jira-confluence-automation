function normalizeDecimal(value) {
  if (value instanceof DecimalAmount) {
    return value.decimal;
  }

  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  let text = String(value).trim();

  if (text === '' || text.toLowerCase() === 'null' || text.toLowerCase() === 'nan') {
    return null;
  }

  const sign = text.startsWith('-') ? -1n : 1n;
  text = text.replace(/^[+-]/, '');

  if (text === '' || text === '.') {
    return null;
  }

  const [wholePart, fractionPart = ''] = text.split('.');
  const digits = `${wholePart.replace(/^0+/, '') || '0'}${fractionPart}`.replace(/\.?0+$/, '') || '0';
  const scale = fractionPart.length;

  if (digits === '0') {
    return { coefficient: 0n, scale: 0 };
  }

  return {
    coefficient: BigInt(digits) * sign,
    scale,
  };
}

function toDecimalStringFromScaled(coefficient, scale) {
  if (coefficient === 0n) {
    return '0';
  }

  const sign = coefficient < 0n ? '-' : '';
  const absolute = coefficient < 0n ? -coefficient : coefficient;

  if (scale === 0) {
    return `${sign}${absolute.toString()}`;
  }

  const wholeText = absolute.toString();
  const padded = wholeText.padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const decimalPart = padded.slice(-scale).replace(/0+$/, '') || '0';

  return `${sign}${integerPart}.${decimalPart}`;
}

function decimalToNumber(value) {
  if (value && typeof value === 'object' && 'coefficient' in value && 'scale' in value) {
    const { coefficient, scale } = value;
    const divisor = scale === 0 ? 1n : 10n ** BigInt(scale);
    return Number(coefficient) / Number(divisor);
  }

  const decimal = normalizeDecimal(value);

  if (!decimal) {
    return 0;
  }

  const { coefficient, scale } = decimal;
  const divisor = scale === 0 ? 1n : 10n ** BigInt(scale);
  return Number(coefficient) / Number(divisor);
}

class DecimalAmount {
  constructor(value) {
    const decimal = normalizeDecimal(value);

    if (!decimal) {
      throw new TypeError('Value is not a valid decimal number.');
    }

    this.decimal = decimal;
    this.exact = decimalToNumber(decimal);
  }

  static from(value) {
    return new DecimalAmount(value);
  }

  add(other) {
    return new DecimalAmount(add(this, other));
  }

  divide(other) {
    return new DecimalAmount(divide(this, other));
  }

  toNumber() {
    return this.exact;
  }

  toDisplay(decimalPlaces = 1) {
    return formatHalfUp(this.exact, decimalPlaces);
  }
}

function add(leftValue, rightValue) {
  const left = normalizeDecimal(leftValue);
  const right = normalizeDecimal(rightValue);

  if (!left || !right) {
    throw new TypeError('Both values must be valid decimal numbers.');
  }

  const scale = Math.max(left.scale, right.scale);
  const leftScaled = left.coefficient * (10n ** BigInt(scale - left.scale));
  const rightScaled = right.coefficient * (10n ** BigInt(scale - right.scale));
  const total = leftScaled + rightScaled;

  return decimalToNumber({ coefficient: total, scale });
}

function divide(leftValue, rightValue) {
  const left = normalizeDecimal(leftValue);
  const right = normalizeDecimal(rightValue);

  if (!left || !right) {
    throw new TypeError('Both values must be valid decimal numbers.');
  }

  if (right.coefficient === 0n) {
    throw new TypeError('Cannot divide by zero.');
  }

  const numerator = left.coefficient * (10n ** BigInt(right.scale));
  const denominator = right.coefficient * (10n ** BigInt(left.scale));
  const sign = (numerator < 0n) !== (denominator < 0n) ? -1 : 1;
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;

  if (absoluteNumerator === 0n) {
    return 0;
  }

  let integerPart = absoluteNumerator / absoluteDenominator;
  let remainder = absoluteNumerator % absoluteDenominator;
  let digits = '';

  for (let index = 0; index < 20; index += 1) {
    remainder *= 10n;
    const digit = remainder / absoluteDenominator;
    digits += String(digit);
    remainder %= absoluteDenominator;

    if (remainder === 0n) {
      break;
    }
  }

  const stringValue = digits === '' ? `${integerPart}` : `${integerPart}.${digits}`;
  return Number(stringValue) * sign;
}

function formatHalfUp(value, decimalPlaces = 1) {
  const numericValue = Number(value);
  const multiplier = 10 ** decimalPlaces;
  const rounded = Math.round((numericValue + Number.EPSILON) * multiplier) / multiplier;
  return rounded.toFixed(decimalPlaces);
}

module.exports = {
  DecimalAmount,
  add,
  addDecimal: add,
  divide,
  divideDecimal: divide,
  formatHalfUp,
  halfUp: formatHalfUp,
  roundHalfUp: formatHalfUp,
  toDecimalStringFromScaled,
  normalizeDecimal,
};
