export const rand = (min = 0, max = min + 1, n = 2) => {
  return min + max * Math.random();

  // const vals = new Uint16Array(n);
  // crypto.getRandomValues(vals);
  // return Math.max(
  //   min,
  //   Math.min(max, max * vals.reduce((out, v) => out + (v/65536), 0)/n)
  // );
}

// no n-1 business, since we're usin' arrays here!
export const Γ = n => (new Array(n)).fill(1).map((_, i) => i || _).reduce((total, v) => total *= v);

/**
  THESE ARE CONFIGURABLE WITH THE OPTIMAL (most like our solar system) VALUES:
    A = 0.0015, K =  50, ⍺ = 5, n = 3
**/

// Initial mass-of-matter in Solar masses per cubic A.U. "dust density coeff"
export const A = 0.0015;
// The dust-to-gas ratio (dust/gas = K)
export const K = 50;
// Negative exponential coefficient (EXPLANATION?) used in calculating dust density
export const ɑ = 5;
// Used in calculating dust density (as the nth root of the radius, r)
export const n = 3;
export const ϴ = Math.PI/2.01; // ~90 degrees

let num = 4 * Math.PI * K * A * n * Γ(3 * n);
let den = Math.pow(ɑ, 3 * n);

console.log(num/den * Math.cos(Math.PI/2 - ϴ));
