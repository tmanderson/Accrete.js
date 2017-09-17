export const rand = (min = 0, max = min + 1, n = 2) => {
	const vals = new Uint16Array(Math.round(n));

	if (typeof module !== 'undefined' && module.exports) {
		let i = Math.round(n);
		while(i-- > 0) vals[i] = parseInt(require('crypto').randomBytes(2).toString('hex'), 16);
	}
	else {
		crypto.getRandomValues(vals);
	}

	return Math.max(
		min,
		Math.min(max, max * vals.reduce((out, v) => out + (v/65536), 0)/n)
	);
}

// no n-1 business, since we're usin' arrays here!
export const Γ = n => (new Array(Math.round(n))).fill(1).map((_, i) => i || _).reduce((total, v) => total *= v);

/**
	THESE ARE CONFIGURABLE WITH THE OPTIMAL (most like our solar system) VALUES:
		A = 0.0015, K =  50, ⍺ = 5, n = 3
**/

// Initial mass-of-matter in Solar masses per cubic A.U. "dust density coeff"
export const A = 1.5 * 10e-4;
// The dust-to-gas ratio (dust/gas = K)
export const K = 50;
// Eccentricity of dust cloud
export const W = 0.25; // 0.2 - 0.25;
// Negative exponential coefficient (EXPLANATION?) used in calculating dust density
export const a = 5;
// Used in calculating dust density (as the nth root of the radius, r)
export const n = 3;
// Used to calculate the eccentricity of planetary nuclei
// (Dole states this conforms to an empirical probability function for distribution
// of orbital eccentricities)
export const Q = 0.077; // eccentricity = 1 - (1 - RAND[0, 1]) ^ Q
export const B = 1.2e-5; //0.000012; // For critical mass

/** DO NOT CHANGE these constants (as they don't provide consistent variation) **/
// Maximum angular inclination of dust cloud
export const ϴ = Math.PI/2.01; // ~90 degrees
// Total mass of cloud in terms of solar mass
export const M = 0.0584 * Math.cos(Math.PI/2 - ϴ)
// Used as the `nth` root
export const N = n;
// When the mass with given radius, eccentricity in a system with star of luminosity
// hits "critical mass" in which dust AND gas is collected by its forces
export const criticalMass = (radius, eccentricity, luminosity) => {
	// cube root of
	return (
		B * Math.pow(
			this.perihelionDistance(radius, eccentricity) * Math.sqrt(luminosity),
			-1/N
		)
	);
}

// 	/**
// 	 *	function perihelionDistance
// 	 *
// 	 *	returns the distance between the orbiting body and the
// 	 *	sun at it's closest approach.
// 	 */
// 	perihelionDistance: function(radius, eccentricity) {
// 		return radius * (1 - eccentricity);
// 	},

// 	/**
// 	 *	function apheliondistance
// 	 *
// 	 *	returns the distance between the orbiting body and the
// 	 *	sun at it's furthest approach.
// 	 */
// 	aphelionDistance: function(radius, eccentricity) {
// 		return radius * (1 + eccentricity);
// 	},

// 	reducedMass: function(mass) {
// 		return mass / (1 + mass)
// 	},

// 	reducedMargin: function(mass) {
// 		return Math.pow(this.reducedMass(mass), 1/4);
// 	},

// 	lowBound: function(inner) {
// 		return inner / (1 + W);
// 	},

// 	highBound: function(outer) {
// 		return outer / (1.0 - W);
// 	},

// 	innerEffectLimit: function(a, e, m) {
// 		// CHANGE THE `1` in a lot of these cases to the STELLAR MASS
// 		return this.perihelionDistance(a, e) * (1 - m);
// 	},

// 	outerEffectLimit: function(a, e, m) {
// 		return this.aphelionDistance(a, e) * (1 + m);
// 	},

// 	innerSweptLimit: function(a, e, m) {
// 		//	TODO: 	Not sure quite yet if we're interacting with this in a
// 		//			way where we can't call innerEffectLimit here...
// 		return this.lowBound(this.innerEffectLimit(a, e, m));
// 	},

// 	outerSweptLimit: function(a, e, m) {
// 		//	TODO: 	Read comment above
// 		return this.highBound(this.outerEffectLimit(a, e, m));
// 	},

// 	dustDensity: function(stellarMass, oribitalRadius) {
// 		return A * Math.sqrt(stellarMass) * Math.exp(-⍺ * Math.pow(oribitalRadius, 1/N));
// 	},

// 	massDensity: function(dustDensity, criticalMass, mass) {
// 		return (K * dustDensity) / (1 + Math.sqrt(criticalMass / mass) * (K - 1));
// 	},

// 	scaleCubeRootMass: function(scale, mass) {
// 		return scale * Math.pow(mass, 1/3);
// 	},

// 	innerDustLimit: function(stellarMass) {
// 		return 0;
// 	},

// 	outerDustLimit: function(stellarMass) {
// 		return this.scaleCubeRootMass(200, stellarMass);
// 	},

// 	innermostPlanet: function(stellarMass) {
// 		// 0.3 AU
// 		return this.scaleCubeRootMass(0.3, stellarMass);
// 	},
// 	// 50 AU
// 	outermostPlanet: function(stellarMass) {
// 		return this.scaleCubeRootMass(50, stellarMass);
// 	},

// 	randomEccentricity: function() {
// 		return (1 - Math.pow(1 - rand(), Q));
// 	}
// });
