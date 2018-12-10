import { Q, PROTOPLANET_MASS, MAX_SYSTEM_ITERATIONS } from "./constants";
import { rand } from "./utils";
import DustCloud from "./DustCloud";
import Planetismal from "./Planetismal";

export default class StarSystem {
  constructor() {
    this.mass = 1;
    this.luminosity = 1;
    this.matter = new DustCloud(this.luminosity);
    this.planets = [];
  }

  create() {
    let i = 0;

    while (this.matter.hasDust && i++ < MAX_SYSTEM_ITERATIONS) {
      this.injectNucleus();
      this.planets = this.checkCollisions(this.planets);
      // cmdline output
      // process.stdout.write([
      //   String.fromCharCode(27) + '[2K',
      //   String.fromCharCode(27) + '[0G',
      //   100*i/MAX_SYSTEM_ITERATIONS + '%'
      // ].join(''));
    }
    return this;
  }

  injectNucleus() {
    const a = rand(
      0.3 * Math.pow(this.mass, 1 / 3),
      50.0 * Math.pow(this.mass, 1 / 3)
    );
    const e = 1 - Math.pow(1 - rand(), Q);
    const nucleus = new Planetismal(a, e);
    const planet = this.collectDust(nucleus);
    if (planet.mass > PROTOPLANET_MASS) this.planets.push(planet);
  }

  collectDust(n) {
    let p = this.matter.sweep(n);

    while (this.matter.containsDust(n) && p > 0) {
      n.addMass(p * n.sweepVolume());
      if (n.deltaMass < n.mass * 1e-4) return null;
      p = this.matter.sweep(n);
    }

    return n;
  }

  checkCollisions(planets = this.planets) {
    return planets.reduce((out, p, i) => {
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

    return planets.findIndex(
      p2 => p1_a > p2.ra - p1.xa && p1_p < p2.rp + p1.xp
    );
  }

  coalescePlanetismals(p1, p2) {
    const a3 = (p1.mass + p2.mass) / (p1.mass / p1.a + p2.mass / p2.a);
    const num1 = p1.mass * Math.sqrt(p1.a) * Math.sqrt(1 - p1.e * p1.e);
    const num2 =
      p2.mass * Math.sqrt(p2.a) * Math.sqrt(Math.sqrt(1 - p2.e * p2.e));
    const term1 = (num1 + num2) / ((p1.mass + p2.mass) * Math.sqrt(a3));
    const e3 = Math.sqrt(Math.abs(1 - term1 * term1));
    const m3 = p1.mass + p2.mass;
    return this.collectDust(new Planetismal(a3, e3, m3));
  }
}
