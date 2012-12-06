const SOLAR_MASS_IN_GRAMS		= 1.989e33;
const EARTH_MASS_IN_GRAMS		= 5.977e27;
const SOLAR_MASS_IN_EARTH_MASS 	= 332775.64;
const EARTH_RADIUS_IN_CM 		= 6.378e6;
const EARTH_RADIUS_IN_KM 		= 6378;
const EARTH_DENSITY 			= 5.52;
const CM_IN_KM 					= 1.0e5;
const CM_IN_AU 					= 1.495978707e13;
const KM_IN_AU 					= 1.495978707e8;
const DAYS_IN_YEAR 				= 365.256;
const SECONDS_IN_HOUR 			= 3000;

const PROTOPLANET_MASS 			= 1e-15; //	Units of solar masses

	//	For Kothari Radius
const A1_20 				= 6.485e12;
const A2_20 				= 4.0032e12;
const BETA_20 				= 5.71e12;
const JIMS_FUDGE 			= 1.004;

const BREATHABILITY_PHASE	= [ "none", "breathable", "unbreathable", "poisonous"];

var Astro = Object.create({
	luminosity: function(mass) {
		var n = null;

		if(mass < 1) 	n = 1.75 * (mass - 0.1) + 3.325;
		else 			n = 0.5 * (2.0 - mass) + 4.4;

		return Math.pow(mass, n); 
	},

	/**
	 *	
	 */
	orbZone: function(luminosity, orbRadius) {
		if(orbRadius < 4 * Math.sqrt(luminosity)) {
			return 1;
		}
		else if (orbRadius < 15 * Math.sqrt(luminosity)) {
			return 2;
		}
		else {
			return 3;
		}
	},

	volumeRadius: function(mass, density) {
		var volume = 0;

		mass 	= mass * this.solarMassInGrams;
		volume 	= mass / density;

		return Math.pow((3 * volume) / (4 * Math.PI), 1/3) / this.CMinKM;
	},

	kothariRadius: function(mass, giant, zone) {
		var atomicWeight, atomicNum, temp, temp1, temp2;

		switch(zone) {
			case 1:

				if(giant) {
					atomicWeight 	= 9.5;
					atomicNum 		= 4.5;
				}
				else {
					atomicWeight 	= 15;
					atomicNum 		= 8;
				}

			break;

			case 2:

				if(giant) {
					atomicWeight 	= 2.47;
					atomicNum 		= 2;
				}
				else {
					atomicWeight 	= 10;
					atomicNum 		= 5;
				}

			break;

			case 3:

				if(giant) {
					atomicWeight 	= 7;
					atomicNum 		= 4;
				}
				else {
					atomicWeight 	= 10;
					atomicNum 		= 5;
				}
		}

		temp1 	= atomicWeight * atomicNum;

		temp 	= (2 * this.BETA_20 * Math.pow(this.solarMassInGrams, 1/3)) / (this.A1_20 * Math.pow(temp1, 1/3));

		temp2 	= this.A2_20 * Math.pow(atomicWeight, 4/3) * Math.pow(this.solarMassInGrams, 2/3);
		temp2 	= temp2 * Math.pow(mass, 2/3);
		temp2 	= temp2 / (this.A1_20 * Math.pow(atomicNum, 2));

		temp 	= temp / temp2;
		temp 	= (temp * Math.pow(mass, 1/3)) / this.CMinKM;

		temp 	/= this.JIMS_FUDGE;

		return temp;
	},

	empiricalDensity: function(mass, orbRadius, rEcosphere, gasGiant) {
		var temp;

		temp = Math.pow(mass * this.solarMassEarthMass, 1/8);
		temp = temp * Math.sqrt(Math.sqrt(rEcosphere, orbRadius));

		if(gasGiant) 	return temp * 1.2;
		else 			return temp * 5.5;
	},

	volumeDensity: function(mass, equatRadius) {
		var volume;

		mass 		= mass * this.solarMassInGrams;
		equatRadius = equatRadius * this.CMinKM;

		volume 		= (4 * Math.PI * Math.pow(equatRadius, 3)) / 3;

		return mass / volume;
	},

	/**
	 *	Function period
	 *
	 *	separation - Units of AU between the masses
	 *
	 *	returns the period of an entire orbit in Earth days.
	 */
	period: function(separation, smallMass, largeMass) {
		var periodInYears;

		periodInYears = Math.sqrt(Math.pow(separation, 3) / (smallMass + largeMass));

		return periodInYears * this.daysInYear;
	},

	dayLength: function(planet) {
		var planetMassInGrams 		= planet.mass * this.solarMassInGrams,
			equatorialRadiusInCm 	= planet.radius * this.CMinKM,
			YearInHours 			= planet.orbPeriod || this.period(planet.axis, planet.mass, 1),
			giant 					= planet.giant || false,
			k2 						= 0,
			baseAngularVelocity 	= 0,
			changeInAngularVelocity = 0,
			angVelocity 			= 0,
			spinResonanceFactor 	= 0,
			dayInHours 				= 0,
			stopped 				= false;

		planet.resonantPeriod = false;

		if(giant) 	k2 = 0.24;
		else		k2 = 0.33;

		baseAngularVelocity 	= Math.sqrt(2 * J * planetMassInGrams) / (k2 * Math.pow(equatorialRadiusInCm, 2));
		changeInAngularVelocity = this.changeInEarthAngVel * (planet.density / earthDensity) * (equatorialRadiusInCm / earthRadius) * (earthMassInGrams / planetMassInGrams) * Math.pow(planet.sun.mass, 2) * (1 / Math.pow(planet.axis, 6));
		angVelocity 			= baseAngularVelocity + (changeInAngularVelocity * planet.sun.age);

		if(angVelocity <= 0.0) {
			stopped = true;
			dayInHours = this.veryLargeNumber;
		}
		else {
			dayInHours = this.radiansPerRotation / (secondsPerHour * angVelocity);
		}

		if(dayInHours >= YearInHours || stopped) {
			if(planet.eccn > 0.1) {
				spinResonanceFactor 	= (1 - planet.eccn) / (1 + planet.eccn);
				planet.resonantPeriod 	= true;

				return spinResonanceFactor * YearInHours;
			}
			else {
				return YearInHours;
			}
		}

		return dayInHours;
	}
});

