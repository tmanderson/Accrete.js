import StarSystem from './StarSystem';

export default StarSystem;

export const generatePlanets = () => {
  const system = new StarSystem();
  return system.create().planets;
}


console.log(generatePlanets().map(p => [p.a, p.earthMass]).sort(([d1, m1], [d2, m2]) => d1-d2))
