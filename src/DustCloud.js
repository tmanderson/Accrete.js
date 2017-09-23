import { A, α, K, N, ϴ } from './constants';
import { Γ } from './utils';

const band = (lower, upper, dust = true, gas = true) => ({ lower, upper, gas, dust, width: upper - lower });

export default class DustCloud {
  get hasDust() { return this.bands.filter(b => b.dust).length > 0; };

  constructor(stellarMass = 1, radius = 50, ratio = K) {
    this.radius = 50;
    this.ratio = ratio;

    let num = 4 * Math.PI * K * A * N * Γ(3 * N);
    let den = Math.pow(α, 3 * N);

    this.mass = num/den * Math.cos(Math.PI/2 - ϴ) * stellarMass;
    this.bands = [band(0, radius)];
  }

  densityAt(radialDistance, mass, criticalMass, includeGas = false) {
    const C = (includeGas ? K : 1);
    const d = includeGas ? (1 + Math.sqrt(criticalMass / mass) * (K - 1)) : 1;
    return C * (A * Math.exp(-α * Math.pow(radialDistance, 1 / N))) / d;
  }

  massAt(radialDistance) {
    const r3 = radialDistance * radialDistance * radialDistance;
    return r3 * Math.exp(-α * Math.pow(radialDistance, 1/N));
  }

  containsDust(p) {
    const l = p.perihelion - p.xp;
    const u = p.aphelion + p.xa;

    return this.bands
      .reduce((hasDust, b) =>
        hasDust || (b.dust && (u > b.upper - p.xa && l < b.lower + p.xp)), false);
  }

  sweep(p) {
    let accumulatedDensity = 0;

    const includeGas = p.isGasGiant;
    const l = p.perihelion - p.xp;
    const u = p.aphelion + p.xa;
    const width = u - l;

    this.bands = this.bands.reduce((bands, b) => {
      // If the band is out-of-range, then the sweep has no effect (band remains)
      if((l > b.upper || u < b.lower) || !b.dust) return bands.concat(b);
      // sweep's lower bounds to band's outer bounds
      if(b.upper - u < 0 && l - b.lower > 0) {
        accumulatedDensity += this.densityAt(
          (b.upper - l)/2,
          p.mass,
          p.criticalMass,
          includeGas
        ) * (b.upper - l)/b.width;

        return bands.concat([
          band(b.lower, l, b.dust, b.gas),
          band(l, b.upper, false, b.gas)
        ]);
      }
      // band's lower bounds to the sweep's upper
      else if(b.lower - l >= 0 && b.upper - u >= 0) {
        accumulatedDensity += this.densityAt(
          (u - b.lower)/2,
          p.mass,
          p.criticalMass,
          includeGas
        ) * (u - b.lower)/b.width;

        return bands.concat([
          band(b.lower, u, false, b.gas),
          band(u, b.upper, b.dust, b.gas)
        ]);
      }
      // sweep's lower to sweep's upper
      else if(b.upper - u >= 0 && l - b.lower >= 0) {
        accumulatedDensity += this.densityAt(
          (u - l)/2,
          p.mass,
          p.criticalMass,
          includeGas
        ) * width/b.width;

        return bands.concat([
          band(b.lower, l, b.dust, b.gas),
          band(l, u, false, b.gas),
          band(u, b.upper, b.dust, b.gas)
        ]);
      }
      return bands.concat(b);
    }, [])
      // Sort the dust bands from centermost to outward
      .sort((a, b) => a.lower - b.lower)
      // combine any successive dust bands with the same attributes
      .reduce((bands, b) => {
        const prevBand = bands[bands.length - 1] || {};

        if(b.dust === prevBand.dust && b.gas === prevBand.gas) {
          return bands.slice(0, bands.length - 1)
            .concat(band(prevBand.lower, b.upper, b.dust, b.gas));
        }

        return bands.concat(b);
      }, []);

    return accumulatedDensity;
  }
}
