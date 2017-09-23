import StarSystem from './StarSystem';

export const System = StarSystem;

export const generatePlanets = () => {
  const system = new StarSystem();
  return system.create().planets.map(p => Object.assign({}, p, { earthMass: p.earthMass }));
}

let isWorker;
try { window.navigator }
catch(e) { isWorker = !!self; }
if(isWorker) {
  self.onmessage = function() {
    postMessage(generatePlanets());
  }
}

// console.log(generatePlanets().map(p => [p.a, p.earthMass]).sort(([d1], [d2]) => d1 - d2));
