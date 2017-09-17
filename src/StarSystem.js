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
    while(this.matter.hasDust && i++ < MAX_SYSTEM_ITERATIONS) {
      this.injectNucleus();
    }

    this.planets = this.planets.reduce((out, p) => {
      if(out.length < 1) return out.concat(p);
      let j = this.hasCollision(p, out);
      if(j >= 0) {
        return out.slice(0, j).concat(
          this.coalescePlanetismals(planetoid, out[i])
        );
      }
      return out.concat(p);
    }, []);

    return this;
  }

  injectNucleus() {
    const a = K * rand();
    const e = 1 - Math.pow(1 - rand(), Q);
    const n = new Planetismal(a, e);
    let p = 0, i = 0;

    while((p = this.matter.sweep(n)) > 0 && n.deltaMass > n.mass * 1e-4) {
      // if (!this.matter.containsDust(n.perihelion - n.xp, n.aphelion + n.xa, n.isGasGiant)) break;
      const t1 = (8 * Math.PI * Math.pow(n.a, N) * p * n.quadMass) / (1 - W * W);
      const t2 = (n.e + n.quadMass + W + W * n.e * n.quadMass);
      const newMass = (t1 * t2);
      this.matter.mass -= (newMass - n.mass);
      n.addMass(newMass - n.mass);
    }

    if(n.mass <= PROTOPLANET_MASS) return;
    if(this.planets.length < 2) return this.planets.push(n);

    let planetoid = n;
    let newPlanets = this.planets;

    while(newPlanets.length > 0 && (i = this.hasCollision(planetoid, newPlanets)) >= 0) {
      planetoid = this.coalescePlanetismals(planetoid, newPlanets[i]);
      newPlanets = newPlanets.slice(0, i).concat(newPlanets.slice(i + 1));
    }

    this.planets = newPlanets.concat(planetoid);
  }

  hasCollision(p1, planets = this.planets) {
    const p1_p = p1.perihelion - p1.xp;
    const p1_a = p1.aphelion + p1.xa;

    return planets.findIndex(p2 => {
      const p2_p = p2.perihelion - p2.xp;
      const p2_a = p2.aphelion + p2.xa;
      return p2_p < p1_a || p2_a > p1_p || p1_a < p2_p || p1_p < p2_a;
    });
  }

  coalescePlanetismals(p1, p2) {
    const a3 = (p1.mass + p2.mass) / (p1.mass / p1.a + p2.mass / p2.a);
    const num1 = Math.sqrt(p1.mass * p1.a) * Math.sqrt(1 - p1.e * p1.e);
    const num2 = Math.sqrt(p2.mass * p2.a) * Math.sqrt(1 - p2.e * p2.e);
    const term1 = Math.sqrt(num1 + num2) / Math.sqrt((p1.mass + p2.mass) * a3);
    const e3 = Math.sqrt(1 - Math.sqrt(term1 * term1));
    const m3 = p1.mass + p2.mass;

    return new Planetismal(a3, e3, m3);
  }
}
