// Currently using this to limit extreme precision when creating star systems.
export const MAX_SYSTEM_ITERATIONS = 100000;
/*
  Optimal perameters as specified in Dole's paper: A = 0.0015, K =  50, ⍺ = 5, n = 3
*/
// Initial mass-of-matter in solar masses per cubic A.U. (`A` in Dole's paper)
export const A = 0.0015; // Dole's paper tests ranges between 0.00125 and 0.0015
// The dust-to-gas ratio (dust/gas = K)
export const K = 50; // 100, 50
// Eccentricity of dust cloud
export const W = 0.2; // 0.15 to 0.25;
// Negative exponential coefficient (EXPLANATION?) used in calculating dust density
export const α = 5; // alpha in Dole's paper
// Used in calculating dust density (as the nth root of the radius, r)
export const N = 3;
// Used to calculate the eccentricity of planetary nuclei
// (Dole states this conforms to an empirical probability function for distribution
// of orbital eccentricities)
export const Q = 0.077;
// For critical mass
export const B = 1.2e-5; // 1e-5 to 1.2e-5
// Maximum angular inclination of dust cloud (Dole specifies as ~90 degrees)
export const ϴ = Math.PI / 2.01;

// STAR GEN PARAMS
export const ECCENTRICITY_COEFF = 0.077; /* Dole's was 0.077     */
export const PROTOPLANET_MASS = 1.0e-15; /* Units of solar masses  */
export const CHANGE_IN_EARTH_ANG_VEL = -1.3e-15; /* Units of radians/sec/year*/
export const SOLAR_MASS_IN_GRAMS = 1.989e33; /* Units of grams     */
export const SOLAR_MASS_IN_KILOGRAMS = 1.989e30; /* Units of kg        */
export const SOLAR_MASS_IN_EARTH_MASS = 332775.64;
export const EARTH_MASS_IN_GRAMS = 5.977e27; /* Units of grams     */
export const EARTH_RADIUS = 6.378e8; /* Units of cm        */
export const EARTH_DENSITY = 5.52; /* Units of g/cc      */
export const KM_EARTH_RADIUS = 6378.0; /* Units of km        */
//      EARTH_ACCELERATION    (981.0)     /* Units of cm/sec2     */
export const EARTH_ACCELERATION = 980.7; /* Units of cm/sec2     */
export const EARTH_AXIAL_TILT = 23.4; /* Units of degrees     */
export const EARTH_EXOSPHERE_TEMP = 1273.0; /* Units of degrees Kelvin  */
export const ASTEROID_MASS_LIMIT = 0.001; /* Units of Earth Masses  */
export const EARTH_EFFECTIVE_TEMP = 255.0; /* Units of degrees Kelvin (was 255)  */
export const CLOUD_COVERAGE_FACTOR = 1.839e-8; /* Km2/kg         */
export const EARTH_WATER_MASS_PER_AREA = 3.83e15; /* grams per square km    */
export const EARTH_SURF_PRES_IN_MILLIBARS = 1013.25;
export const EARTH_SURF_PRES_IN_MMHG = 760; /* Dole p. 15       */
export const EARTH_SURF_PRES_IN_PSI = 14.696; /* Pounds per square inch */

export const MMHG_TO_MILLIBARS =
  EARTH_SURF_PRES_IN_MILLIBARS / EARTH_SURF_PRES_IN_MMHG;
export const PSI_TO_MILLIBARS =
  EARTH_SURF_PRES_IN_MILLIBARS / EARTH_SURF_PRES_IN_PSI;
export const H20_ASSUMED_PRESSURE =
  47.0 * MMHG_TO_MILLIBARS; /* Dole p. 15      */
export const MIN_O2_IPP = 72.0 * MMHG_TO_MILLIBARS; /* Dole, p. 15        */
export const MAX_O2_IPP = 400.0 * MMHG_TO_MILLIBARS; /* Dole, p. 15        */
export const MAX_HE_IPP = 61000.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16      */
export const MAX_NE_IPP = 3900.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_N2_IPP = 2330.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_AR_IPP = 1220.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_KR_IPP = 350.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_XE_IPP = 160.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_CO2_IPP = 7.0 * MMHG_TO_MILLIBARS; /* Dole, p. 16        */
export const MAX_HABITABLE_PRESSURE =
  118 * PSI_TO_MILLIBARS; /* Dole, p. 16    */
// The next gases are listed as poisonous in parts per million by volume at 1 atm:
export const PPM_PRSSURE = EARTH_SURF_PRES_IN_MILLIBARS / 1000000.0;
export const MAX_F_IPP = 0.1 * PPM_PRSSURE; /* Dole, p. 18        */
export const MAX_CL_IPP = 1.0 * PPM_PRSSURE; /* Dole, p. 18        */
export const MAX_NH3_IPP = 100.0 * PPM_PRSSURE; /* Dole, p. 18        */
export const MAX_O3_IPP = 0.1 * PPM_PRSSURE; /* Dole, p. 18        */
export const MAX_CH4_IPP = 50000.0 * PPM_PRSSURE; /* Dole, p. 18        */

