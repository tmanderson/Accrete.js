import { N, K, W, Q, PROTOPLANET_MASS, MAX_SYSTEM_ITERATIONS } from './constants';
import { rand } from './utils';
import DustCloud from './DustCloud';
import Planetismal from './Planetismal';

export default class StarSystem {
  constructor(stellarMass) {
    this.mass = 1;
    this.luminosity = 1;
    this.planets = [];
    this.matter = new DustCloud(this.luminosity);
  }

  create() {
    let i = 0;
    while(this.matter.hasDust && this.matter.mass > 0 && i++ < MAX_SYSTEM_ITERATIONS) this.injectNucleus();
    console.log(this.matter.mass);
    return this;
  }

  injectNucleus() {
    const a = Math.max(0.3, K * rand());
    const e = 1 - Math.pow(1 - rand(), Q);
    const n = new Planetismal(a, e);
    let p = 0;

    while((p = this.matter.sweep(n)) > 0) {
      const t1 = (8 * Math.PI * Math.pow(n.a, N) * p * n.quadMass) / (1 - W * W);
      const t2 = (n.e + n.quadMass + W + W * n.e * n.quadMass);
      const newMass = (t1 * t2);
      n.addMass(newMass - n.mass);
      this.matter.mass -= n.deltaMass;
      if(n.deltaMass < n.mass * 1e-5) break;
    }
    // TODO: track successive "duds", use this to break instead of top-level loop cap (MAX_SYSTEM_ITERATIONS)
    if(n.mass <= PROTOPLANET_MASS) return;

    this.planets.unshift(n);

    this.planets = this.planets.reduce((out, p, i) => {
      const collisionIdx = this.hasCollision(p, out);
      if(i >= 1 && collisionIdx >= 0) {
        return out.slice(0, collisionIdx)
          .concat(this.coalescePlanetismals(p, this.planets[collisionIdx]))
          .concat(out.slice(collisionIdx, 1));
      }
      else {
        return out.concat(p);
      }
    }, []);
  }

  hasCollision(p1, planets = this.planets) {
    const p1_p = p1.perihelion - p1.xp;
    const p1_a = p1.aphelion + p1.xa;

    return planets.findIndex(p2 => {
      const p2_p = p2.perihelion - p2.xp;
      const p2_a = p2.aphelion + p2.xa;
      return p1_a >= p2_a && p1_p <= p2_p || p2_a >= p1_a && p2_p <= p1_p;
    });
  }

  coalescePlanetismals(p1, p2) {
    const a3 = (p1.mass + p2.mass) / (p1.mass / p1.a + p2.mass / p2.a);
    const num1 = p1.mass * Math.sqrt(p1.a) * Math.sqrt(1 - p1.e * p1.e);
    const num2 = p2.mass * Math.sqrt(p2.a) * Math.sqrt(1 - p2.e * p2.e);
    const term1 = Math.sqrt(num1 + num2) / Math.sqrt(((p1.mass + p2.mass) * a3));
    const e3 = Math.sqrt(Math.abs(1 - term1 * term1));
    const m3 = p1.mass + p2.mass;
    return new Planetismal(a3, e3, m3);
  }
}
