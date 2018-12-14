const band = (lower, upper, dust = true, gas = true) => ({
  lower,
  upper,
  gas,
  dust,
  width: upper - lower
});

export default class DustCloud {
  get hasDust() {
    return this.bands.filter(b => b.dust && b.gas).length > 0;
  }

  constructor(system, radius = 50) {
    this.system = system;
    this.radius = 50;
    this.bands = [band(0, radius)];
  }

  dustDensity = (radialDistance, mass, criticalMass, includeGas = false) => {
    const { A, ALPHA: α, N, K } = this.system.config;
    const C = includeGas ? K : 1;
    const d = includeGas ? 1 + Math.sqrt(criticalMass / mass) * (K - 1) : 1;
    return (C * (A * Math.exp(-α * Math.pow(radialDistance, 1 / N)))) / d;
  };

  containsDust = p => {
    const l = p.rp - p.xp;
    const u = p.ra + p.xa;

    return this.bands.reduce(
      (hasDust, b) =>
        hasDust || (b.dust && (u > b.upper - p.xa && l < b.lower + p.xp)),
      false
    );
  };

  sweep = p => {
    let dustDensity = 0;

    const includeGas = p.isGasGiant;
    const l = p.rp - p.xp;
    const u = p.ra + p.xa;

    this.bands = this.bands
      .reduce((bands, b) => {
        if (b.upper < l || b.lower > u || !b.dust) return bands.concat(b);
        // Partial intersection (    [  )   ]
        if (b.upper < u && band.upper > l && band.lower < l) {
          dustDensity += this.dustDensity(
            p.a,
            p.mass,
            p.criticalMass,
            b.gas && includeGas
          ); // * ((b.upper - l) / b.width);

          return bands.concat([
            band(b.lower, l, b.dust, b.gas),
            band(l, b.upper, false, !(b.gas && includeGas))
          ]);
        }
        // Partial inntersection [    (  ]  )
        else if (u < b.upper && u > b.lower && l < b.lower) {
          dustDensity += this.dustDensity(
            p.a,
            p.mass,
            p.criticalMass,
            b.gas && includeGas
          ); // * ((u - b.lower) / b.width);

          return bands.concat([
            band(b.lower, u, false, !(b.gas && includeGas)),
            band(u, b.upper, b.dust, b.gas)
          ]);
        }
        // Complete intersection of planet/band [ (  ) ]
        else if (b.lower < l && b.upper > u) {
          dustDensity += this.dustDensity(
            p.a,
            p.mass,
            p.criticalMass,
            b.gas && includeGas
          ); // * (width / band.width);
          return bands.concat([
            band(b.lower, l, b.dust, b.gas),
            band(l, u, false, !(b.gas && includeGas)),
            band(u, b.upper, b.dust, b.gas)
          ]);
        }
        // Complete intersection of band/planet (  [  ]  )
        else if (l < b.lower && u > b.upper) {
          dustDensity += this.dustDensity(
            p.a,
            p.mass,
            p.criticalMass,
            b.gas && includeGas
          ); // * (b.width / width);
          return bands.concat(
            band(b.lower, b.upper, false, !(b.gas && includeGas))
          );
        }
        return bands.concat(b);
      }, [])
      // Sort the dust bands from centermost to outward
      .sort((a, b) => a.lower - b.lower)
      // combine any successive dust bands with the same attributes
      .reduce((bands, b) => {
        const prevBand = bands[bands.length - 1] || {};

        if (b.dust === prevBand.dust && b.gas === prevBand.gas) {
          return bands
            .slice(0, bands.length - 1)
            .concat(band(prevBand.lower, b.upper, b.dust, b.gas));
        }

        return bands.concat(b);
      }, []);

    return dustDensity;
  };
}
