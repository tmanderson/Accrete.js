function DustBand(innerLimit, outerLimit, dustPresent, gasPresent) {
	this.inner 	= innerLimit;
	this.outer 	= outerLimit;
	this.dust 	= dustPresent;
	this.gas 	= gasPresent;

	if(this.dust === undefined) this.dust = true;
	if(this.gas === undefined) this.gas = true;

	// this.print();
}

DustBand.prototype = Object.create({
	//	Inner edge in AU
	inner 	: null,
	//	Outer edge in AU
	outer 	: null,
	dust 	: true,
	gas		: true,
	next 	: null,

	print: function() {
		console.log("== DUST BAND ==");
		console.log("Inner: " + this.inner);
		console.log("Outer: " + this.outer);
		console.log("Dust:  " + this.dust);
		console.log("Gas:   " + this.gas);
	}
});