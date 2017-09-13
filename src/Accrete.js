import DustCloud from './DustCloud';
import Planetismal from './Planetismal';

class System {
	constructor(stellarMass, stellarLuminosity) {
		this.mass = stellarMass;
		this.luminosity = stellarLuminosity;
		this.matter = new DustCloud();
	}

	create() {
		while(this.matter.mass > 0) this.injectNucleus();
	}

	injectNucleus() {
		const n = new Planetismal();
		let dm = 1, i = 0;

		while(true && i++ < 10000) {
			const newMass = n.bandVolume() * this.matter.dustDensityAt(n.a);
			dm = (n.mass + newMass) - n.mass;
			if (dm <= 1e-5) break;
			n.mass += newMass;
			this.matter.mass -= newMass;
		}
	}
}

function Accrete(stellMass, stellLum) {
	this.stellarMass 		= stellMass || 1;
	this.stellarLuminosity 	= stellLum  || Astro.luminosity(this.stellarMass);

	this.innerBound 		= DoleParams.innermostPlanet(this.stellarMass);
	this.outerBound 		= DoleParams.outermostPlanet(this.stellarMass);
	this.innerDust 			= DoleParams.innerDustLimit(this.stellarMass);
	this.outerDust 			= DoleParams.outerDustLimit(this.stellarMass);
}

Accrete.prototype = Object.create({
	criticalMass	: 0,
	dustDensity 	: 0,
	planetHead 		: 0,
	dustBands		: null,

	distributePlanets: function() {
		var dustLeft 	= true;

		this.planetHead = null;

		this.dustBands = new DustBands(
			this.innerDust,
			this.outerDust
		);

		while(dustLeft) {
			var tismal = new Planetismal(
				(Math.random() * this.outerBound) + this.innerBound,
				DoleParams.randomEccentricity()
			);

			this.dustDensity 	= DoleParams.dustDensity(
				this.stellarMass,
				tismal.radius
			);

			this.criticalMass 	= tismal.criticalMass(this.stellarLuminosity);

			var mass = this.accreteDust(tismal);

			if((mass != 0.0) && (mass != PROTOPLANET_MASS)) {

				if(mass >= this.criticalMass) tismal.gasGiant = true;

				this.dustBands.updateLanes(
					tismal.innerSweptLimit(),
					tismal.outerSweptLimit(),
					tismal.gasGiant
				);

				dustLeft = this.dustBands.dustRemaining(
					this.innerBound,
					this.outerBound
				);

				this.dustBands.compressLanes();

				if(!this.coalescePlanetismals(tismal)) this.insertPlanet(tismal);
			}
		}

		var planets = [this.planetHead], curr 	= this.planetHead;

		while(curr = curr.next) planets.push(curr);

		return planets;
	},

	//	Planetismal : nucleus
	accreteDust: function(nucleus) {
		var that 	= this, newMass = nucleus.mass;

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

		if(outside < 0) outside = 0;
		if(inside < 0) 	inside 	= 0;

		var width 	= sweptWidth - outside - inside,
			term1	= 4 * Math.PI * nucleus.radius * nucleus.radius,
			term2 	= (1 - nucleus.eccn * (outside - inside) / sweptWidth),
			volume	= term1 * nucleus.reducedMargin() * width * term2;

		return volume * density;
	},

	coalescePlanetismals: function(tismal) {
		for(var curr = this.planetHead; curr; curr = curr.next) {

			var dist 	= curr.radius - tismal.radius,
				dist1 	= null,
				dist2 	= null;

			if(dist > 0) {
				dist1 = tismal.outerEffectLimit() - tismal.radius;
				dist2 = curr.radius - curr.innerEffectLimit();
			}
			else {
				dist1 = tismal.radius - tismal.innerEffectLimit();
				dist2 = curr.outerEffectLimit() - curr.radius;
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
			newAxis = newMass / ((a.mass / a.radius) + (b.mass / b.radius)),
			term1 	= a.mass * Math.sqrt(a.radius * (1.0 - a.eccn * a.eccn)),
			term2 	= b.mass * Math.sqrt(b.radius * (1.0 - b.eccn * b.eccn)),
			term3 	= (term1 + term2) / (newMass * Math.sqrt(newAxis)),
			term4 	= 1.0 - term3 * term3,
			newEccn = Math.sqrt(Math.abs(term4));

		a.mass = newMass;
		a.radius = newAxis;
		a.eccn = newEccn;
		a.gasGiant = a.gasGiant || b.gasGiant;
	},

	insertPlanet: function(tismal) {
		if(!this.planetHead) {
			this.planetHead = tismal;
		}
		else {
			if(tismal.radius < this.planetHead.radius) {
				tismal.next = this.planetHead;
				this.planetHead = tismal;
			}
			else {
				var prev = this.planetHead,
					curr = this.planetHead.next;

					while(curr && curr.radius < tismal.radius) {
						prev = curr;
						curr = curr.next;
					}

				tismal.next = curr;
				prev.next = tismal;
			}
		}

	}
});
