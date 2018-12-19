import * as C from "./constants";
import { rand } from "./utils";

// NOTE: This file is not currently used, but the plan is in the works.
// Currently, all contents that of StarGen's (http://eldacur.com/~brons/NerdCorner/StarGen/StarGen.html)

export const about = (val, variance) => val + val * rand(-variance, variance);

export const luminosity = mass => {
  const n = mass < 1 ? 1.75 * (mass - 0.1) + 3.325 : 0.5 * (2.0 - mass) + 4.4;

  return Math.pow(mass, n);
};

export const volumeRadius = (mass, density) => {
  let volume = 0;
  mass = mass * C.SOLAR_MASS_IN_GRAMS;
  volume = mass / density;
  return Math.pow((3 * volume) / (4 * Math.PI), 1 / 3) / C.CM_PER_KM;
};

export const orbitalZone = (radius, lum = luminosity(1)) => {
  if (radius < 4.0 * Math.sqrt(lum)) return 1;
  if (radius < 15.0 * Math.sqrt(lum)) return 2;
  return 3;
};

/**
 * @function kothariRadius
 *
 * @param {Planetismal} planetismal A planetismal
 *
 * @returns {Number} The radius of the planetismal in C.KM
 *
 *	 Returns the radius of the planet in kilometers.
 *	 The mass passed in is in units of solar masses.
 *	 This formula is listed as eq.9 in Fogg's article, although some typos
 *	 crop up in that eq. See "The Internal Constitution of Planets", by
 *	 Dr. D. S. Kothari, Mon. Not. of the Royal Astronomical Society, vol 96
 *	 pp.833-843, 1936 for the derivation.  Specifically, this is Kothari's
 *	 eq.23, which appears on page 840
 *
 */
export const kothariRadius = planetismal => {
  let atomicWeight, atomicNum;
  const { isGasGiant, mass } = planetismal;
  const zone = orbitalZone(planetismal.a);

  if (zone === 1) {
    atomicWeight = isGasGiant ? 9.5 : 15;
    atomicNum = isGasGiant ? 4.5 : 8;
  }

  if (zone === 2) {
    atomicWeight = isGasGiant ? 2.47 : 10;
    atomicNum = isGasGiant ? 2 : 5;
  }

  if (zone === 3) {
    atomicWeight = isGasGiant ? 7 : 10;
    atomicNum = isGasGiant ? 4 : 5;
  }

  const numeratorP1 = (2.0 * C.BETA_20) / C.A1_20;
  const numeratorP2 = 1 / Math.pow(atomicWeight * atomicNum, 1.0 / 3.0);
  const numerator =
    numeratorP1 * numeratorP2 * Math.pow(C.SOLAR_MASS_IN_GRAMS, 1.0 / 3.0);

  const denominatorP1 = C.A2_20 / C.A1_20;
  const denominatorP2 =
    Math.pow(atomicWeight, 4.0 / 3.0) / Math.pow(atomicNum, 2.0);
  const denominator =
    1.0 +
    denominatorP1 *
    denominatorP2 *
    Math.pow(C.SOLAR_MASS_IN_GRAMS, 2.0 / 3.0) *
    Math.pow(mass, 2.0 / 3.0);

  return ((numerator / denominator) * Math.pow(mass, 1.0 / 3.0)) / C.CM_PER_KM;
};

/**
 *	The mass passed in is in units of solar masses, and the orbital radius
 *	is in units of C.AU.	The density is returned in units of grams/cc.
 */
export const empiricalDensity = (mass, orbRadius, rEcosphere, gasGiant) => {
  let term;

  term = Math.pow(mass * C.SOLAR_MASS_IN_EARTH_MASS, 1 / 8);
  term = term * Math.pow(rEcosphere / orbRadius, 1 / 4);

  return gasGiant ? term * 1.2 : term * 5.5;
};

/*--------------------------------------------------------------------------*/
/*	The mass passed in is in units of solar masses, and the equatorial		*/
/*	radius is in km.  The density is returned in units of grams/cc.			*/
/*--------------------------------------------------------------------------*/
export const volumeDensity = (mass, maxRadius) => {
  let volume;
  mass = mass * C.SOLAR_MASS_IN_GRAMS;
  maxRadius = maxRadius * C.CM_PER_KM;
  volume = (4 * Math.PI * Math.pow(maxRadius, 3)) / 3;
  return mass / volume;
};

/*--------------------------------------------------------------------------*/
/*	The separation is in units of AU, and both masses are in units of solar */
/*	masses.

    The period returned is in terms of Earth days.					*/
