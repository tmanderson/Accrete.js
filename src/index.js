import StarSystem from "./StarSystem";

export const System = StarSystem;

let isWorker = false;
try {
  isWorker = !!self;
} catch (e) {
  console["error" in console ? "error" : "log"](`ERROR: ${e}`);
}

export const generatePlanets = () => {
  const system = new StarSystem();
  const planets = system.create().planets;
  if (isWorker)
    return planets.map(p =>
      Object.assign({}, { earthMass: p.earthMass, radius: p.radius }, p)
    );
  return planets;
};

if (isWorker) {
  self.onmessage = function() {
    postMessage(generatePlanets());
  };
}
