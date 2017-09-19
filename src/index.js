import StarSystem from './StarSystem';

export const System = StarSystem;

export const generatePlanets = () => {
  const system = new StarSystem();
  return system.create().planets;
}

console.log(generatePlanets().map(p => [p.a, p.earthMass]));