/*--------------------------------------------------------------------------*/
export const period = (separation, smallMass, largeMass) => {
  return Math.sqrt(Math.pow(separation, 3) / (smallMass + largeMass)) * C.DAYS_IN_A_YEAR;
};

/**
 * Fogg's information for this routine came from Dole "Habitable Planets
 * for Man", Blaisdell Publishing Company, C.NY, 1964.  From this, he came
 * up with his eq.12, which is the equation for the 'base_angular_velocity'
 * below.  He then used an equation for the change in angular velocity per
 * time (dw/dt) from P. Goldreich and S. Soter's paper "Q in the Solar
 * System" in Icarus, vol 5, pp.375-389 (1966).	 Using as a comparison the
 * change in angular velocity for the Earth, Fogg has come up with an
 * approximation for our new planet (his eq.13) and take that into account.
 *
 * This is used to find 'change_in_angular_velocity' below.
 * Input parameters are mass (in solar masses), radius (in Km), orbital
 * period (in days), orbital radius (in C.AU), density (in g/cc),
 * eccentricity, and whether it is a gas giant or not.
 *
 * The length of the day is returned in units of hours.
 */
export const dayLength = planet => {
  let base_angular_velocity;
  let planetary_mass_in_grams = planet.mass * C.SOLAR_MASS_IN_GRAMS;
  let k2 = planet.isGasGiant ? 0.24 : 0.33;
  let equatorial_radius_in_cm = planet.radius * C.CM_PER_KM;
  let spin_resonance_period;
  let temp;

  base_angular_velocity = Math.sqrt(
    (2.0 * C.J * planetary_mass_in_grams) /
    (k2 * Math.pow(equatorial_radius_in_cm, 2))
  );
  // added *24.0, otherwise returned value appeared to be fractions of day
  temp =
    (1.0 / ((base_angular_velocity / 2) * Math.PI * C.SECONDS_PER_HOUR));

  if (temp >= planet.period * 24) {
    planet.resonant_period = true;
    spin_resonance_period =
      ((1.0 - planet.e) / (1.0 + planet.e)) * 24.0 * planet.orbitalPeriod;
    if (planet.e > 0.1) return spin_resonance_period;
  }
    return planet.orbitalPeriod / 24.0; // added the / 24.0 TODO: why
};

/*--------------------------------------------------------------------------*/
/*	 The orbital radius is expected in units of Astronomical Units (AU).	*/
/*	 Inclination is returned in units of degrees.							*/
/*--------------------------------------------------------------------------*/
export const inclination = orb_radius => {
  return (
    Math.pow(orb_radius, 0.2) * about(C.EARTH_AXIAL_TILT, 0.4)
  ) % 360;
};

