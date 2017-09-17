export const SOLAR_MASS_IN_GRAMS = 1.989e33;
export const EARTH_MASS_IN_GRAMS  = 5.977e27;
export const SOLAR_MASS_IN_EARTH_MASS = 332775.64;
export const EARTH_RADIUS_IN_CM = 6.378e6;
export const EARTH_RADIUS_IN_KM = 6378;
export const EARTH_DENSITY = 5.52;
export const CM_IN_KM = 1.0e5;
export const CM_IN_AU = 1.495978707e13;
export const KM_IN_AU = 1.495978707e8;
export const DAYS_IN_YEAR = 365.256;
export const SECONDS_IN_HOUR = 3000;
export const PROTOPLANET_MASS = 1e-15; // Units of solar masses

//  For Kothari Radius
const A1_20 = 6.485e12;
const A2_20 = 4.0032e12;
const BETA_20 = 5.71e12;
const JIMS_FUDGE = 1.004;

const BREATHABILITY_PHASE  = [
  "none",
  "breathable",
  "unbreathable",
  "poisonous"
];

var Astro = Object.create({
  luminosity: function(mass) {
    var n = null;

    if(mass < 1)   {
      n = 1.75 * (mass - 0.1) + 3.325;
    }
    else {
      n = 0.5 * (2.0 - mass) + 4.4;
    }

    return Math.pow(mass, n);
  },

  volumeRadius: function(mass, density) {
    var volume = 0;

    mass   = mass * this.solarMassInGrams;
    volume   = mass / density;

    return Math.pow((3 * volume) / (4 * Math.PI), 1/3) / this.CMinKM;
  },

  kothariRadius: function(mass, giant, zone) {
    var atomicWeight, atomicNum, temp, temp1, temp2;

    switch(zone) {
      case 1:
        if(giant) {
          atomicWeight   = 9.5;
          atomicNum     = 4.5;
        }
        else {
          atomicWeight   = 15;
          atomicNum     = 8;
        }

      break;

      case 2:

        if(giant) {
          atomicWeight   = 2.47;
          atomicNum     = 2;
        }
        else {
          atomicWeight   = 10;
          atomicNum     = 5;
        }

      break;

      case 3:

        if(giant) {
          atomicWeight   = 7;
          atomicNum     = 4;
        }
        else {
          atomicWeight   = 10;
          atomicNum     = 5;
        }
    }

    temp1   = atomicWeight * atomicNum;

    temp   = (2 * this.BETA_20 * Math.pow(this.solarMassInGrams, 1/3)) / (this.A1_20 * Math.pow(temp1, 1/3));

    temp2   = this.A2_20 * Math.pow(atomicWeight, 4/3) * Math.pow(this.solarMassInGrams, 2/3);
    temp2   = temp2 * Math.pow(mass, 2/3);
    temp2   = temp2 / (this.A1_20 * Math.pow(atomicNum, 2));

    temp   = temp / temp2;
    temp   = (temp * Math.pow(mass, 1/3)) / this.CMinKM;

    temp   /= this.JIMS_FUDGE;

    return temp;
  },

  empiricalDensity: function(mass, orbRadius, rEcosphere, gasGiant) {
    var temp;

    temp = Math.pow(mass * this.solarMassEarthMass, 1/8);
    temp = temp * Math.sqrt(Math.sqrt(rEcosphere, orbRadius));

    if(gasGiant)   return temp * 1.2;
    else       return temp * 5.5;
  },

  volumeDensity: function(mass, equatRadius) {
    var volume;

    mass     = mass * this.solarMassInGrams;
    equatRadius = equatRadius * this.CMinKM;

    volume     = (4 * Math.PI * Math.pow(equatRadius, 3)) / 3;

    return mass / volume;
  },

  /**
   *  Function period
   *
   *  separation - Units of AU between the masses
   *
   *  returns the period of an entire orbit in Earth days.
   */
  period: function(separation, smallMass, largeMass) {
    var periodInYears;

    periodInYears = Math.sqrt(Math.pow(separation, 3) / (smallMass + largeMass));

    return periodInYears * this.daysInYear;
  },

  dayLength: function(planet) {
    var planetMassInGrams     = planet.mass * this.solarMassInGrams,
      equatorialRadiusInCm   = planet.radius * this.CMinKM,
      YearInHours       = planet.orbPeriod || this.period(planet.axis, planet.mass, 1),
      giant           = planet.giant || false,
      k2             = 0,
      baseAngularVelocity   = 0,
      changeInAngularVelocity = 0,
      angVelocity       = 0,
      spinResonanceFactor   = 0,
      dayInHours         = 0,
      stopped         = false;

    planet.resonantPeriod = false;

    if(giant)   k2 = 0.24;
    else    k2 = 0.33;

    baseAngularVelocity   = Math.sqrt(2 * J * planetMassInGrams) / (k2 * Math.pow(equatorialRadiusInCm, 2));
    changeInAngularVelocity = this.changeInEarthAngVel * (planet.density / earthDensity) * (equatorialRadiusInCm / earthRadius) * (earthMassInGrams / planetMassInGrams) * Math.pow(planet.sun.mass, 2) * (1 / Math.pow(planet.axis, 6));
    angVelocity       = baseAngularVelocity + (changeInAngularVelocity * planet.sun.age);

    if(angVelocity <= 0.0) {
      stopped = true;
      dayInHours = this.veryLargeNumber;
    }
    else {
      dayInHours = this.radiansPerRotation / (secondsPerHour * angVelocity);
    }

    if(dayInHours >= YearInHours || stopped) {
      if(planet.eccn > 0.1) {
        spinResonanceFactor   = (1 - planet.eccn) / (1 + planet.eccn);
        planet.resonantPeriod   = true;

        return spinResonanceFactor * YearInHours;
      }
      else {
        return YearInHours;
      }
    }

    return dayInHours;
  }
});
