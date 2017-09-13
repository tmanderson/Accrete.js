import { A, a, Γ, K, n, ϴ, W } from './params';

export default class DustCloud {
	constructor(radius = 50, ratio = K) {
		this.radius = 50;
		this.ratio = ratio;

		let num = 4 * Math.PI * K * A * n * Γ(3 * n);
		let den = Math.pow(a, 3 * n);

		this.mass = num/den * Math.cos(Math.PI/2 - ϴ);
	}

	dustDensityAt(radialDistance) {
		return A * Math.exp(-a * Math.pow(radialDistance, 1 / n));
	}

	matterDensityAt(radialDistance) {
		return K * this.dustDensityAt(radialDistance);
	}
}

function DustBands(inner, outer) {
	this.addBand(inner, outer);
}

DustBands.prototype = Object.create({

	bands: [],

	dustAvailable: function(inside, outside) {
		var curr 		= this.dustHead,
			dustHere	= false;

		this.each(function(band) {
			if(band && band.inner < outside) dustHere = band.dust;
		});

		if(!curr) return false;

		return dustHere;
	},

	updateLanes: function(min, max, usedGas) {
		this.each(function(band, i) {
			var newGas 	= band.gas && !usedGas,
				first	= null,
				second	= null,
				next 	= band;

			if(band.inner < min && band.outer > max) {
				first 	= this.addBand(min, max, false, newGas, i);
				second 	= this.addBand(max, band.outer, band.dust, band.gas, i + 1);

				band.outer = min;

				next = second;
			}
			else if(band.inner < max && band.outer > max) {
				first = this.addBand(max, band.outer, band.dust, band.gas, i);

				band.outer = max;
				band.dust = false;
				band.gas = newGas;
				next = first;
			}
			else if(band.inner < min && band.outer > min) {
				first = this.addBand(min, band.outer, false, newGas, i);

				band.outer = min;
				next = first;
			}
			else if(band.inner >= min && band.outer <= max) {
				band.dust = false;
				band.gas = newGas;
				next = band;
			}
			else if(band.inner > max || band.outer < min) {
				next = band;
			}

		})
	},

	dustRemaining: function(innerBound, outerBound) {
		var dustLeft = false;

		this.each(function(band, i) {
			if(band.dust && band.outer >= innerBound && band.inner <= outerBound) {
				dustLeft = true;
			}
		});

		return dustLeft;
	},

	compressLanes: function() {
		this.each(function(band, i) {
			var next = this.bands[i + 1];

			if(next && band.dust === next.dust && band.gas === next.gas) {
				this.bands.splice(i + 1, 1);
			}
		})
	},

	//	OPTIONAL: after (after which indice to insert)
	addBand: function(min, max, dust, gas, after) {
		var band = {
			inner 	: min,
			outer 	: max,
			dust 	: dust || true,
			gas 	: gas  || true
		}

		if(after) {
			//	This is extremely bad for performance
			//	Make this better
			var first 	= this.bands.slice(0, after + 1),
				last	= this.bands.slice(after + 1);

			this.bands = first.concat(band, last);
		} else {
			this.bands.push(band);
		}

		return band;
	},

	each: function(fn) {
		for(var i = 0; i < this.bands.length; i++) {
			fn.call(this, this.bands[i], i);
		}
	}

});