/*--------------------------------------------------------------------------*/
/*	 This function implements the escape velocity calculation.	Note that	*/
/*	it appears that Fogg's eq.15 is incorrect.								*/
/*	The mass is in units of solar mass, the radius in kilometers, and the	*/
/*	velocity returned is in cm/sec.											*/
/*--------------------------------------------------------------------------*/
export const escape_vel = (mass, radius) => {
  const mass_in_grams = mass * C.SOLAR_MASS_IN_GRAMS;
  const radius_in_cm = radius * C.CM_PER_KM;
  return Math.sqrt(2.0 * C.GRAV_CONSTANT * mass_in_grams / radius_in_cm);
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.16.  The molecular weight (usually assumed to be N2)	*/
/*	is used as the basis of the Root Mean Square (RMS) velocity of the		*/
/*	molecule or atom.  The velocity returned is in cm/sec.					*/
/*	Orbital radius is in A.U. (ie: in units of the earth's orbital radius).	*/
/*--------------------------------------------------------------------------*/
export const rms_vel = (molecular_weight, exospheric_temperature) => {
  return (
    Math.sqrt(
      (3.0 * C.MOLAR_GAS_CONST * exospheric_temperature) / molecular_weight
    ) * C.CM_PER_METER
  );
};

/*--------------------------------------------------------------------------*/
/*	 This function returns the smallest molecular weight retained by the	*/
/*	body, which is useful for determining the atmosphere composition.		*/
/*	Mass is in units of solar masses, and equatorial radius is in units of	*/
/*	kilometers.																*/
/*--------------------------------------------------------------------------*/
export const molecule_limit = planet => {
  return (3.0 * C.MOLAR_GAS_CONST * planet.exosphericTemperature) /
    (Math.pow((planet.escapeVelocity / C.GAS_RETENTION_THRESHOLD) / C.CM_PER_METER, 2.0));
};

/*--------------------------------------------------------------------------*/
/*	 This function calculates the surface acceleration of a planet.	 The	*/
/*	mass is in units of solar masses, the radius in terms of km, and the	*/
/*	acceleration is returned in units of cm/sec2.							*/
/*--------------------------------------------------------------------------*/
export const acceleration = (mass, radius) => {
  return C.GRAV_CONSTANT * (mass * C.SOLAR_MASS_IN_GRAMS) / Math.pow(radius * C.CM_PER_KM, 2);
};

/*--------------------------------------------------------------------------*/
/*	 This function calculates the surface gravity of a planet.	The			*/
/*	acceleration is in units of cm/sec2, and the gravity is returned in		*/
/*	units of Earth gravities (ie. g's).												*/
/*--------------------------------------------------------------------------*/
export const gravity = acceleration => {
  return acceleration / C.EARTH_ACCELERATION;
};

/*--------------------------------------------------------------------------*/
/* Volatile Gas Inventory
/*	This implements Fogg's eq.17.  The 'inventory' returned is unitless.	*/
/*--------------------------------------------------------------------------*/
export const vol_inventory = planet => {
  const mass = planet.mass;
  const isGasGiant = planet.isGasGiant;
  const escape_vel = planet.escapeVelocity;
  const rms_vel = planet.RMSVelocity;
  const stellar_mass = planet.system.mass;
  const zone = planet.orbitalZone;
  // Greenhouse radius OF THE SYSTEM
  const greenhouse_effect = planet.a < planet.system.greenhouseRadius;

  let velocity_ratio, proportion_const, temp1, temp2, earth_units;
  velocity_ratio = escape_vel / rms_vel;

  if (velocity_ratio >= C.GAS_RETENTION_THRESHOLD) {
    switch (zone) {
      case 1:
        proportion_const = 100000;
        break;
      case 2:
        proportion_const = 75000;
        break;
      case 3:
        proportion_const = 250;
        break;
      default:
        proportion_const = 0;
        console.error("Error: orbital zone not initialized correctly!\n");
        break;
    }

    earth_units = mass * C.SOLAR_MASS_IN_EARTH_MASS;
    temp1 = (proportion_const * earth_units) / stellar_mass;
    temp2 = about(temp1, 0.2);
    if (greenhouse_effect || isGasGiant) return temp2;

    return temp2 / 100.0; // 100-140
  }

  return 0.0;
};

/**
 * This implements Fogg's eq.18. Though, this returns earth atmospheres
 *
 * @param {Number} volatile_gas_inventory - the volatile gas inventory for a planet
 * @param {Number} equat_radius - The radius (km) for a planet
 * @param {Number} gravity - The gravity (earth gravities, or g's) for a planet
 *
 * @returns {Number} The surface pressure in millbars
 */
export const pressure = (volatile_gas_inventory, equat_radius, gravity) => {
  return volatile_gas_inventory * gravity * Math.pow(C.KM_EARTH_RADIUS / equat_radius, 2);
};

/*--------------------------------------------------------------------------*/
/*	 This function returns the boiling poof water in an atmosphere of	*/
/*	 pressure 'surf_pressure', given in millibars.	The boiling pois	*/
/*	 returned in units of Kelvin.  This is Fogg's eq.21.					*/
/*--------------------------------------------------------------------------*/
export const boiling_point = surf_pressure => {
  const surface_pressure_in_bars = surf_pressure / C.MILLIBARS_PER_BAR;
  return 1.0 / (Math.log(surface_pressure_in_bars) / -5050.5 + 1.0 / 373.0);
};

/*--------------------------------------------------------------------------*/
/*	 This function is Fogg's eq.22.	 Given the volatile gas inventory and	*/
/*	 planetary radius of a planet (in Km), this function returns the		*/
/*	 fraction of the planet covered with water.								*/
/*	 I have changed the function very slightly:	 the fraction of Earth's	*/
/*	 surface covered by water is 71%, not 75% as Fogg used.					*/
/*--------------------------------------------------------------------------*/
export const hydro_fraction = (volatile_gas_inventory, planet_radius) => {
  const temp =
    (0.71 * volatile_gas_inventory / 1000.0) *
    Math.pow(C.KM_EARTH_RADIUS / planet_radius, 2);
  return Math.min(1.0, temp);
};

/*--------------------------------------------------------------------------*/
/*	 Given the surface temperature of a planet (in Kelvin), this function	*/
/*	 returns the fraction of cloud cover available.	 This is Fogg's eq.23.	*/
/*	 See Hart in "Icarus" (vol 33, pp23 - 39, 1978) for an explanation.		*/
/*	 This equation is Hart's eq.3.											*/
/*	 I have modified it slightly using constants and relationships from		*/
/*	 Glass's book "Introduction to Planetary Geology", p.46.				*/
/*	 The 'CLOUD_COVERAGE_FACTOR' is the amount of surface area on Earth		*/
/*	 covered by one Kg. of cloud.											*/
/*--------------------------------------------------------------------------*/
export const cloud_fraction = (
  surf_temp,
  smallest_MW_retained,
  equat_radius,
  hydro_fraction
) => {
  let water_vapor_in_kg, fraction, surf_area, hydro_mass;

  if (smallest_MW_retained > C.WATER_VAPOR)
    return 0;

  surf_area = 4.0 * Math.PI * Math.pow(equat_radius, 2);
  hydro_mass = hydro_fraction * surf_area * C.EARTH_WATER_MASS_PER_AREA;
  water_vapor_in_kg = 1e-8 * hydro_mass * Math.exp(C.Q2_36 * (surf_temp - C.EARTH_AVERAGE_KELVIN));
  fraction = C.CLOUD_COVERAGE_FACTOR * water_vapor_in_kg / surf_area;
  return Math.min(1, fraction);
};

/*--------------------------------------------------------------------------*/
/*	 Given the surface temperature of a planet (in Kelvin), this function	*/
/*	 returns the fraction of the planet's surface covered by ice.  This is	*/
/*	 Fogg's eq.24.	See Hart[24] in Icarus vol.33, p.28 for an explanation. */
/*	 I have changed a constant from 70 to 90 in order to bring it more in	*/
/*	 line with the fraction of the Earth's surface covered with ice, which	*/
/*	 is approximatly .016 (=1.6%).											*/
/*--------------------------------------------------------------------------*/
export const ice_fraction = (hydro_fraction, surf_temp) => {
  let temp;

  if (surf_temp > 328)
    surf_temp = 328;

  temp = Math.pow((328 - surf_temp) / 90, 5);

  if (temp > 1.5 * hydro_fraction)
    temp = 1.5 * hydro_fraction;

  return Math.min(1, temp);
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.19.  The ecosphere radius is given in C.AU, the orbital */
/*	radius in C.AU, and the temperature returned is in Kelvin.				*/
/*--------------------------------------------------------------------------*/
export const eff_temp = (ecosphere_radius, orb_radius, albedo) => {
  return (
    Math.sqrt(ecosphere_radius / orb_radius) *
    Math.pow((1.0 - albedo) / (1.0 - C.EARTH_ALBEDO), 1 / 4) *
    C.EARTH_EFFECTIVE_TEMP
  );
};

export const est_temp = (ecosphere_radius, orb_radius, albedo) => {
  return (
    Math.sqrt(ecosphere_radius / orb_radius) *
    Math.pow((1.0 - albedo) / (1.0 - C.EARTH_ALBEDO), 1 / 4) *
    C.EARTH_AVERAGE_KELVIN
  );
};

/*--------------------------------------------------------------------------*/
/* Old grnhouse:                                                            */
/*	Note that if the orbital radius of the planet is greater than or equal	*/
/*	to C.R_inner, 99% of it's volatiles are assumed to have been deposited in */
/*	surface reservoirs (otherwise, it suffers from the greenhouse effect).	*/
/*--------------------------------------------------------------------------*/
/*	if ((orb_radius < r_greenhouse) && (zone == 1)) */

/*--------------------------------------------------------------------------*/
/*	The new definition is based on the inital surface temperature and what	*/
/*	state water is in. If it's too hot, the water will never condense out	*/
/*	of the atmosphere, rain down and form an ocean. The albedo used here	*/
/*	was chosen so that the boundary is about the same as the old method		*/
/*	Neither zone, nor r_greenhouse are used in this version				C.JLB	*/
/*--------------------------------------------------------------------------*/
export const greenhouse = planet => {
  // return orbital_radius < greenhouse_radius && zone === 1;
  const temp = eff_temp(
    planet.system.ecosphereRadius,
    planet.a,
    C.GREENHOUSE_TRIGGER_ALBEDO
  );
  return temp > C.FREEZING_POINT_OF_WATER;
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.20, and is also Hart's eq.20 in his "Evolution of		*/
/*	Earth's Atmosphere" article.  The effective temperature given is in		*/
/*	units of Kelvin, as is the rise in temperature produced by the			*/
/*	greenhouse effect, which is returned.									*/
/*	I tuned this by changing a Math.pow(x,.25) to Math.pow(x,.4) to match Venus - C.JLB	*/
/*--------------------------------------------------------------------------*/
export const green_rise = (optical_depth, effective_temp, surf_pressure) => {
  const convection_factor =
    C.EARTH_CONVECTION_FACTOR *
    Math.pow(surf_pressure / C.EARTH_SURF_PRES_IN_MILLIBARS, 1 / 4);

  return (Math.pow(1.75 * optical_depth, 1 / 4) - 1.0) * effective_temp * convection_factor;
};

/*--------------------------------------------------------------------------*/
/*	 The surface temperature passed in is in units of Kelvin.				*/
/*	 The cloud adjustment is the fraction of cloud cover obscuring each		*/
/*	 of the three major components of albedo that lie below the clouds.		*/
/*--------------------------------------------------------------------------*/
export const planet_albedo = (
  water_fraction,
  cloud_fraction,
  ice_fraction,
  surf_pressure
) => {
  let rock_fraction;
  let cloud_adjustment;
  let components;
  let cloud_part;
  let rock_part;
  let water_part;
  let ice_part;

  rock_fraction = 1.0 - water_fraction - ice_fraction;
  components = 0.0;

  if (water_fraction > 0.0) components = components + 1.0;
  if (ice_fraction > 0.0) components = components + 1.0;
  if (rock_fraction > 0.0) components = components + 1.0;

  cloud_adjustment = cloud_fraction / components;

  if (rock_fraction >= cloud_adjustment)
    rock_fraction = rock_fraction - cloud_adjustment;
  else rock_fraction = 0.0;

  if (water_fraction > cloud_adjustment)
    water_fraction = water_fraction - cloud_adjustment;
  else water_fraction = 0.0;

  if (ice_fraction > cloud_adjustment)
    ice_fraction = ice_fraction - cloud_adjustment;
  else ice_fraction = 0.0;

  cloud_part = cloud_fraction * about(C.CLOUD_ALBEDO, 0.2);

  if (surf_pressure == 0.0) {
    rock_part = rock_fraction * about(C.ROCKY_AIRLESS_ALBEDO, 0.3); /* about(...,0.3); */
    ice_part = ice_fraction * about(C.AIRLESS_ICE_ALBEDO, 0.4); /* about(...,0.4); */
    water_part = 0;
  } else {
    rock_part = rock_fraction * about(C.ROCKY_ALBEDO, 0.1); /* about(...,0.1); */
    water_part = water_fraction * about(C.WATER_ALBEDO, 0.2); /* about(...,0.2); */
    ice_part = ice_fraction * about(C.ICE_ALBEDO, 0.1); /* about(...,0.1); */
  }

  return cloud_part + rock_part + water_part + ice_part;
};

/*--------------------------------------------------------------------------*/
/*	 This function returns the dimensionless quantity of optical depth,		*/
/*	 which is useful in determining the amount of greenhouse effect on a	*/
/*	 planet.																*/
/*--------------------------------------------------------------------------*/
export const opacity = (molecular_weight, surf_pressure) => {
  let optical_depth = 0.0;

  if ((molecular_weight >= 0.0) && (molecular_weight < 10.0))
    optical_depth = optical_depth + 3.0;
  if ((molecular_weight >= 10.0) && (molecular_weight < 20.0))
    optical_depth = optical_depth + 2.34;
  if ((molecular_weight >= 20.0) && (molecular_weight < 30.0))
    optical_depth = optical_depth + 1.0;
  if ((molecular_weight >= 30.0) && (molecular_weight < 45.0))
    optical_depth = optical_depth + 0.15;
  if ((molecular_weight >= 45.0) && (molecular_weight < 100.0))
    optical_depth = optical_depth + 0.05;
  if (surf_pressure >= (70.0 * C.EARTH_SURF_PRES_IN_MILLIBARS))
    optical_depth = optical_depth * 8.333;
  else {
    if (surf_pressure >= (50.0 * C.EARTH_SURF_PRES_IN_MILLIBARS)) {
      optical_depth = optical_depth * 6.666;
    }
    else {
      if (surf_pressure >= (30.0 * C.EARTH_SURF_PRES_IN_MILLIBARS)) {
        optical_depth = optical_depth * 3.333;
      }
      else {
        if (surf_pressure >= (10.0 * C.EARTH_SURF_PRES_IN_MILLIBARS)) {
          optical_depth = optical_depth * 2.0;
        }
        else {
          if (surf_pressure >= (5.0 * C.EARTH_SURF_PRES_IN_MILLIBARS))
            optical_depth = optical_depth * 1.5;
        }
      }
    }
  }

  return optical_depth;
};

/*
 *	calculates the number of years it takes for 1/e of a gas to escape
 *	from a planet's atmosphere.
 *	Taken from Dole p. 34. He cites Jeans (1916) & Jones (1923)
 */
export const gas_life = (molecular_weight, planet) => {
  const v = rms_vel(molecular_weight, planet.exosphericTemperature);
  const g = planet.surfaceGravity * C.EARTH_ACCELERATION;
  const r = planet.radius * C.CM_PER_KM;
  const t =
    (Math.pow(v, 3) / (2.0 * Math.pow(g, 2) * r)) *
    Math.exp((3.0 * g * r) / Math.pow(v, 2));
  const years = t / (C.SECONDS_PER_HOUR * 24.0 * C.DAYS_IN_A_YEAR);

  // THE CODE BELOW WAS COMMENTED OUT IN STAR GEN (TODO: investigate)
  //	ve = planet.esc_velocity;
  //	k = 2;
  //	t2 = ((k * pow3(v) * r) / pow4(ve)) * exp((3.0 * pow2(ve)) / (2.0 * pow2(v)));
  //	years2 = t2 / (C.SECONDS_PER_HOUR * 24.0 * C.DAYS_IN_A_YEAR);

  //	if (DEBUG)
  //		console.error( "gas_life: %LGs, V ratio: %Lf\n",
  //				years, ve / v);

  return years > 2.0e10 ? C.INCREDIBLY_LARGE_NUMBER : years;
};

export const min_molec_weight = planet => {
  let guess_3;

  let target = 5.0e9;
  let guess_1 = planet.moleculeLimit;
  let guess_2 = guess_1;
  let life = gas_life(guess_1, planet);
  let loops = 0;
  // TODO: system age!
  if (planet.system.age) target = planet.system.age;

  if (life > target) {
    while (life > target && loops++ < 25) {
      guess_1 = guess_1 / 2.0;
      life = gas_life(guess_1, planet);
    }
  } else {
    while (life < target && loops++ < 25) {
      guess_2 = guess_2 * 2.0;
      life = gas_life(guess_2, planet);
    }
  }

  loops = 0;

  while (guess_2 - guess_1 > 0.1 && loops++ < 25) {
    guess_3 = (guess_1 + guess_2) / 2.0;
    life = gas_life(guess_3, planet);

    if (life < target) guess_1 = guess_3;
    else guess_2 = guess_3;
  }

  life = gas_life(guess_2, planet);

  return guess_2;
};

/*--------------------------------------------------------------------------*/
/*	 The temperature calculated is in degrees Kelvin.						*/
/*	 Quantities already known which are used in these calculations:			*/
/*		 planet.molec_weight												*/
/*		 planet.surf_pressure												*/
/*		 C.R_ecosphere														*/
/*		 planet.a															*/
/*		 planet.volatile_gas_inventory										*/
/*		 planet.radius														*/
/*		 planet.boil_po												*/
/*--------------------------------------------------------------------------*/

export const calculate_surface_temp = (
  planet,
  first,
  last_water = planet._waterCover || 0,
  last_clouds = planet._cloudCover || 0,
  last_ice = planet._iceCover || 0,
  last_temp = planet._surfaceTemperature || 0,
  last_albedo = planet._albedo || C.EARTH_ALBEDO
) => {
  const ecosphereRadius = planet.system.ecosphereRadius;

  let greenhouse_effect = greenhouse(planet);
  let effective_temp;
  let surf_temp;
  let greenhouse_temp;
  let boil_off = false;

  if (first) {
    planet._albedo = C.EARTH_ALBEDO;

    effective_temp = eff_temp(ecosphereRadius, planet.a, planet.albedo);

    greenhouse_temp = green_rise(
      opacity(planet.moleculeWeight, planet.surfacePressure),
      effective_temp,
      planet.surfacePressure
    );

    surf_temp = effective_temp + greenhouse_temp;

    planet._temperature = get_temp_range(planet, surf_temp);
  }

  if (greenhouse_effect && planet._temperature.max < planet.boilingPoint) {
    greenhouse_effect = 0;
  }

  planet._cloudCover = planet._waterCover = undefined;

  if (greenhouse_effect && planet.surfacePressure > 0.0)
    planet._cloudCover = 1.0;

  if (
    planet._temperature.day >= planet.boilingPoint &&
    !first &&
    !(planet.dayLength == planet.orbitalPeriod * 24.0 || planet.resonant_period)
  ) {
    planet._waterCover = 0.0;
    boil_off = true;

    if (planet.molecularWeight > C.WATER_VAPOR) planet._cloudCover = 0.0;
    else planet._cloudCover = 1.0;
  }

  if (planet.surf_temp < C.FREEZING_POINT_OF_WATER - 3.0)
    planet._waterCover = 0.0;

  planet._albedo = planet_albedo(
    planet.waterCover,
    planet.cloudCover,
    planet.iceCover,
    planet.surfacePressure
  );

  effective_temp = planet.effectiveTemperature;
  greenhouse_temp = planet.greenhouseTempDelta;

  planet._surfaceTemperature = effective_temp + greenhouse_temp;

  if (!first) {
    if (!boil_off)
      planet._waterCover = (planet.waterCover + last_water * 2) / 3;
    planet._cloudCover = (planet.cloudCover + last_clouds * 2) / 3;
    planet._iceCover = (planet.iceCover + last_ice * 2) / 3;
    planet._albedo = (planet.albedo + last_albedo * 2) / 3;
    planet._surfaceTemperature = (planet.surfaceTemperature + last_temp * 2) / 3;
  }

  return get_temp_range(planet);
};

// OUTPUT IS TOO HIGH for temp_range
export const iterate_surface_temp = planet => {
  const initial_temp = est_temp(planet.system.ecosphereRadius, planet.a, planet.albedo);
  // const h2_life  = gas_life (C.MOL_HYDROGEN, planet);
  // const h2o_life = gas_life (C.WATER_VAPOR, planet);
  // const n2_life  = gas_life (C.MOL_NITROGEN, planet);
  // const n_life   = gas_life (C.ATOMIC_NITROGEN, planet);

  planet._temperature = calculate_surface_temp(planet, true, 0, 0, 0, 0, 0);

  for (let count = 0; count <= 25; count++) {
    const last_water	= planet._waterCover;
    const last_clouds	= planet._cloudCover;
    const last_ice	= planet._iceCover;
    const last_temp	= planet._surfaceTemperature;
    const last_albedo	= planet._albedo;

		planet._temperature = calculate_surface_temp(planet, false,
							   last_water, last_clouds, last_ice,
							   last_temp, last_albedo);

		if (Math.abs(planet.surfaceTemperature - last_temp) < 0.25)
			break;
  }

  planet._greenhouseTempDelta = planet.surfaceTemperature - initial_temp;
  return planet._temperature;
}

// OUTPUT IS TOO LOW for temp_range
export const iterate_surface_temp2 = planet => {
  let surf1_temp, effective_temp, greenhs_rise, previous_temp, optical_depth, albedo, water, clouds, ice;

  optical_depth = planet.opacity;
  effective_temp = planet.effectiveTemperature;
  greenhs_rise = planet.greenhouseTempDelta;
  surf1_temp = effective_temp + greenhs_rise;

  previous_temp = surf1_temp - 5.0;		/* force the while loop the first time */

  let iterations = 0;

  while (Math.abs(surf1_temp - previous_temp) > 1.0 && iterations++ < 1000) {
    previous_temp = surf1_temp;
    planet._waterCover = planet._cloudCover = planet._iceCover = undefined;

    water = planet.waterCover;
    clouds = planet.cloudCover;
    ice = planet.iceCover;

    if (surf1_temp >= planet.boilingPoint || surf1_temp <= C.FREEZING_POINT_OF_WATER)
      water = 0.0;

    albedo = planet_albedo(water, clouds, ice, planet.surfacePressure);
    optical_depth = opacity(planet.moleculeLimit, planet.surfacePressure);
    effective_temp = eff_temp(planet.system.ecosphereRadius, planet.a, albedo);
    greenhs_rise = green_rise(optical_depth, effective_temp, planet.surfacePressure);
    surf1_temp = effective_temp + greenhs_rise;
  }

  planet._greenhouseTempDelta = greenhs_rise;
  planet._effectiveTemperature = effective_temp;
  planet._surfaceTemperature = surf1_temp;

  planet._waterCover = water;
  planet._cloudCover = clouds;
  planet._iceCover = ice;
  planet._albedo = albedo;

  return get_temp_range(planet);
}

/*--------------------------------------------------------------------------*/
/*	 Inspired partial pressure, taking into account humidification of the	*/
/*	 air in the nasal passage and throat This formula is on Dole's p. 14	*/
/*--------------------------------------------------------------------------*/
export const inspired_partial_pressure = (surf_pressure, gas_pressure) => {
  const pH2O = H20_ASSUMED_PRESSURE;
  const fraction = gas_pressure / surf_pressure;
  return surf_pressure - pH2O * fraction;
};

/*--------------------------------------------------------------------------*/
/*	 This function uses figures on the maximum inspired partial pressures   */
/*   of Oxygen, other atmospheric and traces gases as laid out on pages 15, */
/*   16 and 18 of Dole's Habitable Planets for Man to derive breathability  */
/*   of the planet's atmosphere.                                       C.JLB  */
/*--------------------------------------------------------------------------*/

export const breathable = planet => {
  let oxygen_ok = false;
  let index;

  if (planet.gases == 0) return false;

  for (index = 0; index < planet.gases; index++) {
    let n;
    let gas_no = 0;
    let ipp = inspired_partial_pressure(
      planet.surf_pressure,
      planet.atmosphere[index].surf_pressure
    );

    for (n = 0; n < max_gas; n++) {
      if (gases[n].num == planet.atmosphere[index].num) gas_no = n;
    }

    if (ipp > gases[gas_no].max_ipp) return C.POISONOUS;

    if (planet.atmosphere[index].num == C.AN_O)
      oxygen_ok = ipp >= C.MIN_O2_IPP && ipp <= C.MAX_O2_IPP;
  }

  return oxygen_ok ? 'BREATHABLE' : 'UNBREATHABLE';
};

/* function for 'soft limiting' temperatures */
export const lim = x => x / Math.sqrt(Math.sqrt(1 + x * x * x * x));

export const soft = (v, max, min) => {
  const dv = v - min;
  const dm = max - min;
  return (lim((2 * dv) / dm - 1) + 1) / 2 * dm + min;
};

export const get_temp_range = planet => {
  var pressmod = 1 / Math.sqrt(1 + 20 * planet.surfacePressure / 1000.0);
  var ppmod = 1 / Math.sqrt(10 + 5 * planet.surfacePressure / 1000.0);
  var tiltmod = Math.abs(Math.cos(planet.axialTilt * Math.PI / 180) * Math.pow(1 + planet.e, 2));
  var daymod = 1 / (200 / planet.dayLength + 1);
  var mh = Math.pow(1 + daymod, pressmod);
  var ml = Math.pow(1 - daymod, pressmod);
  var hi = mh * planet.surfaceTemperature;

  var max = planet.surfaceTemperature + Math.sqrt(planet.surfaceTemperature) * 10;
  var min = planet.surfaceTemperature / Math.sqrt(planet.dayLength + 24);

  var lo = Math.max(min, ml * planet.surfaceTemperature);
  var sh = hi + Math.pow((100 + hi) * tiltmod, Math.sqrt(ppmod));
  var wl = Math.max(0, lo - Math.pow((150 + lo) * tiltmod, Math.sqrt(ppmod)));

  return {
    day: soft(hi, max, min),
    night: soft(lo, max, min),
    max: soft(sh, max, min),
    min: soft(wl, max, min),
    avg: planet.surfaceTemperature
  };
}

// void iterate_surface_temp_moon(stellar_system* system, planet** primary, planet** planet)
// {
//   double      surf1_temp;
//   double      effective_temp;
//   double      greenhs_rise;
//   double      previous_temp;
//   double      optical_depth;
//   double      albedo = 0;
//   double      water  = 0;
//   double      clouds = 0;
//   double      ice    = 0;
//   int         num_iter = 0;

//   optical_depth = opacity((*planet)->molec_weight, (*planet)->surf_pressure);
//   effective_temp = eff_temp(system->r_ecosphere, (*primary)->a, EARTH_ALBEDO);
//   greenhs_rise = green_rise(optical_depth, effective_temp,
//           (*planet)->surf_pressure);
//   surf1_temp = effective_temp + greenhs_rise;
//   do
//   {
//     previous_temp = surf1_temp;
//     water = water_fraction((*planet)->volatile_gas_inventory,
//          (*planet)->radius);
//     clouds = cloud_fraction(surf1_temp,
//           (*planet)->molec_weight,
//           (*planet)->radius, water);
//     ice = ice_fraction(water, surf1_temp);
//     if ((surf1_temp >= (*planet)->boil_point) ||
//         (surf1_temp <= FREEZING_POINT_OF_WATER))
//       water = 0.0;
//     albedo = planet_albedo(water, clouds, ice, (*planet)->surf_pressure);
//     if (num_iter++ > 1000)
//       break;
//     optical_depth = opacity((*planet)->molec_weight, (*planet)->surf_pressure);
//     effective_temp = eff_temp(system->r_ecosphere, (*primary)->a, albedo);
//     greenhs_rise = green_rise(optical_depth, effective_temp,
//             (*planet)->surf_pressure);
//     surf1_temp = effective_temp + greenhs_rise;
//   } while (fabs(surf1_temp - previous_temp) > 1.0);

//   (*planet)->hydrosphere = water;
//   (*planet)->cloud_cover = clouds;
//   (*planet)->ice_cover = ice;
//   (*planet)->albedo = albedo;
//   (*planet)->surf_temp = surf1_temp;
// }