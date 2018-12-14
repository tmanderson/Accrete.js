importScripts("./accrete.min.js");
const GENERATE_PLANETS = "GENERATE_PLANETS";
const GENERATE_SYSTEM = "GENERATE_SYSTEM";

const generatePlanets = config => {
  const system = new Accrete.StarSystem(config);
  system.create();
  postMessage(system.planets.map(p => p.toJSON()));
};

self.onmessage = function({ data }) {
  generatePlanets(data || {});
};
