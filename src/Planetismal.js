import {
  EARTH_EXOSPHERE_TEMP,
  SOLAR_MASS_IN_EARTH_MASS,
  PROTOPLANET_MASS,
  EARTH_ALBEDO,
  GAS_GIANT_ALBEDO,
  FREEZING_POINT_OF_WATER,
  KM_EARTH_RADIUS
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
  cloud_fraction,
  min_molec_weight,
  iterate_surface_temp,
  eff_temp,
  green_rise,
  opacity,
  empiricalDensity,
  about,
  ice_fraction,
  breathable
} from "./Astro";
import { convert } from "./utils";

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

  get iceCover() {
    return this._iceCover || (this._iceCover = ice_fraction(this.waterCover, this.surfaceTemperature));
  }

  get waterCover() {
    return (
      this._waterCover ||
      (this._waterCover = hydro_fraction(
        this.volatileGasInventory,
        this.radius
      ))
    );
  }

  get cloudCover() {
    return (
      this._cloudCover ||
      (this._cloudCover = cloud_fraction(
        this.surfaceTemperature,
        this.molecularWeight,
        this.radius,
        this.waterCover
      ))
    );
  }

  get boilingPoint() {
    return boiling_point(this.surfacePressure);
  }

  get exosphericTemperature() {
    return EARTH_EXOSPHERE_TEMP / Math.pow(this.a / this.system.ecosphereRadius, 2);
  }

  get orbitalPeriod() {
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
    return this._albedo || (
      this._albedo = this.isGasGiant
        ? about(GAS_GIANT_ALBEDO, 0.1)
        : EARTH_ALBEDO
    );
  }

  get axialTilt() {
    return inclination(this.a);
  }

  get orbitalZone() {
    return orbitalZone(this.a, this.system.luminosity);
  }

  get moleculeLimit() {
    return molecule_limit(this);
  }

  get molecularWeight() {
    return (
      this._molecularWeight || (this._molecularWeight = min_molec_weight(this))
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
    return this._escapeVelocity || (this._escapeVelocity = escape_vel(this.mass, this.radius));
  }

  get opacity() {
    return this._opacity ||
      (this._opacity = opacity(this.moleculeLimit, this.surfacePressure));
  }

  get effectiveTemperature() {
    return this._effectiveTemperature ||
      (this._effectiveTemperature = eff_temp(this.system.ecosphereRadius, this.a, this.albedo));
  }

  /**
   * Returns the temperature changes on planet due to greenhouse effects
   * for habitable worlds, this stabelizes.
   */
  get greenhouseTempDelta() {
    return this._greenhouseTempDelta ||
      (this._greenhouseTempDelta = green_rise(this.opacity, this.effectiveTemperature, this.surfacePressure));
  }

  get surfaceTemperature() {
    return this._surfaceTemperature ||
      ((this._surfaceTemperature = this.effectiveTemperature + this.greenhouseTempDelta));
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

  get density() {
    return this._density || (this._density = empiricalDensity(this.mass, this.a, this.system.ecosphereRadius, this.isGasGiant));
  }

  get planetType() {
    if (this.dayLength === this.orbitalPeriod * 24 || this.resonant_period) return 'Rocky';
    if (this.isGasGiant) {
      const radRatio = this.radius / KM_EARTH_RADIUS;
      if (radRatio <= 1.7) return 'Gas';
      if (radRatio > 1.7 && radRatio < 3.9) return 'Gas Dwarf';
      return 'Jovian';
    }
    if (this.temperature.max > this.boilingPoint) return 'Venusian';
    if (this.temperature.day < FREEZING_POINT_OF_WATER) return 'Ice';
    if (this.surfacePressure <= 250.0) return 'Martian';
    if (this.waterCover >= 0.95) return 'Water';
    if (this.iceCover >= 0.95) return 'Ice';
    if (this.waterCover > 0.05) return 'Terrestrial';
  }

  get breathable() {
    return breathable(this);
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

  toJSON = (units = 'empirical', precision = 2) => {
    const c = convert[units];

    return {
      aphelion: `${this.ra.toFixed(precision)} AU`,
      boilingPoint: `${c.temp(this.boilingPoint).toFixed(precision)} ${c.temp.label}`,
      breathable: this.breathable,
      cloudCover: `${(this.cloudCover * 100).toFixed(precision)}%`,
      dayLength: `${this.dayLength.toFixed(precision)} Hours`,
      earthMass: `${this.earthMass.toFixed(precision)} M⊕`,
      eccentricity: `${this.e.toFixed(precision)}`,
      iceCover: `${(this.iceCover * 100).toFixed(precision)}%`,
      isGasGiant: this.isGasGiant ? 'Yes' : 'No',
      orbitalPeriod: `${this.orbitalPeriod.toFixed(precision)} Days`,
      orbitalRadius: `${this.a.toFixed(precision)} AU`,
      orbitalZone: this.orbitalZone,
      perihelion: `${this.rp.toFixed(precision)} AU`,
      radius: `${c.dist(this.radius).toFixed(precision)} ${c.dist.label}`,
      surfaceGravity: `${this.surfaceGravity.toFixed(precision)} gs`,
      surfacePressure: `${this.surfacePressure.toFixed(precision)} mb`,
      temperature: {
        min: `${c.temp(this.temperature.min).toFixed(precision)} ${c.temp.label}`,
        max: `${c.temp(this.temperature.max).toFixed(precision)} ${c.temp.label}`,
        day: `${c.temp(this.temperature.day).toFixed(precision)} ${c.temp.label}`,
        night: `${c.temp(this.temperature.night).toFixed(precision)} ${c.temp.label}`,
        avg: `${c.temp(this.temperature.avg).toFixed(precision)} ${c.temp.label}`,
      },
      type: this.planetType,
      volatileGasInventory: this.volatileGasInventory.toFixed(precision),
      waterCover: `${(this.waterCover * 100).toFixed(precision)}%`,
      xa: `${this.xa.toFixed(precision)} AU`,
      xp: `${this.xp.toFixed(precision)} AU`
    };
  };
}
