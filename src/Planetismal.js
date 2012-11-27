function Planetismal(a, e, m, g) {
	this.axis 		= a;
	this.eccn 		= e;
	this.mass 		= m || Planetismal.protoplanetMass;
	this.gasGiant 	= g || false;
	// console.log(a, e)
	
	// this.print();
}

Planetismal.randomPlanetismal = function(inner, outer) {
	return new Planetismal((Math.random() * outer) + inner, DoleParams.randomEccentricity());
}

Planetismal.protoplanetMass = 1e-15; // Units of solar masses

Planetismal.prototype = Object.create({
	axis 			: 0, 		// Semi-major axis in AU
	eccn 			: 0,		
	mass 			: 0,
	gasGiant		: false,
	next			: null,

	perihelionDistance: function() {
		return DoleParams.perihelionDistance(this.axis, this.eccn);
	},

	aphelionDistance: function() {
		return DoleParams.aphelionDistance(this.axis, this.eccn);
	},

	reducedMass: function() {
		return DoleParams.reducedMass(this.mass)
	},

	reducedMargin: function() {
		return DoleParams.reducedMargin(this.mass);
	},

	innerEffectLimit: function() {
		return DoleParams.innerEffectLimit(this.axis, this.eccn, DoleParams.reducedMargin(this.mass));
	},

	outerEffectLimit: function() {
		return DoleParams.outerEffectLimit(this.axis, this.eccn, DoleParams.reducedMargin(this.mass));
	},

	innerSweptLimit: function() {
		return DoleParams.innerSweptLimit(this.axis, this.eccn, DoleParams.reducedMargin(this.mass));
	},

	outerSweptLimit: function() {
		return DoleParams.outerSweptLimit(this.axis, this.eccn, DoleParams.reducedMargin(this.mass));
	},

	criticalMass: function(luminosity) {
		return DoleParams.criticalMass(this.axis, this.eccn, luminosity);
	},

	getEarthMass: function() {
		return this.mass * Astro.solarMassEarthMass;
	},

	print: function() {
		console.log("== PLANETISMAL ==");
		console.log("Axis        :  " + this.axis);
		console.log("Eccentricity:  " + this.eccn);
		console.log("Mass 		 :  " + this.mass);
		console.log("Earth Masses:  " + this.getEarthMass());
		console.log("Gas Giant 	 :  " + this.gasGiant);
		console.log("");
	}
});
