import { A, α, K, N, ϴ } from './constants';
import { Γ } from './utils';

const band = (lower, upper, dust = true, gas = true) => ({ lower, upper, gas, dust });

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

  containsDust(l, u, includeGas = false) {
    return this.bands
      .reduce((hasDust, b) => {
        return ((l <= b.lower && u >= b.upper) || (b.lower <= l && b.upper >= u))
          && (hasDust || (b.dust || (includeGas && b.gas)));
      }, false);
  }

  sweep(p) {
    let accumulatedDensity = 0;

    const includeGas = p.isGasGiant;
    const l = p.perihelion - p.xp;
    const u = p.aphelion + p.xa;
    const d = this.densityAt(l + (u - l)/2, p.mass, p.criticalMass, includeGas);

    this.bands = this.bands.reduce((bands, b) => {
      if(!b.dust || includeGas && !b.gas) return bands.concat(b);
      // If the band is out-of-range, then the sweep has no effect (band remains)
      if(l > b.upper || u < b.lower) return bands.concat(b);
      // If the sweep is completely within the band, split the band in two
      else if(l > b.lower && u < b.upper) {
        accumulatedDensity += d;
        return bands.concat([
          band(b.lower, l, b.dust, b.gas),
          band(l, u, false, !includeGas),
          band(u, b.upper, b.dust, b.gas)
        ]);
      }
      // If the sweep consumes the entire band up to the sweep's upper bounds, drop the band's lower
      else if(l < b.lower && u <= b.upper) {
        accumulatedDensity += d;
        return bands.concat([
          band(b.lower, u, false, !includeGas),
          band(u, b.upper, b.dust, b.gas)
        ]);
      }
      // If the sweep consumes the entire band down to the sweep's lower bounds, drop the band's upper
      else if(l > b.lower && u >= b.upper) {
        accumulatedDensity += d;
        return bands.concat([
          band(b.lower, l, b.dust, b.gas),
          band(l, b.upper, false, !includeGas)
        ]);
      }

      accumulatedDensity += d;
      // At this point the ENTIRE band was "swept", so it is gone
      return bands.concat(band(b.lower, b.upper, false, !includeGas));
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
