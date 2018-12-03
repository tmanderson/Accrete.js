const { generatePlanets } = require("../src");

console.log(
  generatePlanets()
    .map(p => [p.a, p.earthMass])
    .sort(([d1], [d2]) => d1 - d2)
);
