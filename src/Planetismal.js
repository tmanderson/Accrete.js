import {
  EARTH_EXOSPHERE_TEMP,
  SOLAR_MASS_IN_EARTH_MASS,
  PROTOPLANET_MASS
} from "./constants";
import {
  acceleration,
  dayLength,
  escape_vel,
  gravity,
  hydro_fraction,
  kothariRadius,
  molecule_limit,
  orbitalZone,
  period,
  rms_vel,
  vol_inventory,
  pressure,
  boiling_point,
  inclination,
  calculate_surface_temp,
  cloud_fraction,
  min_molec_weight,
  iterate_surface_temp
} from "./Astro";

export default class Planetismal {
  get rp() {
    return this.a * (1 - this.e);
  }
  get ra() {
    return this.a * (1 + this.e);
  }

  get xp() {
    return 1 - this.quadMass;
  }

  get xa() {
    return 1 + this.quadMass;
  }

  get normalizedMass() {
    return this.mass / (1 + this.mass);
  }

  get earthMass() {
    return this.mass * SOLAR_MASS_IN_EARTH_MASS;
  }

  get criticalMass() {
    const { B } = this.system.config;
    return B * Math.pow(this.rp * Math.sqrt(1 / this.system.luminosity), -3 / 4);
  }

  /**
   * Begin post-creation extended info (These properties are specific to STARGEN features)
   * and not those of the Dole paper.
   */
  get radius() {
    return this._radius || (this._radius = kothariRadius(this));
  }

  get cloudCover() {
    return (
      this._cloudCover ||
      (this._cloudCover = cloud_fraction(
        this.temperature.surface,
        this.moleculeLimit,
        this.radius,
        this.hydrosphere
      ))
    );
  }

  get boilingPoint() {
    return boiling_point(this.surfacePressure);
  }

  get exosphericTemperature() {
    return EARTH_EXOSPHERE_TEMP / Math.pow(this.a, 2);
  }

  get period() {
    return (
      this._period ||
      (this._period = period(this.a, this.mass, this.system.mass))
    );
  }

  get dayLength() {
    return this._dayLength || (this._dayLength = dayLength(this));
  }

  get surfaceGravity() {
    return (
      this._surfaceGravity ||
      (this._surfaceGravity = gravity(acceleration(this.mass, this.radius)))
    );
  }

  get surfacePressure() {
    return (
      this._surfacePressure ||
      (this._surfacePressure = pressure(
        this.volatileGasInventory,
        this.radius,
        this.surfaceGravity
      ))
    );
  }

  get albedo() {
    return this._albedo;
  }

  get axialTilt() {
    return inclination(this.radius);
  }

  get orbitalZone() {
    return orbitalZone(this.a, this.system.luminosity);
  }

  get moleculeLimit() {
    return molecule_limit(this.mass, this.radius);
  }

  get moleculeWeight() {
    return (
      this._moleculeWeight || (this._moleculeWeight = min_molec_weight(this))
    );
  }

  get RMSVelocity() {
    return rms_vel(this.moleculeLimit, this.exosphericTemperature);
  }
  /**
   * Calculates the unitless 'volatile gas inventory'. This implements Fogg's eq.17.
   */
  get volatileGasInventory() {
    return vol_inventory(this);
  }

  get escapeVelocity() {
    return escape_vel(this.mass, this.radius);
  }

  get temperature() {
    return this._temperature || (this._temperature = iterate_surface_temp(this));
  }

  get hasWater() {
    if (!this._temperature) {
      console.error(
        "Trying to get a temperature value that has not been calculated"
      );
      return 0;
    }
    return this.temperature.high >= this.boilingPoint;
  }

  get hydrosphere() {
    return (
      this._hydrosphere ||
      (this._hydrosphere = hydro_fraction(
        this.volatileGasInventory,
        this.radius
      ))
    );
  }
  /**
   * TODO: The eccentricity is RELATIVE to the planets displacement from the star
   *  ((majorAxis + this.e) - majorAxis + this.e)
   *
   * @param      {StarSystem}        system        The star system containing this planetismal
   * @param      {Number}            majorAxis     The major axis
   * @param      {Number}            eccentricity  The eccentricity
   * @param      {number}            mass          The mass
   * @param      {(boolean|number)}  isGasGiant    Indicates if gas giant
   */
  constructor(
    system,
    majorAxis,
    eccentricity,
    mass = PROTOPLANET_MASS,
    isGasGiant = false
  ) {
    this.system = system;
    // semi-major axis
    this.a = majorAxis;
    // orbital eccentricity
    this.e = eccentricity;
    // initial mass
    this.mass = mass;
    // the quad-root of normalized mass (mass/(mass + 1))
    // Used for gravitational attraction of planetismal
    this.quadMass = Math.pow(this.normalizedMass, 1 / 4);
    // is this a gas giant?
    this.isGasGiant = mass >= this.criticalMass ? true : !!isGasGiant;
    // initial value for the change in mass (updated via `addMass`)
    this.deltaMass = 1;
  }

  bandwidth = () => {
    const { W } = this.system.config;
    const { ra, rp, xa, xp } = this;
    const t1 = (W * (ra + xa)) / (1 - W);
    const t2 = (W * (rp - xp)) / (1 + W);
    return 2 * this.a * this.e + xa + xp + t1 + t2;
  };
  /**
   * As described in the Dole paper, but not used in the final calculations.
   * The `massDensity` method is what's used
   */
  sweepVolume = () => {
    return 2 * Math.PI * this.bandwidth() * (this.xa + this.xp);
  };

  // Dole's discrete mass function of the mass
  massDensity = p => {
    const { N, W } = this.system.config;
    const t1 =
      (8 * Math.PI * Math.pow(this.a, N) * p * this.quadMass) / (1 - W * W);
    const t2 = this.e + this.quadMass + W + W * this.e * this.quadMass;
    return t1 * t2;
  };

  addMass = m => {
    // Invalidate memoized props
    this._surfaceGravity = this._surfacePressure = this._dayLength = this._surfaceGravity = this._radius = null;

    this.deltaMass = m;
    this.mass = this.mass + m;
    this.quadMass = Math.pow(this.normalizedMass, 1 / 4);
    this.isGasGiant = this.mass >= this.criticalMass;
    return this;
  };

  toJSON = () => {
    return {
      aphelion: this.ra,
      dayLength: this.dayLength,
      earthMass: this.earthMass,
      eccentricity: this.e,
      hydrosphere: this.hydrosphere,
      isGasGiant: this.isGasGiant,
      orbitalZone: this.orbitalZone,
      orbitalRadius: this.a,
      perihelion: this.rp,
      period: this.period,
      radius: this.radius,
      surfaceGravity: this.surfaceGravity,
      surfacePressure: this.surfacePressure,
      volatileGasInventory: this.volatileGasInventory,
      // temperature: this.temperature,
      xa: this.xa,
      xp: this.xp
    };
  };
}
