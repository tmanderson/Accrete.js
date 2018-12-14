import * as C from "./constants";

// NOTE: This file is not currently used, but the plan is in the works.
// Currently, all contents that of StarGen's (http://eldacur.com/~brons/NerdCorner/StarGen/StarGen.html)

const pow2 = v => v * v;
const pow3 = v => v * v * v;
const pow1_4 = v => Math.pow(v, 1 / 4);

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
 * @returns {Number} The radius of the planetismal in KM
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
 *	is in units of AU.	The density is returned in units of grams/cc.
 */
export const empiricalDensity = (orbRadius, rEcosphere, gasGiant) => {
  let term;

  term = Math.pow(mass * C.solarMassEarthMass, 1 / 8);
  term = term * Math.sqrt(Math.sqrt(rEcosphere, orbRadius));

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
/*	masses.	 The period returned is in terms of Earth days.					*/
/*--------------------------------------------------------------------------*/
export const period = (separation, smallMass, largeMass) => {
  let periodInYears;
  periodInYears = Math.sqrt(Math.pow(separation, 3) / (smallMass + largeMass));
  return periodInYears * C.daysInYear;
};

/**
 * Fogg's information for this routine came from Dole "Habitable Planets
 * for Man", Blaisdell Publishing Company, NY, 1964.  From this, he came
 * up with his eq.12, which is the equation for the 'base_angular_velocity'
 * below.  He then used an equation for the change in angular velocity per
 * time (dw/dt) from P. Goldreich and S. Soter's paper "Q in the Solar
 * System" in Icarus, vol 5, pp.375-389 (1966).	 Using as a comparison the
 * change in angular velocity for the Earth, Fogg has come up with an
 * approximation for our new planet (his eq.13) and take that into account.
 *
 * This is used to find 'change_in_angular_velocity' below.
 * Input parameters are mass (in solar masses), radius (in Km), orbital
 * period (in days), orbital radius (in AU), density (in g/cc),
 * eccentricity, and whether it is a gas giant or not.
 *
 * The length of the day is returned in units of hours.
 */
export const dayLength = planet => {
  const planetMassInGrams = planet.mass * C.SOLAR_MASS_IN_GRAMS;
  const equatorialRadiusInCm = planet.radius * C.CM_PER_KM;
  const YearInHours = planet.orbPeriod || C.period(planet.axis, planet.mass, 1);
  const giant = planet.giant || false;
  const k2 = giant ? 0.24 : 0.33;
  let stopped = false;

  let dayInHours = 0;
  let baseAngularVelocity = 0;
  let changeInAngularVelocity = 0;
  let angVelocity = 0;
  let spinResonanceFactor = 0;

  planet.resonantPeriod = false;

  baseAngularVelocity =
    Math.sqrt(2 * J * planetMassInGrams) /
    (k2 * Math.pow(equatorialRadiusInCm, 2));

  changeInAngularVelocity =
    C.changeInEarthAngVel * (planet.density / earthDensity);
  changeInAngularVelocity *=
    (equatorialRadiusInCm / earthRadius) *
    (earthMassInGrams / planetMassInGrams);
  changeInAngularVelocity *=
    Math.pow(planet.sun.mass, 2) * (1 / Math.pow(planet.axis, 6));

  angVelocity = baseAngularVelocity + changeInAngularVelocity * planet.sun.age;

  if (angVelocity <= 0.0) {
    stopped = true;
    dayInHours = C.veryLargeNumber;
  } else {
    dayInHours = C.radiansPerRotation / (secondsPerHour * angVelocity);
  }

  if (dayInHours >= YearInHours || stopped) {
    if (planet.eccn > 0.1) {
      spinResonanceFactor = (1 - planet.eccn) / (1 + planet.eccn);
      planet.resonantPeriod = true;

      return spinResonanceFactor * YearInHours;
    } else {
      return YearInHours;
    }
  }

  return dayInHours;
};

/*--------------------------------------------------------------------------*/
/*	 The orbital radius is expected in units of Astronomical Units (AU).	*/
/*	 Inclination is returned in units of degrees.							*/
/*--------------------------------------------------------------------------*/
export const inclination = orb_radius => {
  const temp = Math.pow(orb_radius, 0.2) * about(EARTH_AXIAL_TILT, 0.4);
  return temp % 360;
};

/*--------------------------------------------------------------------------*/
/*	 This function implements the escape velocity calculation.	Note that	*/
/*	it appears that Fogg's eq.15 is incorrect.								*/
/*	The mass is in units of solar mass, the radius in kilometers, and the	*/
/*	velocity returned is in cm/sec.											*/
/*--------------------------------------------------------------------------*/
export const escape_vel = (mass, radius) => {
  const mass_in_grams = mass * SOLAR_MASS_IN_GRAMS;
  const radius_in_cm = radius * CM_PER_KM;
  return Math.sqrt((2.0 * GRAV_CONSTANT * mass_in_grams) / radius_in_cm);
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.16.  The molecular weight (usually assumed to be N2)	*/
/*	is used as the basis of the Root Mean Square (RMS) velocity of the		*/
/*	molecule or atom.  The velocity returned is in cm/sec.					*/
/*	Orbital radius is in A.U.(ie: in units of the earth's orbital radius).	*/
/*--------------------------------------------------------------------------*/
export const rms_vel = (molecular_weight, exospheric_temp) => {
  return Math.sqrt(
    ((3.0 * MOLAR_GAS_CONST * exospheric_temp) / molecular_weight) *
      CM_PER_METER
  );
};

/*--------------------------------------------------------------------------*/
/*	 This function returns the smallest molecular weight retained by the	*/
/*	body, which is useful for determining the atmosphere composition.		*/
/*	Mass is in units of solar masses, and equatorial radius is in units of	*/
/*	kilometers.																*/
/*--------------------------------------------------------------------------*/
export const molecule_limit = (mass, equat_radius, exospheric_temp) => {
  const esc_velocity = escape_vel(mass, equat_radius);

  return (
    (3.0 * MOLAR_GAS_CONST * exospheric_temp) /
    pow2(esc_velocity / GAS_RETENTION_THRESHOLD / CM_PER_METER)
  );
};

/*--------------------------------------------------------------------------*/
/*	 This function calculates the surface acceleration of a planet.	 The	*/
/*	mass is in units of solar masses, the radius in terms of km, and the	*/
/*	acceleration is returned in units of cm/sec2.							*/
/*--------------------------------------------------------------------------*/
export const acceleration = (mass, radius) => {
  return (
    GRAV_CONSTANT * ((mass * SOLAR_MASS_IN_GRAMS) / pow2(radius * CM_PER_KM))
  );
};

/*--------------------------------------------------------------------------*/
/*	 This function calculates the surface gravity of a planet.	The			*/
/*	acceleration is in units of cm/sec2, and the gravity is returned in		*/
/*	units of Earth gravities.												*/
/*--------------------------------------------------------------------------*/
export const gravity = acceleration => {
  return acceleration / EARTH_ACCELERATION;
};

/*--------------------------------------------------------------------------*/
/*	This implements Fogg's eq.17.  The 'inventory' returned is unitless.	*/
/*--------------------------------------------------------------------------*/
export const vol_inventory = (
  mass,
  escape_vel,
  rms_vel,
  stellar_mass,
  zone,
  greenhouse_effect,
  accreted_gas
) => {
  let velocity_ratio, proportion_const, temp1, temp2, earth_units;
  velocity_ratio = escape_vel / rms_vel;

  if (velocity_ratio >= GAS_RETENTION_THRESHOLD) {
    switch (zone) {
      case 1:
        proportion_const = 140000.0; /* 100 . 140 JLB */
        break;
      case 2:
        proportion_const = 75000.0;
        break;
      case 3:
        proportion_const = 250.0;
        break;
      default:
        proportion_const = 0.0;
        printf("Error: orbital zone not initialized correctly!\n");
        break;
    }
    earth_units = mass * SUN_MASS_IN_EARTH_MASSES;
    temp1 = (proportion_const * earth_units) / stellar_mass;
    temp2 = about(temp1, 0.2);
    temp2 = temp1;
    if (greenhouse_effect || accreted_gas) return temp2;
    else return temp2 / 140.0; /* 100 . 140 JLB */
  } else return 0.0;
};

/*--------------------------------------------------------------------------*/
/*	This implements Fogg's eq.18.  The pressure returned is in units of		*/
/*	millibars (mb).	 The gravity is in units of Earth gravities, the radius */
/*	in units of kilometers.													*/
/*																			*/
/*  JLB: Aparently this assumed that earth pressure = 1000mb. I've added a	*/
/*	fudge factor (EARTH_SURF_PRES_IN_MILLIBARS / 1000.) to correct for that	*/
/*--------------------------------------------------------------------------*/
export const pressure = (volatile_gas_inventory, equat_radius, gravity) => {
  equat_radius = KM_EARTH_RADIUS / equat_radius;
  return (
    (volatile_gas_inventory * gravity * (EARTH_SURF_PRES_IN_MILLIBARS / 1000)) /
    pow2(equat_radius)
  );
};

/*--------------------------------------------------------------------------*/
/*	 This function returns the boiling poof water in an atmosphere of	*/
/*	 pressure 'surf_pressure', given in millibars.	The boiling pois	*/
/*	 returned in units of Kelvin.  This is Fogg's eq.21.					*/
/*--------------------------------------------------------------------------*/
export const boiling_point = surf_pressure => {
  const surface_pressure_in_bars = surf_pressure / MILLIBARS_PER_BAR;
  return 1.0 / (log(surface_pressure_in_bars / -5050.5) + 1.0 / 373.0);
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
    ((0.71 * volatile_gas_inventory) / 1000.0) *
    pow2(KM_EARTH_RADIUS / planet_radius);
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

  if (smallest_MW_retained > WATER_VAPOR) return 0.0;
  else {
    surf_area = 4.0 * PI * pow2(equat_radius);
    hydro_mass = hydro_fraction * surf_area * EARTH_WATER_MASS_PER_AREA;
    water_vapor_in_kg =
      0.00000001 * hydro_mass * exp(Q2_36 * (surf_temp - EARTH_AVERAGE_KELVIN));
    fraction = (CLOUD_COVERAGE_FACTOR * water_vapor_in_kg) / surf_area;
    if (fraction >= 1.0) return 1.0;
    else return fraction;
  }
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

  if (surf_temp > 328.0) surf_temp = 328.0;
  temp = Math.pow((328.0 - surf_temp) / 90.0, 5.0);

  if (temp > 1.5 * hydro_fraction) temp = 1.5 * hydro_fraction;

  if (temp >= 1.0) return 1.0;
  return temp;
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.19.  The ecosphere radius is given in AU, the orbital */
/*	radius in AU, and the temperature returned is in Kelvin.				*/
/*--------------------------------------------------------------------------*/
export const eff_temp = (ecosphere_radius, orb_radius, albedo) => {
  return Math.sqrt(
    (ecosphere_radius / orb_radius) *
      pow1_4((1.0 - albedo) / (1.0 - EARTH_ALBEDO)) *
      EARTH_EFFECTIVE_TEMP
  );
};

export const est_temp = (ecosphere_radius, orb_radius, albedo) => {
  return Math.sqrt(
    (ecosphere_radius / orb_radius) *
      pow1_4((1.0 - albedo) / (1.0 - EARTH_ALBEDO)) *
      EARTH_AVERAGE_KELVIN
  );
};

/*--------------------------------------------------------------------------*/
/* Old grnhouse:                                                            */
/*	Note that if the orbital radius of the planet is greater than or equal	*/
/*	to R_inner, 99% of it's volatiles are assumed to have been deposited in */
/*	surface reservoirs (otherwise, it suffers from the greenhouse effect).	*/
/*--------------------------------------------------------------------------*/
/*	if ((orb_radius < r_greenhouse) && (zone == 1)) */

/*--------------------------------------------------------------------------*/
/*	The new definition is based on the inital surface temperature and what	*/
/*	state water is in. If it's too hot, the water will never condense out	*/
/*	of the atmosphere, rain down and form an ocean. The albedo used here	*/
/*	was chosen so that the boundary is about the same as the old method		*/
/*	Neither zone, nor r_greenhouse are used in this version				JLB	*/
/*--------------------------------------------------------------------------*/
export const grnhouse = (r_ecosphere, orb_radius) => {
  const temp = eff_temp(r_ecosphere, orb_radius, GREENHOUSE_TRIGGER_ALBEDO);
  return temp > FREEZING_POINT_OF_WATER;
};

/*--------------------------------------------------------------------------*/
/*	This is Fogg's eq.20, and is also Hart's eq.20 in his "Evolution of		*/
/*	Earth's Atmosphere" article.  The effective temperature given is in		*/
/*	units of Kelvin, as is the rise in temperature produced by the			*/
/*	greenhouse effect, which is returned.									*/
/*	I tuned this by changing a Math.pow(x,.25) to Math.pow(x,.4) to match Venus - JLB	*/
/*--------------------------------------------------------------------------*/
export const green_rise = (optical_depth, effective_temp, surf_pressure) => {
  const convection_factor =
    EARTH_CONVECTION_FACTOR *
    Math.pow(surf_pressure / EARTH_SURF_PRES_IN_MILLIBARS, 0.4);

  const rise =
    (pow1_4(1.0 + 0.75 * optical_depth) - 1.0) *
    effective_temp *
    convection_factor;

  if (rise < 0.0) return 0.0;
  return rise;
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

  cloud_part = cloud_fraction * CLOUD_ALBEDO; /* about(...,0.2); */

  if (surf_pressure == 0.0) {
    rock_part = rock_fraction * ROCKY_AIRLESS_ALBEDO; /* about(...,0.3); */
    ice_part = ice_fraction * AIRLESS_ICE_ALBEDO; /* about(...,0.4); */
    water_part = 0;
  } else {
    rock_part = rock_fraction * ROCKY_ALBEDO; /* about(...,0.1); */
    water_part = water_fraction * WATER_ALBEDO; /* about(...,0.2); */
    ice_part = ice_fraction * ICE_ALBEDO; /* about(...,0.1); */
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
  if (molecular_weight >= 0.0 && molecular_weight < 10.0)
    optical_depth = optical_depth + 3.0;
  if (molecular_weight >= 10.0 && molecular_weight < 20.0)
    optical_depth = optical_depth + 2.34;
  if (molecular_weight >= 20.0 && molecular_weight < 30.0)
    optical_depth = optical_depth + 1.0;
  if (molecular_weight >= 30.0 && molecular_weight < 45.0)
    optical_depth = optical_depth + 0.15;
  if (molecular_weight >= 45.0 && molecular_weight < 100.0)
    optical_depth = optical_depth + 0.05;

  if (surf_pressure >= 70.0 * EARTH_SURF_PRES_IN_MILLIBARS)
    optical_depth = optical_depth * 8.333;
  else if (surf_pressure >= 50.0 * EARTH_SURF_PRES_IN_MILLIBARS)
    optical_depth = optical_depth * 6.666;
  else if (surf_pressure >= 30.0 * EARTH_SURF_PRES_IN_MILLIBARS)
    optical_depth = optical_depth * 3.333;
  else if (surf_pressure >= 10.0 * EARTH_SURF_PRES_IN_MILLIBARS)
    optical_depth = optical_depth * 2.0;
  else if (surf_pressure >= 5.0 * EARTH_SURF_PRES_IN_MILLIBARS)
    optical_depth = optical_depth * 1.5;

  return optical_depth;
};

/*
 *	calculates the number of years it takes for 1/e of a gas to escape
 *	from a planet's atmosphere.
 *	Taken from Dole p. 34. He cites Jeans (1916) & Jones (1923)
 */
export const gas_life = (molecular_weight, planet) => {
  const v = rms_vel(molecular_weight, planet.exospheric_temp);
  const g = planet.surf_grav * EARTH_ACCELERATION;
  const r = planet.radius * CM_PER_KM;
  const t = (pow3(v) / (2.0 * pow2(g) * r)) * exp((3.0 * g * r) / pow2(v));
  const years = t / (SECONDS_PER_HOUR * 24.0 * DAYS_IN_A_YEAR);

  // THE CODE BELOW WAS COMMENTED OUT IN STAR GEN (TODO: investigate)
  //	ve = planet.esc_velocity;
  //	k = 2;
  //	t2 = ((k * pow3(v) * r) / pow4(ve)) * exp((3.0 * pow2(ve)) / (2.0 * pow2(v)));
  //	years2 = t2 / (SECONDS_PER_HOUR * 24.0 * DAYS_IN_A_YEAR);

  //	if (DEBUG)
  //		console.error( "gas_life: %LGs, V ratio: %Lf\n",
  //				years, ve / v);

  return years > 2.0e10 ? INCREDIBLY_LARGE_NUMBER : years;
};

export const min_molec_weight = planet => {
  let mass = planet.mass;
  let radius = planet.radius;
  let temp = planet.exospheric_temp;
  let target = 5.0e9;
  let guess_1 = molecule_limit(mass, radius, temp);
  let guess_2 = guess_1;
  let life = gas_life(guess_1, planet);
  let loops = 0;

  if (NULL != planet.sun) target = planet.sun.age;
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
/*		 R_ecosphere														*/
/*		 planet.a															*/
/*		 planet.volatile_gas_inventory										*/
/*		 planet.radius														*/
/*		 planet.boil_po												*/
/*--------------------------------------------------------------------------*/

export const calculate_surface_temp = (
  planet,
  first,
  last_water,
  last_clouds,
  last_ice,
  last_temp,
  last_albedo
) => {
  let effective_temp;
  let water_raw;
  let clouds_raw;
  let greenhouse_temp;
  let boil_off = false;

  if (first) {
    planet.albedo = EARTH_ALBEDO;
    effective_temp = eff_temp(planet.sun.r_ecosphere, planet.a, planet.albedo);
    greenhouse_temp = green_rise(
      opacity(planet.molec_weight, planet.surf_pressure),
      effective_temp,
      planet.surf_pressure
    );
    planet.surf_temp = effective_temp + greenhouse_temp;
    set_temp_range(planet);
  }

  if (planet.greenhouse_effect && planet.max_temp < planet.boil_point) {
    if (DEBUG) {
      console.error(
        "Deluge: %s %d max (%Lf) < boil (%Lf)\n",
        planet.sun.name,
        planet.planet_no,
        planet.max_temp,
        planet.boil_point
      );
    }

    planet.greenhouse_effect = 0;
    planet.volatile_gas_inventory = vol_inventory(
      planet.mass,
      planet.esc_velocity,
      planet.rms_velocity,
      planet.sun.mass,
      planet.orbit_zone,
      planet.greenhouse_effect,
      planet.gas_mass / planet.mass > 0.000001
    );

    planet.surf_pressure = pressure(
      planet.volatile_gas_inventory,
      planet.radius,
      planet.surf_grav
    );
    planet.boil_po = boiling_point(planet.surf_pressure);
  }

  water_raw = planet.hydrosphere = hydro_fraction(
    planet.volatile_gas_inventory,
    planet.radius
  );
  clouds_raw = planet.cloud_cover = cloud_fraction(
    planet.surf_temp,
    planet.molec_weight,
    planet.radius,
    planet.hydrosphere
  );
  planet.ice_cover = ice_fraction(planet.hydrosphere, planet.surf_temp);

  if (planet.greenhouse_effect && planet.surf_pressure > 0.0)
    planet.cloud_cover = 1.0;

  if (
    planet.high_temp >= planet.boil_point &&
    !first &&
    !(planet.day == planet.orb_period * 24.0 || planet.resonant_period)
  ) {
    planet.hydrosphere = 0.0;
    boil_off = true;

    if (planet.molec_weight > WATER_VAPOR) planet.cloud_cover = 0.0;
    else planet.cloud_cover = 1.0;
  }

  if (planet.surf_temp < FREEZING_POINT_OF_WATER - 3.0)
    planet.hydrosphere = 0.0;

  planet.albedo = planet_albedo(
    planet.hydrosphere,
    planet.cloud_cover,
    planet.ice_cover,
    planet.surf_pressure
  );
  effective_temp = eff_temp(planet.sun.r_ecosphere, planet.a, planet.albedo);
  greenhouse_temp = green_rise(
    opacity(planet.molec_weight, planet.surf_pressure),
    effective_temp,
    planet.surf_pressure
  );
  planet.surf_temp = effective_temp + greenhouse_temp;

  if (!first) {
    if (!boil_off)
      planet.hydrosphere = (planet.hydrosphere + last_water * 2) / 3;
    planet.cloud_cover = (planet.cloud_cover + last_clouds * 2) / 3;
    planet.ice_cover = (planet.ice_cover + last_ice * 2) / 3;
    planet.albedo = (planet.albedo + last_albedo * 2) / 3;
    planet.surf_temp = (planet.surf_temp + last_temp * 2) / 3;
  }

  set_temp_range(planet);

  if (DEBUG)
    console.error(
      "%5.1Lf AU: %5.1Lf = %5.1Lf ef + %5.1Lf gh%c (W: %4.2Lf (%4.2Lf) C: %4.2Lf (%4.2Lf) I: %4.2Lf A: (%4.2Lf))\n",
      planet.a,
      planet.surf_temp - FREEZING_POINT_OF_WATER,
      effective_temp - FREEZING_POINT_OF_WATER,
      greenhouse_temp,
      planet.greenhouse_effect ? "*" : " ",
      planet.hydrosphere,
      water_raw,
      planet.cloud_cover,
      clouds_raw,
      planet.ice_cover,
      planet.albedo
    );
};

export const iterate_surface_temp = planet => {
  let count = 0;
  let initial_temp = est_temp(planet.sun.r_ecosphere, planet.a, planet.albedo);
  let h2_life = gas_life(MOL_HYDROGEN, planet);
  let h2o_life = gas_life(WATER_VAPOR, planet);
  let n2_life = gas_life(MOL_NITROGEN, planet);
  let n_life = gas_life(ATOMIC_NITROGEN, planet);

  if (DEBUG)
    console.error(
      "%d: %5.1Lf it [%5.1Lf re %5.1Lf a %5.1Lf alb]\n",
      planet.planet_no,
      initial_temp,
      planet.sun.r_ecosphere,
      planet.a,
      planet.albedo
    );

  if (DEBUG)
    console.error(
      "\nGas lifetimes: H2 - %Lf, H2O - %Lf, N - %Lf, N2 - %Lf\n",
      h2_life,
      h2o_life,
      n_life,
      n2_life
    );

  calculate_surface_temp(planet, true, 0, 0, 0, 0, 0);

  for (count = 0; count <= 25; count++) {
    const last_water = planet.hydrosphere;
    const last_clouds = planet.cloud_cover;
    const last_ice = planet.ice_cover;
    const last_temp = planet.surf_temp;
    const last_albedo = planet.albedo;

    calculate_surface_temp(
      planet,
      false,
      last_water,
      last_clouds,
      last_ice,
      last_temp,
      last_albedo
    );
    if (Math.abs(planet.surf_temp - last_temp) < 0.25) break;
  }

  planet.greenhs_rise = planet.surf_temp - initial_temp;

  if (DEBUG)
    console.error(
      "%d: %5.1Lf gh = %5.1Lf (%5.1Lf C) st - %5.1Lf it [%5.1Lf re %5.1Lf a %5.1Lf alb]\n",
      planet.planet_no,
      planet.greenhs_rise,
      planet.surf_temp,
      planet.surf_temp - FREEZING_POINT_OF_WATER,
      initial_temp,
      planet.sun.r_ecosphere,
      planet.a,
      planet.albedo
    );
};

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
/*   of the planet's atmosphere.                                       JLB  */
/*--------------------------------------------------------------------------*/

export const breathability = planet => {
  let oxygen_ok = false;
  let index;

  if (planet.gases == 0) return NONE;
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

    if (ipp > gases[gas_no].max_ipp) return POISONOUS;

    if (planet.atmosphere[index].num == AN_O)
      oxygen_ok = ipp >= MIN_O2_IPP && ipp <= MAX_O2_IPP;
  }

  return oxygen_ok ? BREATHABLE : UNBREATHABLE;
};

/* function for 'soft limiting' temperatures */
export const lim = x => x / Math.sqrt(sqrt(1 + x * x * x * x));

export const soft = (v, max, min) => {
  const dv = v - min;
  const dm = max - min;
  return (lim((2 * dv) / dm - 1 + 1) / 2) * dm + min;
};

export const set_temp_range = planet => {
  const pressmod = 1 / Math.sqrt(1 + (20 * planet.surf_pressure) / 1000.0);
  const ppmod = 1 / Math.sqrt(10 + (5 * planet.surf_pressure) / 1000.0);
  const tiltmod = fabs(
    cos((planet.axial_tilt * PI) / 180) * Math.pow(1 + planet.e, 2)
  );
  const daymod = 1 / (200 / planet.day + 1);
  const max = planet.surf_temp + Math.sqrt(planet.surf_temp) * 10;
  const min = planet.surf_temp / Math.sqrt(planet.day + 24);

  const mh = Math.pow(1 + daymod, pressmod);
  const ml = Math.pow(1 - daymod, pressmod);
  const hi = mh * planet.surf_temp;
  const lo = Math.max(min, ml * planet.surf_temp);
  const sh = hi + Math.pow((100 + hi) * tiltmod, Math.sqrt(ppmod));
  const wl = Math.max(0, lo - Math.pow((150 + lo) * tiltmod, Math.sqrt(ppmod)));

  planet.high_temp = soft(hi, max, min);
  planet.low_temp = soft(lo, max, min);
  planet.max_temp = soft(sh, max, min);
  planet.min_temp = soft(wl, max, min);
};
