var Accrete = require('./accrete.js');

var gen 	= new Accrete(),
	sys 	= gen.distributePlanets();

console.log(sys)

for(var p in sys) {
	var au 	= Math.log(sys[p].axis + 1) / Math.log(10),
		rad = Math.pow(sys[p].getEarthMass(), 1/3);

	console.log(rad * 10)
}

// Planetismal curr = (Planetismal)e.nextElement();
//             double au = log10(curr.getOrbitalAxis());
//             double rad = Math.pow(curr.getMassEarth(), 1.0/3.0);
//             int r = (int)(rad * (double)rscale);
//             int x0 = (int)(au * (double)hscale);
//             int x = x0 + hscale - r;
//             int y = vscale - r;
//             if (curr.isGasGiant()) 
//                 g.drawOval(x, y, 2*r, 2*r);
//             else
//                 g.fillOval(x, y, 2*r, 2*r);
//         }