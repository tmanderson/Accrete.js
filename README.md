# ACCRETE.js
### Planetary system creation simulation in the browser, or on server.

Accrete.js is a port of the awesome planetary system simulation algorithm, [Accrete](http://www.rand.org/pubs/papers/P4226.html) to JavaScript. Originally published* and partly programmed (via FORTRAN) by the amazing Stephen H. Dole. Almost a decade later Carl Sagan and Richard Isaacson refined Dole's model -- which shortly thereafter was also implemented in FORTRAN, and again elaborately and academically published by Martin Fogg.

The late 80's came and Matt Burdick brought this priceless program to the masses (via Turbo Pascal and C). Since then, many versions of *Accrete* have popped up around the internet, adding varying degrees of planetary specifics the most notable (and ingenious) being [Jim Burrow's](http://www.eldacur.com/~brons/) implementation [StarGen](http://www.eldacur.com/~brons/NerdCorner/StarGen/StarGen.html). [Ian Burrell's](http://znark.com/) [Java port](http://znark.com/create/accrete.html) is another great up-to-date example (and a huge help in Accrete.js).

### Goals
1. Build process for Browser/Node scripts and modules.
2. Implement a good chunk of [StarGen's](http://www.eldacur.com/~brons/NerdCorner/StarGen/StarGen.html) features.
3. Organize the codebase into a more modern, and JavaScript friendly structure.
4. Live WebGL view and screenshot options for created systems.
5. Other cool things to take advantage of this amazing program.

### Usage
Until I get the build process up and running (coming soon, I promise), you can read the "current status" section below, and once that's set, all you'll need is:

```
var gen 	= new Accrete();
	system 	= gen.distributePlanets();

for(var i = 0; i < system.length; i++) system[i].print();
```

That'll output the info on each planet in your system!

### Current Status
This was running in the browser, and then Node, and now it's in the middle. In the browser, just include the scripts like so:
```
<script src="Astro.js"></script>
<script src="DoleParams.js"></script>
<script src="DustBand.js"></script>
<script src="Planetismal.js"></script>
<script src="Accrete.js"></script>
```

In Node, each file can be a module, and the dependencies can be derived from the code. Sorry, a real browser/node codebase will be up soon, I promise!

### THANK YOU
Nothing here could have ever (ever, ever, ever) been done without the following amazing, generous, and brilliant people:

- Stephen H. Dole
- Carl Sagan
- Richard Isaacson
- Martin Fogg
- Matt Burdick
- Ian Burrell
- The many brilliant minds that have contributed their knowlege to, and insights into our awe-inspiring universe.

* The original Dole Paper can be [viewed here](http://www.rand.org/pubs/papers/2005/P4226.pdf).