import { rand, K, W } from './DoleParams';

export default class Planetismal {
	get perihelion = () => this.a * (1 - this.e);
	get aphelion = () => this.a * (1 + this.e);

	get xp = () => this.perihelion * Math.pow(this.relativeMass, 1/4);
	get xa = () => this.aphelion * Math.pow(this.relativeMass, 1/4);

	get relativeMass = () => this.mass/(1 + this.mass);

	constructor(radius, eccentricity, mass = 10e-15, isGasGiant = false) {
		// semi-major axis
		this.a = 50 * rand();
		// orbital eccentricity
    this.e = 1 - Math.pow(1 - rand(), Q);

		this.mass = mass;
		this.radius = radius;
		this.isGasGiant = isGasGiant;
	}

	bandwidth() {
		const { aphelion, perihelion, xa, xp, mass } = this;

		const t1 = (W * (aphelion + xa))/(1 - W);
		const t2 = (W * (perihelion - xp))/(1 + W);

		return 2 * a * e + xa + xp + t1 + t2;
	}

	bandVolume() {
		return 2 * Math.PI * this.bandwidth() * (this.xa + this.xp);
	}

	addMass(m) {
		const newMass = this.mass + m;
		this.deltaMass = newMass - this.mass;
		this.mass = newMass;
		return this;
	}

	accumulate(cloud) {
		// const accumulatedMass = this.bandwidth() * cloud.densityAtDistance(this.a); // SEE IF THIS IS THE SAME!!

		const p = cloud.densityAtDistance(this.a);
		const cubeMass = Math.pow(this.relativeMass, 1/4);

		const num = (8 * Math.PI * Math.pow(this.a, 3) * p * cubeMass);
		const den = (1 - W * W);

		const newMass = (num/den) * (this.e * cubeMass + W + W * this.e * cubeMass);

		this.deltaMass = newMass - this.mass;
		this.mass = newMass;

		return newMass;
	}

	// The additional bandwidth swept by the planetismal due to gravitational forces
	attractionDistance(r) {
		return r * Math.pow(this.mass/(1 + this.mass), 1/4);
	}

	reducedMass() {
		return DoleParams.reducedMass(this.mass)
	}

	reducedMargin() {
		return DoleParams.reducedMargin(this.mass);
	}

	innerEffectLimit() {
		return DoleParams.innerEffectLimit(this.radius, this.eccn, DoleParams.reducedMargin(this.mass));
	}

	outerEffectLimit() {
		return DoleParams.outerEffectLimit(this.radius, this.eccn, DoleParams.reducedMargin(this.mass));
	}

	innerSweptLimit() {
		return DoleParams.innerSweptLimit(
			this.radius,
			this.eccn,
			DoleParams.reducedMargin(this.mass)
		);
	}

	outerSweptLimit() {
		return DoleParams.outerSweptLimit(this.radius, this.eccn, DoleParams.reducedMargin(this.mass));
	}

	criticalMass(luminosity) {
		return DoleParams.criticalMass(this.radius, this.eccn, luminosity);
	}

	getEarthMass() {
		return this.mass * SOLAR_MASS_IN_EARTH_MASS;
	}

};
