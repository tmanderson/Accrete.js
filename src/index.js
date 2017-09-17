import StarSystem from './StarSystem';

const system = new StarSystem();
system.create();

console.log(system.planets.map(p => [p.a, p.earthMass]).sort(([d1,m1], [d2,m2]) => d1-d2))
