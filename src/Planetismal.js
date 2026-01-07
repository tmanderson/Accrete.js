import * as C from "./constants";
import * as Astro from "./Astro";

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
    return this.mass * C.SOLAR_MASS_IN_EARTH_MASS;
  }

  get criticalMass() {
    const { B } = this.system.config;
    return B * Math.pow(this.rp, -3 / 4);
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
    mass = C.PROTOPLANET_MASS,
    isGasGiant = false,
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
  massDensity = (p) => {
    const { N, W } = this.system.config;
    const t1 =
      (8 * Math.PI * Math.pow(this.a, N) * p * this.quadMass) / (1 - W * W);
    const t2 = this.e + this.quadMass + W + W * this.e * this.quadMass;
    return t1 * t2;
  };

  addMass = (m) => {
    this.deltaMass = m;
    this.mass = this.mass + m;
    this.quadMass = Math.pow(this.normalizedMass, 1 / 4);
    this.isGasGiant = this.mass >= this.criticalMass;
    return this;
  };

  /**
   * Calculate StarGen properties for this planet
   * Should be called after accretion is complete
   */
  calculateStarGenProperties = () => {
    // Get stellar properties (default to solar values)
    const stellarMass = this.system.mass || 1;
    const stellarLuminosity = this.system.luminosity || 1;
    const stellarAge = this.system.age || 5e9; // 5 billion years default

    // Calculate radius using Kothari formula
    this.radius = Astro.kothariRadius(this);

    // Calculate orbital zone (1=inner, 2=habitable, 3=outer)
    this.orbitalZone = Astro.orbitalZone(this.a, stellarLuminosity);

    // Calculate density
    this.density = Astro.volumeDensity(this.mass, this.radius);

    // Calculate orbital period in Earth days
    this.orbitalPeriod = Astro.period(this.a, this.mass, stellarMass);

    // Calculate surface gravity (in Earth gravities)
    const surfaceAcceleration = Astro.acceleration(this.mass, this.radius);
    this.surfaceGravity = Astro.gravity(surfaceAcceleration);

    // Calculate escape velocity (in cm/sec)
    this.escapeVelocity = Astro.escape_vel(this.mass, this.radius);

    // Calculate axial tilt (in degrees)
    this.axialTilt = Astro.inclination(this.a);

    // Calculate ecosphere radius for the star (in AU)
    const rEcosphere = Math.sqrt(stellarLuminosity);

    // Determine if planet is in greenhouse zone (prone to runaway greenhouse)
    // This is used for volatile inventory calculation
    const inGreenhouseZone = Astro.grnhouse(rEcosphere, this.a);

    // Calculate exospheric temperature based on orbital distance
    // Closer planets have higher exospheric temps, farther planets lower
    // This is a simplified approximation
    const solarFlux = stellarLuminosity / (this.a * this.a);
    this.exosphericTemp = C.EARTH_EXOSPHERE_TEMP * Math.pow(solarFlux, 0.25);

    // Calculate minimum molecular weight that can be retained
    this.molecularWeightRetained = Astro.molecule_limit(
      this.mass,
      this.radius,
      this.exosphericTemp,
    );

    // Calculate volatile gas inventory
    const rmsVel = Astro.rms_vel(C.MOL_NITROGEN, this.exosphericTemp);
    this.volatileGasInventory = Astro.vol_inventory(
      this.mass,
      this.escapeVelocity,
      rmsVel,
      stellarMass,
      this.orbitalZone,
      inGreenhouseZone,
      this.isGasGiant,
    );

    // Calculate surface pressure (in millibars)
    this.surfacePressure = Astro.pressure(
      this.volatileGasInventory,
      this.radius,
      this.surfaceGravity,
    );

    // Calculate boiling point of water at this pressure
    this.boilingPoint = Astro.boiling_point(this.surfacePressure);

    // Iterative calculation of surface temperature and surface properties
    // Start with initial guesses
    this.albedo = C.EARTH_ALBEDO;
    this.hydrosphere = 0;
    this.cloudCover = 0;
    this.iceCover = 0;

    const initialTemp = Astro.est_temp(rEcosphere, this.a, this.albedo);

    // Iterate to find equilibrium temperature and surface conditions
    for (let iteration = 0; iteration < 25; iteration++) {
      const lastWater = this.hydrosphere;
      const lastClouds = this.cloudCover;
      const lastIce = this.iceCover;
      const lastTemp = this.surfaceTemp || initialTemp;
      const lastAlbedo = this.albedo;

      // Calculate effective temperature with current albedo
      const effectiveTemp = Astro.eff_temp(rEcosphere, this.a, this.albedo);

      // Calculate greenhouse effect
      const opticalDepth = Astro.opacity(
        this.molecularWeightRetained,
        this.surfacePressure,
      );
      const greenhouseRise = Astro.green_rise(
        opticalDepth,
        effectiveTemp,
        this.surfacePressure,
      );

      // Update surface temperature
      this.surfaceTemp = effectiveTemp + greenhouseRise;

      // Calculate surface properties
      this.hydrosphere = Astro.hydro_fraction(
        this.volatileGasInventory,
        this.radius,
      );

      this.cloudCover = Astro.cloud_fraction(
        this.surfaceTemp,
        this.molecularWeightRetained,
        this.radius,
        this.hydrosphere,
      );

      this.iceCover = Astro.ice_fraction(this.hydrosphere, this.surfaceTemp);

      // Recalculate albedo based on surface composition
      this.albedo = Astro.planet_albedo(
        this.hydrosphere,
        this.cloudCover,
        this.iceCover,
        this.surfacePressure,
      );

      // Average with previous values to smooth convergence
      if (iteration > 0) {
        this.hydrosphere = (this.hydrosphere + lastWater * 2) / 3;
        this.cloudCover = (this.cloudCover + lastClouds * 2) / 3;
        this.iceCover = (this.iceCover + lastIce * 2) / 3;
        this.albedo = (this.albedo + lastAlbedo * 2) / 3;
        this.surfaceTemp = (this.surfaceTemp + lastTemp * 2) / 3;
      }

      // Check for convergence
      if (Math.abs(this.surfaceTemp - lastTemp) < 0.25) {
        break;
      }
    }

    // Determine actual greenhouse effect based on final surface conditions
    // A planet has a greenhouse effect if it's too hot for water to condense
    this.greenhouseEffect =
      inGreenhouseZone && this.surfaceTemp > this.boilingPoint;

    // Calculate day length (in hours)
    // Using a more realistic approach than the original StarGen formula
    // which produces unrealistic values for old stars

    // Check for tidal locking (very close planets)
    // Tidal locking occurs when orbital period equals rotation period
    const tidalLockingRadius =
      0.027 * Math.pow(stellarMass, 1 / 3) * Math.pow(stellarAge / 1e9, 1 / 6);

    if (this.a < tidalLockingRadius) {
      // Tidally locked - rotation period equals orbital period
      this.dayLength = this.orbitalPeriod * 24;
    } else if (this.isGasGiant) {
      // Gas giants rotate faster due to conservation of angular momentum during formation
      // Typically 10-20 hours, scaled by mass
      const baseDayLength = 10 + 10 * Math.random();
      // Larger gas giants spin slower
      const massEffect = Math.pow(this.earthMass / 300, 0.15);
      this.dayLength = baseDayLength * massEffect;
    } else {
      // Rocky planets - base rotation depends on several factors:
      // 1. Size (smaller planets lose angular momentum faster due to tidal forces)
      // 2. Distance from star (closer = more tidal braking)
      // 3. Presence of large moons (not modeled here, but would slow rotation)

      // Start with a base rotation period (Earth-like ~24 hours)
      let baseDayLength = 24;

      // Modify based on mass - smaller planets tend to rotate slower
      const massEffect = Math.pow(this.earthMass, -0.15);

      // Modify based on distance - closer planets experience more tidal braking
      const distanceEffect = Math.pow(this.a, 0.3);

      // Add some randomness for orbital history, impacts, etc.
      const randomFactor = 0.7 + 0.6 * Math.random();

      this.dayLength =
        baseDayLength * massEffect * distanceEffect * randomFactor;

      // Cap at a reasonable maximum (not tidally locked but slow rotators)
      this.dayLength = Math.min(this.dayLength, this.orbitalPeriod * 24 * 0.5);
    }

    // Mark as calculated
    this.starGenCalculated = true;

    return this;
  };

  toJSON = () => {
    // Calculate StarGen properties if not already done
    if (!this.starGenCalculated) {
      this.calculateStarGenProperties();
    }

    return {
      // Original Accrete properties
      xa: this.xa,
      xp: this.xp,
      aphelion: this.ra,
      axis: this.a,
      eccentricity: this.e,
      perihelion: this.rp,
      earthMass: this.earthMass,
      isGasGiant: this.isGasGiant,

      // StarGen properties
      radius: this.radius,
      density: this.density,
      orbitalZone: this.orbitalZone,
      orbitalPeriod: this.orbitalPeriod,
      surfaceGravity: this.surfaceGravity,
      escapeVelocity: this.escapeVelocity,
      axialTilt: this.axialTilt,

      // Atmospheric properties
      surfacePressure: this.surfacePressure,
      surfaceTemp: this.surfaceTemp,
      surfaceTempCelsius: this.surfaceTemp - C.FREEZING_POINT_OF_WATER,
      greenhouseEffect: this.greenhouseEffect,
      volatileGasInventory: this.volatileGasInventory,
      molecularWeightRetained: this.molecularWeightRetained,
      boilingPoint: this.boilingPoint,

      // Surface properties
      albedo: this.albedo,
      hydrosphere: this.hydrosphere,
      cloudCover: this.cloudCover,
      iceCover: this.iceCover,

      // Rotation
      dayLength: this.dayLength,
    };
  };
}