export const EARTH_CONVECTION_FACTOR = 0.43; /* from Hart, eq.20     */
//      FREEZING_POINT_OF_WATER (273.0)     /* Units of degrees Kelvin  */
export const FREEZING_POINT_OF_WATER = 273.15; /* Units of degrees Kelvin  */
//      EARTH_AVERAGE_CELSIUS   (15.5)      /* Average Earth Temperature */
export const EARTH_AVERAGE_CELSIUS = 14.0; /* Average Earth Temperature */
export const EARTH_AVERAGE_KELVIN =
  EARTH_AVERAGE_CELSIUS + FREEZING_POINT_OF_WATER;
export const DAYS_IN_A_YEAR = 365.256; /* Earth days per Earth year*/
//    gas_retention_threshold = 5.0;      /* ratio of esc vel to RMS vel */
export const GAS_RETENTION_THRESHOLD = 6.0; /* ratio of esc vel to RMS vel */
export const GREENHOUSE_EFFECT_CONST = 0.9;

export const ICE_ALBEDO = 0.7;
export const CLOUD_ALBEDO = 0.52;
export const GAS_GIANT_ALBEDO = 0.5; /* albedo of a gas giant  */
export const AIRLESS_ICE_ALBEDO = 0.5;
export const EARTH_ALBEDO = 0.3; /* was .33 for a while */
export const GREENHOUSE_TRIGGER_ALBEDO = 0.2;
export const ROCKY_ALBEDO = 0.15;
export const ROCKY_AIRLESS_ALBEDO = 0.07;
export const WATER_ALBEDO = 0.04;

export const SECONDS_PER_HOUR = 3600.0;
export const CM_PER_AU = 1.495978707e13; /* number of cm in an AU  */
export const CM_PER_KM = 1.0e5; /* number of cm in a km   */
export const KM_PER_AU = CM_PER_AU / CM_PER_KM;
export const CM_PER_METER = 100.0;
export const MILLIBARS_PER_BAR = 1000.0;

export const GRAV_CONSTANT = 6.672e-8; /* units of dyne cm2/gram2  */
export const MOLAR_GAS_CONST = 8314.41; /* units: g*m2/(sec2*K*mol) */
export const J = 1.46e-19; /* Used in day-length calcs (cm2/sec2 g) */
export const INCREDIBLY_LARGE_NUMBER = 9.9999e37;

/*  Now for a few molecular weights (used for RMS velocity calcs):     */
/*  This table is from Dole's book "Habitable Planets for Man", p. 38  */

export const ATOMIC_HYDROGEN = 1.0; /* H   */
export const MOL_HYDROGEN = 2.0; /* H2  */
export const HELIUM = 4.0; /* He  */
export const ATOMIC_NITROGEN = 14.0; /* N   */
export const ATOMIC_OXYGEN = 16.0; /* O   */
export const METHANE = 16.0; /* CH4 */
export const AMMONIA = 17.0; /* NH3 */
export const WATER_VAPOR = 18.0; /* H2O */
export const NEON = 20.2; /* Ne  */
export const MOL_NITROGEN = 28.0; /* N2  */
export const CARBON_MONOXIDE = 28.0; /* CO  */
export const NITRIC_OXIDE = 30.0; /* NO  */
export const MOL_OXYGEN = 32.0; /* O2  */
export const HYDROGEN_SULPHIDE = 34.1; /* H2S */
export const ARGON = 39.9; /* Ar  */
export const CARBON_DIOXIDE = 44.0; /* CO2 */
export const NITROUS_OXIDE = 44.0; /* N2O */
export const NITROGEN_DIOXIDE = 46.0; /* NO2 */
export const OZONE = 48.0; /* O3  */
export const SULPH_DIOXIDE = 64.1; /* SO2 */
export const SULPH_TRIOXIDE = 80.1; /* SO3 */
export const KRYPTON = 83.8; /* Kr  */
export const XENON = 131.3; /* Xe  */

//  And atomic numbers, for use in ChemTable indexes
export const AN_H = 1;
export const AN_HE = 2;
export const AN_N = 7;
export const AN_O = 8;
export const AN_F = 9;
export const AN_NE = 10;
export const AN_P = 15;
export const AN_CL = 17;
export const AN_AR = 18;
export const AN_BR = 35;
export const AN_KR = 36;
export const AN_I = 53;
export const AN_XE = 54;
export const AN_HG = 80;
export const AN_AT = 85;
export const AN_RN = 86;
export const AN_FR = 87;

export const AN_NH3 = 900;
export const AN_H2O = 901;
export const AN_CO2 = 902;
export const AN_O3 = 903;
export const AN_CH4 = 904;
export const AN_CH3CH2OH = 905;

/*  The following defines are used in the kothari_radius function in  */
/*  file enviro.c.                            */
export const A1_20 = 6.485e12; /* All units are in cgs system.  */
export const A2_20 = 4.0032e-8; /*   ie: cm, g, dynes, etc.    */
export const BETA_20 = 5.71e12;

export const JIMS_FUDGE = 1.004;

/*   The following defines are used in determining the fraction of a planet  */
/*  covered with clouds in function cloud_fraction in file enviro.c.     */
export const Q1_36 = 1.258e19; /* grams  */
export const Q2_36 = 0.0698; /* 1/Kelvin */

export const FOGG_CONSTANT_OF_PROPORTION_1 = 14e4; // altered to retain match with stargen's value of 140k
export const FOGG_CONSTANT_OF_PROPORTION_2 = 75e3;
export const FOGG_CONSTANT_OF_PROPORTION_3 = 250;