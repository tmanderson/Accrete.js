import StarSystem from "./StarSystem";

export { default as StarSystem } from "./StarSystem";

export const generatePlanets = () => {
  const system = new StarSystem();
  return system.create().planets;
};
