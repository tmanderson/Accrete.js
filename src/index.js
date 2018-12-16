import StarSystem from "./StarSystem";

export { default as StarSystem } from "./StarSystem";

export const generatePlanets = () => {
  const system = new StarSystem();
  return system.create().planets;
};

generatePlanets().map(p => p.toJSON()).forEach(p => {
  if (p.orbitalRadius < 2) console.dir(p, { colors: true, depth: 2 });
});