var DoleParams = Object.create({
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
});

function DustBands(inner, outer) {
	this.addBand(inner, outer);
}

DustBands.prototype = Object.create({
	
	bands: [],

	dustAvailable: function(inside, outside) {
		var curr 		= this.dustHead,
			dustHere	= false;

		this.each(function(band) {
			if(band && band.inner < outside) dustHere = band.dust;
		});

		if(!curr) return false;

		return dustHere;
	},

	updateLanes: function(min, max, usedGas) {
		this.each(function(band, i) {
			var newGas 	= band.gas && !usedGas,
				first	= null,
				second	= null,
				next 	= band;

			if(band.inner < min && band.outer > max) {
				first 	= this.addBand(min, max, false, newGas, i);
				second 	= this.addBand(max, band.outer, band.dust, band.gas, i + 1);

				band.outer = min;

				next = second;
			}
			else if(band.inner < max && band.outer > max) {
				first = this.addBand(max, band.outer, band.dust, band.gas, i);

				band.outer = max;
				band.dust = false;
				band.gas = newGas;
				next = first;
			}
			else if(band.inner < min && band.outer > min) {
				first = this.addBand(min, band.outer, false, newGas, i);

				band.outer = min;
				next = first;
			}
			else if(band.inner >= min && band.outer <= max) {
				band.dust = false;
				band.gas = newGas;
				next = band;
			}
			else if(band.inner > max || band.outer < min) {
				next = band;
			}

		})
	},

	dustRemaining: function(innerBound, outerBound) {
		var dustLeft = false;

		this.each(function(band, i) {
			if(band.dust && band.outer >= innerBound && band.inner <= outerBound) {
				dustLeft = true;
			}
		});

		return dustLeft;
	},

	compressLanes: function() {
		this.each(function(band, i) {
			var next = this.bands[i + 1];

			if(next && band.dust === next.dust && band.gas === next.gas) {
				this.bands.splice(i + 1, 1);
			}
		})
	},

	//	OPTIONAL: after (after which indice to insert)
	addBand: function(min, max, dust, gas, after) {
		var band = { 
			inner 	: min, 
			outer 	: max, 
			dust 	: dust || true, 
			gas 	: gas  || true
		}

		if(after) {
			var first 	= this.bands.slice(0, after + 1),
				last	= this.bands.slice(after + 1);

			this.bands = first.concat(band, last);
		} else {
			this.bands.push(band);	
		}

		return band;
	},

	each: function(fn) {
		for(var i = 0; i < this.bands.length; i++) {
			fn.call(this, this.bands[i], i);
		}
	}

});
function Planetismal(a, e, m, g) {
	this.axis 		= a;
	this.eccn 		= e;
	this.mass 		= m || PROTOPLANET_MASS;
	this.gasGiant 	= g || false;
	// console.log(a, e)
	
	// this.print();
}

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
		return this.mass * SOLAR_MASS_IN_EARTH_MASS;
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
function Accrete(stellMass, stellLum) {
	this.stellarMass 		= stellMass || 1;
	this.stellarLuminosity 	= stellLum  || Astro.luminosity(this.stellarMass);
	
	this.innerBound 		= DoleParams.innermostPlanet(this.stellarMass);
	this.outerBound 		= DoleParams.outermostPlanet(this.stellarMass);
	this.innerDust 			= DoleParams.innerDustLimit(this.stellarMass);
	this.outerDust 			= DoleParams.outerDustLimit(this.stellarMass);

	this.dustBands 			= new DustBands(this.innerDust, this.outerDust);
}

