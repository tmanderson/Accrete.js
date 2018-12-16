import * as C from "./constants";
import { rand } from "./utils";
import DustCloud from "./DustCloud";
import Planetismal from "./Planetismal";

export default class StarSystem {
  get ecosphereRadius() {
    return Math.sqrt(this.luminosity);
  }

  get greenhouseRadius() {
    return this.ecosphereRadius * C.GREENHOUSE_EFFECT_COST;
  }
  /**
   * Get the age of the system's star, in billions of years
   */
  get age() {
    // main sequence lifetime, billions of years
    const msl = 10 * this.mass / this.luminosity;
    return msl >= 6
      ? rand(1, 6)
      : rand(1, msl);
  }

  get luminosity() {
    const n = this.mass < 1
      ? 1.75 * (this.mass - 0.1) + 3.325
      : 0.5 * (2 - this.mass) + 4.4

    return Math.pow(this.mass, n);
  }

  constructor(config = {}) {
    this.config = Object.assign(
      {},
      {
        A: C.A,
        B: C.B,
        K: C.K,
        N: C.N,
        Q: C.Q,
        W: C.W,
        ALPHA: C.α
      },
      config
    );
    for (const k in this.config) {
      if (this.config.hasOwnProperty(k)) {
        console.log(`${k}: ${this.config[k]}`);
      }
    }

    this.mass = config.mass || 1;
    this.matter = new DustCloud(this);
    this.planets = [];
  }

  create() {
    let i = 0;
    while (this.matter.hasDust) {
      this.injectNucleus();
      this.planets = this.checkCollisions(this.planets);
      i += 1;
    }
    console.log(
      `Created system of ${this.planets.length} planets after ${i} iterations`
    );
    return this;
  }

  injectNucleus() {
    const a = rand(0.3, 50);
    const e = 1 - Math.pow(rand(), this.config.Q);
    const nucleus = new Planetismal(this, a, e);
    const planet = this.collectDust(nucleus);
    if (planet.mass > C.PROTOPLANET_MASS) this.planets.push(planet);
  }

  collectDust(n) {
    let newMass,
      p = this.matter.sweep(n);

    while (this.matter.containsDust(n) && p > 0) {
      newMass = n.massDensity(p);
      n.addMass(newMass - n.mass);
      if (n.deltaMass < n.mass * 1e-4) break;
      p = this.matter.sweep(n);
    }

    return n;
  }

  checkCollisions(planets = this.planets) {
    return planets.reduce((out, p) => {
      const collisionIdx = this.hasCollision(p, out);

      if (collisionIdx > -1) {
        return out
          .slice(0, collisionIdx)
          .concat(this.coalescePlanetismals(p, out[collisionIdx]))
          .concat(out.slice(collisionIdx + 1));
      }

      return out.concat(p);
    }, []);
  }

  hasCollision(p1, planets = this.planets) {
    const p1_p = p1.rp - p1.xp;
    const p1_a = p1.ra + p1.xa;

    return planets.findIndex(p2 => {
      const p2_p = p2.rp - p2.xp;
      const p2_a = p2.ra + p2.xa;
      return (p1_p < p2_a && p1_a > p2_p) || (p2_p < p1_a && p2_a > p1_p);
    });
  }

  coalescePlanetismals(p1, p2) {
    const a3 = (p1.mass + p2.mass) / (p1.mass / p1.a + p2.mass / p2.a);
    const num1 = p1.mass * Math.sqrt(p1.a) * Math.sqrt(1 - p1.e * p1.e);
    const num2 =
      p2.mass * Math.sqrt(p2.a) * Math.sqrt(Math.sqrt(1 - p2.e * p2.e));
    const term1 = (num1 + num2) / ((p1.mass + p2.mass) * Math.sqrt(a3));
    const e3 = Math.sqrt(Math.abs(1 - term1 * term1));
    const m3 = p1.mass + p2.mass;
    return this.collectDust(new Planetismal(this, a3, e3, m3));
  }
}
