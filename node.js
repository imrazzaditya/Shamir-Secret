const fs = require('fs');
const path = require('path');

// Compute the greatest common divisor of two BigInts
function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
}

// Rational number class for exact arithmetic with BigInts
class Rational {
  constructor(numerator, denominator = 1n) {
    if (denominator === 0n) {
      throw new Error('Denominator cannot be zero');
    }
    // Normalize signs
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const g = gcd(numerator, denominator);
    this.n = numerator / g;
    this.d = denominator / g;
  }

  // Addition: a/b + c/d = (ad + bc) / bd
  add(r) {
    return new Rational(
      this.n * r.d + r.n * this.d,
      this.d * r.d
    );
  }

  // Multiplication: (a/b) * (c/d) = (ac) / (bd)
  multiply(r) {
    return new Rational(
      this.n * r.n,
      this.d * r.d
    );
  }

  // Convert to integer (assumes denominator divides numerator)
  toBigInt() {
    if (this.d !== 1n) {
      throw new Error(`Result is not an integer: ${this.n}/${this.d}`);
    }
    return this.n;
  }
}

// Parse a string in an arbitrary base (up to 36) into a BigInt
function parseBigInt(str, base) {
  const b = BigInt(base);
  let result = 0n;
  for (const ch of str.toLowerCase()) {
    let digit;
    if (ch >= '0' && ch <= '9') {
      digit = BigInt(ch.charCodeAt(0) - 48);
    } else if (ch >= 'a' && ch <= 'z') {
      digit = BigInt(ch.charCodeAt(0) - 87);
    } else {
      throw new Error(`Invalid digit '${ch}' for base ${base}`);
    }
    if (digit >= b) {
      throw new Error(`Digit '${ch}' out of range for base ${base}`);
    }
    result = result * b + digit;
  }
  return result;
}

// Given an object representing a single test case, compute c = f(0)
function computeConstantTerm(testcase) {
  const { keys, ...pointsRaw } = testcase;
  const k = keys.k;

  // Extract exactly k points (x,y), ignoring any extra roots if n > k
  const entries = Object.entries(pointsRaw)
    .map(([xStr, { base, value }]) => ({
      x: BigInt(xStr),
      y: parseBigInt(value, Number(base))
    }))
    .slice(0, k);

  // Lagrange interpolation at x=0: c = Σ y_i * ∏_{j≠i} (-x_j)/(x_i - x_j)
  let c = new Rational(0n, 1n);
  for (let i = 0; i < k; i++) {
    const { x: xi, y: yi } = entries[i];
    let Li = new Rational(1n, 1n);
    for (let j = 0; j < k; j++) {
      if (j === i) continue;
      const xj = entries[j].x;
      // Multiply by (-xj)/(xi - xj)
      Li = Li.multiply(new Rational(-xj, xi - xj));
    }
    // Add yi * Li to the sum
    c = c.add(Li.multiply(new Rational(yi, 1n)));
  }

  // The result must be an integer
  return c.toBigInt();
}

// Main script
function main() {
  const inputPath = path.join(__dirname, 'input.json');
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Cannot find 'input.json' in ${__dirname}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  let testcases;
  try {
    testcases = JSON.parse(raw);
  } catch (e) {
    console.error('Error: Failed to parse JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(testcases)) {
    testcases = [testcases];
  }

  for (const tc of testcases) {
    try {
      const secret = computeConstantTerm(tc);
      console.log(secret.toString());
    } catch (e) {
      console.error('Error computing constant term for test case:', e.message);
    }
  }
}

main();
