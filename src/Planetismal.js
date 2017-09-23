import { A, α, K, B, W, N, SOLAR_MASS_IN_EARTH_MASS, PROTOPLANET_MASS } from './constants';

export default class Planetismal {
  get perihelion() { return this.a * (1 - this.e); };
  get aphelion() { return this.a * (1 + this.e); };

  get xp() { return this.perihelion * this.quadMass; };
  get xa() { return this.aphelion * this.quadMass; };

  get relativeMass() { return this.mass/(1 + this.mass); };
  get earthMass() { return this.mass * SOLAR_MASS_IN_EARTH_MASS };

  get criticalMass() {
    const m_c = B * Math.pow(this.perihelion, -3/4);
    // const num = K * A * Math.pow(-α * Math.pow(this.a, 1/3));
    // const den = 1 + Math.sqrt(m_c/this.mass) * (K - 1);
    // return num/den;
    return m_c;
  }

  /**
   * TODO: The eccentricity is RELATIVE to the planets displacement from the star
   *  ((majorAxis + this.e) - majorAxis + this.e)
   *
   * @param      {Number}            majorAxis     The major axis
   * @param      {Number}            eccentricity  The eccentricity
   * @param      {number}            mass          The mass
   * @param      {(boolean|number)}  isGasGiant    Indicates if gas giant
   */
  constructor(majorAxis, eccentricity, mass = PROTOPLANET_MASS, isGasGiant = false) {
    // semi-major axis
    this.a = majorAxis;
    // orbital eccentricity
    this.e = eccentricity;
    // initial mass
    this.mass = mass;
    // the quad-root of normalized mass (mass/(mass + 1))
    this.quadMass = Math.pow(this.relativeMass, 1/4);
    // is this a gas giant?
    this.isGasGiant = mass >= this.criticalMass ? true : isGasGiant;
    // initial value for the change in mass (updated via `addMass`)
    this.deltaMass = 1;
  }

  bandwidth() {
    const { aphelion, perihelion, xa, xp } = this;
    const t1 = (W * (aphelion + xa))/(1 - W);
    const t2 = (W * (perihelion - xp))/(1 + W);
    return 2 * this.a * this.e + xa + xp + t1 + t2;
  }

  bandVolume() {
    return 2 * Math.PI * this.bandwidth() * (this.xa + this.xp);
  }

  // Dole's discrete mass function of the mass
  massDensity(p) {
    const t1 = (8 * Math.PI * Math.pow(this.a, N) * p * this.quadMass) / (1 - W * W);
    const t2 = (this.e + this.quadMass + W + W * this.e * this.quadMass);
    return (t1 * t2);
  }

  addMass(m) {
    this.deltaMass = (this.mass + m) - this.mass;
    this.quadMass = Math.pow(this.mass/(1 + this.mass), 1/4);
    this.mass = this.mass + m;
    // The original Dole paper has this as B * Math.pow(perihelion, -3/4)
    if(!this.isGasGiant && this.mass >= this.criticalMass) this.isGasGiant = true;
    return this;
  }
};
