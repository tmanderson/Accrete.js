var DoleParams = {
	B: 1.2e-5, 					// For critical mass

	K: 50, 						// Dust/gas ratio

	dustDensityCoeff : 1.5e-3, 	// A in Dole's paper
	cloudEccentricity: 0.25,
	eccentricityCoeff: 0.077,

	//	ALPHA and N both used in density calculations
	ALPHA: 5,
	N: 3,

	criticalMass: function(radius, eccentricity, luminosity) {
		return (this.B * Math.pow(this.perihelionDistance(radius, eccentricity) * Math.sqrt(luminosity), -0.75));
	},

	/**
	 *	function perihelionDistance
	 *	
	 *	returns the distance between the orbiting body and the
	 *	sun at it's closest approach.
	 */
	perihelionDistance: function(radius, eccentricity) {
		return radius * (1 - eccentricity);
	},

	/**
	 *	function apheliondistance
	 *
	 *	returns the distance between the orbiting body and the
	 *	sun at it's furthest approach.
	 */
	aphelionDistance: function(radius, eccentricity) {
		return radius * (1 - eccentricity);
	},

	reducedMass: function(mass) {
		return mass / (1 + mass)
	},

	reducedMargin: function(mass) {
		return Math.pow(this.reducedMass(mass), 1/4);
	},

	lowBound: function(inner) {
		return inner / (1 + this.cloudEccentricity);
	},

	highBound: function(outer) {
		return outer / (1.0 - this.cloudEccentricity);
	},

	innerEffectLimit: function(a, e, m) {
		return this.perihelionDistance(a, e) * (1 - m);
	},

	outerEffectLimit: function(a, e, m) {
		return this.aphelionDistance(a, e) * (1 + m);
	},

	innerSweptLimit: function(a, e, m) {
		//	TODO: 	Not sure quite yet if we're interacting with this in a
		//			way where we can't call innerEffectLimit here...
		return this.lowBound(this.innerEffectLimit(a, e, m));
	},

	outerSweptLimit: function(a, e, m) {
		//	TODO: 	Read comment above
		return this.highBound(this.outerEffectLimit(a, e, m));
	},

	dustDensity: function(stellarMass, oribitalRadius) {
		return this.dustDensityCoeff * Math.sqrt(stellarMass) * Math.exp(-this.ALPHA * Math.pow(oribitalRadius, 1/this.N));
	},

	massDensity: function(dustDensity, criticalMass, mass) {
		return this.K * dustDensity / (1 + Math.sqrt(criticalMass / mass) * (this.K - 1));
	},

	scaleCubeRootMass: function(scale, mass) {
		return scale * Math.pow(mass, 1/3);
	},

	innerDustLimit: function(stellarMass) {
		return 0;
	},

	outerDustLimit: function(stellarMass) {
		return this.scaleCubeRootMass(200, stellarMass);
	},

	innermostPlanet: function(stellarMass) {
		return this.scaleCubeRootMass(0.3, stellarMass);
	},

	outermostPlanet: function(stellarMass) {
		return this.scaleCubeRootMass(50, stellarMass);
	},

	randomEccentricity: function() {
		return (1 - Math.pow(Math.random(), this.eccentricityCoeff));
	}
}