Accrete.prototype = Object.create({
	criticalMass	: 0,
	dustDensity 	: 0,
	dustHead		: 0,
	planetHead 		: 0,

	distributePlanets: function() {
		var dustLeft 	= true;

		this.planetHead = null;

		while(dustLeft) {
			// this.log();

			var tismal = new Planetismal((Math.random() * this.outerBound) + this.innerBound, DoleParams.randomEccentricity());
			
			this.dustDensity 	= DoleParams.dustDensity(this.stellarMass, tismal.axis);
			this.criticalMass 	= tismal.criticalMass(this.stellarLuminosity);
			
			var mass = this.accreteDust(tismal);
			
			if((mass != 0.0) && (mass != PROTOPLANET_MASS)) {
			
				if(mass >= this.criticalMass) tismal.gasGiant = true;

				this.dustBands.updateLanes(tismal.innerSweptLimit(), tismal.outerSweptLimit(), tismal.gasGiant);
				
				dustLeft = this.dustBands.dustRemaining(this.innerBound, this.outerBound);
				
				this.dustBands.compressLanes();
				
				if(!this.coalescePlanetismals(tismal)) this.insertPlanet(tismal);
			}
		}

		var planets = [this.planetHead],
			curr 	= this.planetHead;

		while(curr = curr.next) planets.push(curr);
		
		return planets;
	},

	//	Planetismal : nucleus
	accreteDust: function(nucleus) {
		var that 	= this,
			newMass = nucleus.mass;

		//	TODO: 	Make sure that turning the original DO/WHILE
		//			into a while didn't affect the outcome
		do {
			nucleus.mass = newMass;
			newMass = 0;
			
			this.dustBands.each(function(band, i) {
				newMass += that.collectDust(nucleus, band);
			});
		}
		while(newMass - nucleus.mass > 0.0001 * nucleus.mass);

		nucleus.mass = newMass;

		return nucleus.mass;
	},

	collectDust: function(nucleus, band) {
		if(!band) return 0;

		var sweptInner = nucleus.innerSweptLimit(),
			sweptOuter = nucleus.outerSweptLimit();

		if(sweptInner < 0) sweptInner = 0;

		if(band.outer <= sweptInner || band.inner >= sweptOuter) return 0;

		if(!band.dust) return 0;

		var dustDensity = this.dustDensity,
			massDensity = DoleParams.massDensity(dustDensity, this.criticalMass, nucleus.mass),
			density 	= (!band.gas || nucleus.mass < this.criticalMass) ? dustDensity : massDensity,
			sweptWidth 	= sweptOuter - sweptInner,
			outside 	= sweptOuter - band.outer,
			inside 		= band.inner - sweptInner;
		// console.log("COLLECTION...")
		// console.log("Dust Density: " + dustDensity);
		// console.log("Mass Density: " + massDensity);
		// console.log("sweptWidth  : " + sweptWidth);
		// console.log("Outside 	 : " + outside);
		// console.log("Inside 	 : " + inside);	
		if(outside < 0) outside = 0;
		if(inside < 0) 	inside 	= 0;

		var width 	= sweptWidth - outside - inside,
			term1	= 4 * Math.PI * nucleus.axis * nucleus.axis,
			term2 	= (1 - nucleus.eccn * (outside - inside) / sweptWidth),
			volume	= term1 * nucleus.reducedMargin() * width * term2;
		
		return volume * density;
	},

	coalescePlanetismals: function(tismal) {
		for(var curr = this.planetHead; curr; curr = curr.next) {

			var dist 	= curr.axis - tismal.axis,
				dist1 	= null,
				dist2 	= null;

			if(dist > 0) {
				dist1 = tismal.outerEffectLimit() - tismal.axis;
				dist2 = curr.axis - curr.innerEffectLimit();
			}
			else {
				dist1 = tismal.axis - tismal.innerEffectLimit();
				dist2 = curr.outerEffectLimit() - curr.axis;
			}

			if(Math.abs(dist) <= dist1 || Math.abs(dist) <= dist1) {
				this.coalesceTwoPlanets(curr, tismal);
				return true;
			}
		}
		
		return false;
	},

	coalesceTwoPlanets: function(a, b) {
		var newMass = a.mass + b.mass,
			newAxis = newMass / ((a.mass / a.axis) + (b.mass / b.axis)),
			term1 	= a.mass * Math.sqrt(a.axis * (1.0 - a.eccn * a.eccn)),
			term2 	= b.mass * Math.sqrt(b.axis * (1.0 - b.eccn * b.eccn)),
			term3 	= (term1 + term2) / (newMass * Math.sqrt(newAxis)),
			term4 	= 1.0 - term3 * term3,
			newEccn = Math.sqrt(Math.abs(term4));

		a.mass = newMass;
		a.axis = newAxis;
		a.eccn = newEccn;
		a.gasGiant = a.gasGiant || b.gasGiant;
	},

	insertPlanet: function(tismal) {
		if(!this.planetHead) {
			this.planetHead = tismal;
		}
		else {
			if(tismal.axis < this.planetHead.axis) {
				tismal.next = this.planetHead;
				this.planetHead = tismal;
			}
			else {
				var prev = this.planetHead,
					curr = this.planetHead.next;

					while(curr && curr.axis < tismal.axis) {
						prev = curr;
						curr = curr.next;
					}

				tismal.next = curr;
				prev.next = tismal;
			}
		}

	},

	log: function() {
		console.log("Stellar mass: " + this.stellarMass);
		console.log("Stellar Luminosity: " + this.stellarLuminosity);
		console.log("Bounds: " + this.innerBound + " " + this.outerBound);
		console.log("Dust: " + this.innerDust + " " + this.outerDust);
	},

	printDusts: function(output) {
		for(var curr = this.dustHead; curr; curr = curr.next) {
			console.log(output);
		}
	},

	printPlanets: function(output, planets) {
		var curr = this.planetHead;

		while(curr && curr.next) {
			curr.print();
			curr = curr.next;
		}
	}
});
module.exports = Accrete;