importScripts("./accrete.min.js");
const GENERATE_PLANETS = "GENERATE_PLANETS";
const GENERATE_SYSTEM = "GENERATE_SYSTEM";

const generatePlanets = () => {
  const system = new Accrete.StarSystem();
  system.create();
  postMessage(system.planets.map(p => p.toJSON()));
};

self.onmessage = function({ data: { command = GENERATE_PLANETS } }) {
  switch (command) {
    case GENERATE_PLANETS:
      generatePlanets();
      break;
    case GENERATE_SYSTEM:
      postMessage(new Accreete.StarSystem());
      break;
    default:
      postMessage("invalid command");
  }
};
