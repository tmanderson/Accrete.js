THREE.TOUCH = {};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(document.body.offsetWidth, document.body.offsetHeight);
document.body.appendChild(renderer.domElement);

var oControls = new THREE.OrbitControls(camera, renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

function createCanvasMaterial(color, size) {
  const matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  const matContext = matCanvas.getContext('2d');
  // create exture object from canvas.
  const texture = new THREE.Texture(matCanvas);
  // Draw a circle
  const center = size / 2;
  matContext.beginPath();
  matContext.arc(center, center, size/2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = color;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
}

/**
 * Creates the system's star given solar-luminosity
 * @param  {Number} luminosity - solar luminosity of star
 */
function createStar(luminosity = 1.5) {
  //three.js adding objects:
  let color = '', r, g, b;

  if (luminosity > 1.5) {
    r = 255;
    g = 240;
    b = 200;
    color = `rgba(${r}, ${g}, ${b})`;
  }

  if (luminosity <= 1.5 && luminosity > 0.6) {
    r = 255;
    g = 220;
    b = 75;
    color = `rgba(${r}, ${g}, ${b})`;
  }

  if (luminosity < 0.6) {
    r = 255;
    g = 180;
    b = 50;
    color = `rgba(${r}, ${g}, ${b})`;
  }

  const light = new THREE.PointLight(color, 3, 40000);
  light.position.set(0, 0, 0);
  scene.add(light);

  const geometry = new THREE.TetrahedronGeometry(200, 5);

  var c = 0;

  for (let i = 0; i < geometry.faces.length; i++) {
    const face = geometry.faces[i];
    color = `rgba(${Math.floor(r - 15 * (1 - Math.random())/2)}, ${Math.floor(g - 25 * (1 - Math.random())/2)}, ${Math.floor(b - 45 * (1 - Math.random())/2)})`;
    face.color.set(color);
  }

  var noise = 5
  for(var i = 0; i < geometry.vertices.length; i++){
    const v = geometry.vertices[i];
    v.x += -noise/2 + Math.random()*noise;
    v.y += -noise/2 + Math.random()*noise;
    v.z += -noise/2 + Math.random()*noise;
  }

  return {
    color: { r, g, b },
    mesh: new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors }))
  };
}

var sun = createStar();
scene.add(sun.mesh);

const h = document.body.offsetHeight * (window.innerWidth < window.innerHeight ? window.innerWidth / window.innerHeight : 1);
const w = document.body.offsetWidth * (window.innerHeight < window.innerWidth ? window.innerHeight / window.innerWidth : 1);

function createPlanet(planet) {
  const segments = planet.isGasGiant ? 32 : 100;

  const baseColors = [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ];

  const radius = 50 * Math.max(0.75, Math.log10(planet.radius / 6378));

  const props = {
    radius,
    orbitRadius: 200 + 2 * radius + Math.sqrt(w*w+h*h) * planet.a / 50,
    mesh: null,
    axisRotation: planet.axialTilt,
    ring: null,
    color: {
      land: {
        r: baseColors[0],
        g: baseColors[1],
        b: baseColors[2]
      },
      water: {
        r: planet.isGasGiant ? baseColors[0] : Math.floor(Math.random() * 255),
        g: planet.isGasGiant ? baseColors[1] : Math.floor(Math.random() * 255),
        b: planet.isGasGiant ? baseColors[2] : Math.floor(Math.random() * 255),
      }
    }
  };
  console.log(radius, props.orbitRadius);
  const simplex = new SimplexNoise();
  const geometry = new THREE.SphereGeometry(Math.round(props.radius), segments, segments);

  for (let i = 0; i < geometry.faces.length; i += 2) {
    const face = geometry.faces[i];
    const choices = []
    const x = i % segments
    const y = Math.floor(i / segments)
    const colorChoice = simplex.noise2D(x / 30, y / 30) >= 0.1
      ? `rgb(${props.color.land.r}, ${props.color.land.g}, ${props.color.land.b})`
      : `rgb(${props.color.water.r}, ${props.color.water.g}, ${props.color.water.b})`;

    const face2 = geometry.faces[i+1];
    face.color.set(colorChoice);
    face2.color.set(colorChoice);
  }

  props.mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors }));
  /*
  var material = new THREE.MeshPhongMaterial({color: RGB(props.color.r, props.color.g, props.color.b)})
  props.mesh = new THREE.Mesh( geometry, material);
  */

  const t = Math.random() * Math.PI;
  props.mesh.position.x = Math.cos(t) * props.orbitRadius - Math.sin(t) * props.orbitRadius;
  props.mesh.position.z = Math.sin(t) * props.orbitRadius + Math.cos(t) * props.orbitRadius;

  //rotation
  props.mesh.rotation.x = props.axisRotation * Math.PI / 180;
  props.mesh.rotation.z = props.axisRotation * Math.PI / 180;
  scene.add(props.mesh);

  // Does the planet have a ring of debris?
  if (Math.random() >= 0.7) {
    props.ring = {};
    props.ring.count = 150,
    props.ring.particles = new THREE.Geometry(),
    props.ring.material = new THREE.PointsMaterial({
      size: 10,
      map: createCanvasMaterial(
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
        256
      ),
      transparent: true,
      depthWrite: false
    });

    // now create the individual particles
    for (var p = 0; p < props.ring.count; p++) {
      const x = props.radius * 1.5 + Math.floor(props.radius - props.radius * 2);
      const y = props.radius * 1.5 + Math.floor(props.radius - props.radius * 2);

      const particle = new THREE.Vector3(x, y, 0);
      // add it to the geometry
      props.ring.particles.vertices.push(particle);
      props.ring.rdeg = Math.floor(25 + Math.random() * 25) / 100 * Math.PI / 180;
    }

    // create the particle system
    props.ring.system = new THREE.Points(props.ring.particles, props.ring.material);
    // add it to the scene
    scene.add(props.ring.system);
    props.ring.system.rotation.x = 2 * Math.PI * Math.random();
    props.ring.system.rotation.y = 2 * Math.PI * Math.random();
  }

  // else {
  //   props.moonCount = randint(0, 10)
  //   props.moons = []
  //   for (var i = 0; i < props.moonCount; i++) {
  //     props.moons.push(newMoon(props.size, props.mesh.position, dfc, props.moonCount))
  //   }
  // }
  return props;
}

// function newMoon(size, position, dfc, num) {
//   gl = {}
//   gl.size = (size / 2) / (num)
//   gl.dfc = dfc
//   gl.size = randoffset(gl.size, size / 10)
//   var geometry = new THREE.TetrahedronGeometry( gl.size, randint(2,1));
//   var color = randint(100, 100)
//   gl.color = color
//   var material = new THREE.MeshPhongMaterial({color: rgb2hex(RGB(color,color,color))})
//   gl.mesh = new THREE.Mesh(geometry, material)
//   scene.add(gl.mesh)
//   gl.mesh.position.x = (size * 2) + position.x + gl.size
//   gl.mesh.position.y = position.y
//   gl.mesh.position.z = position.z
//   /*
//   point = {x: gl.mesh.position.x, y: gl.mesh.position.z}
//   center = {x: position.x, y: position.z}
//   r = rotateAround(point, center, randint(0, 360))
//   gl.mesh.position.x = r.x
//   gl.mesh.position.z = r.y
//   */
//   pi2 = Math.PI * 2
//   gl.rdeg = randint(25, 50) / 100
//   gl.rang = randint(-pi2, pi2 * 2) / 10
//   return gl
// }

// console.log(system.planets.map(p => p.toJSON()));
// const largestR = Math.max(...system.planets.map(p => p.radius));
//
const system = new Accrete.StarSystem();
system.create();
const planets = system.planets.sort((p1, p2) => p1.a - p2.a).map(createPlanet);
console.log(system.planets)

// let prev = 200
var mindfc = 200 * (system.planets[0].rp + system.planets[0].ra) / 2;
// var astPlace = randint(3, 4);
// var astDist;

// for (var i = 0; i < 10; i++) {
//   if (i !== astPlace) {
//     sizeD = Math.abs(prev - 100) / 20
//     size = randint(sizeD, 50)
//     dfc = size + prev // 200 + (5, 50)
//     dfc += randint(50, 50)
//     if (i == 0) mindfc = dfc
//     var gasplanet = false
//     if (i > astPlace) gasplanet = true;
//     planets.push(createPlanet(dfc, size, gasplanet))
//     prev = dfc + size
//   } else {
//     prev += 100
//     astDist = prev - 50
//   }
// }

// function createAsteroidBelt() {
//   //asteroid particle system:
//   var astCount = 600,
//       asteroids = new THREE.Geometry(),
//       aMaterial = new THREE.PointsMaterial({
//         size: 10,
//         map: createCanvasMaterial('#'+808080, 256),
//         transparent: true,
//         depthWrite: false
//       });

//   // now create the individual particles
//   for (var p = 0; p < astCount; p++) {

//     // create a particle with random
//     var pX = randoffset(astDist, 20),
//         pY = randoffset(0, 20),
//         pZ = 0
//     point = {x: pX, y: 0}
//     center = {x: 0, y: 0}
//     r = rotateAround(point, center, randint(0, 360))
//     pX = r.x
//     pZ = r.y
//     var particle = new THREE.Vector3(pX, pY, pZ)

//     // add it to the geometry
//     asteroids.vertices.push(particle);
//   }

//   // create the particle system
//   return new THREE.Points(
//       asteroids,
//       aMaterial);
// };

// const astSystem = createAsteroidBelt();
// scene.add(astSystem);

// background stars
function createStarfield() {
  const starCount = 1000;
  const stars = new THREE.Geometry();
  const sMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 50
  });

  const r = 10000;

  for (let i = 0; i < starCount; i++) {
    const pX = r * Math.cos(2 * Math.PI * Math.random());
    const pY = r * Math.sin(2 * Math.PI * Math.random());
    const pZ = r * Math.sin(2 * Math.PI * Math.random());
    const offset = r - Math.sqrt(pX * pX + pY * pY + pZ * pZ);
    const particle = new THREE.Vector3(
      Math.sign(pX) * offset + pX,
      Math.sign(pY) * offset + pY,
      Math.sign(pZ) * offset + pZ
    );
    stars.vertices.push(particle);
  }

  return new THREE.Points(stars, sMaterial);
}

const starSystem = createStarfield();
scene.add(starSystem);

camera.position.x = 0;
camera.position.y = 5000;
camera.position.z = 0;
camera.lookAt(new THREE.Vector3(0, 0, 0));

oControls.target.set(0, 0, 0);
oControls.enablePan = false;
oControls.enableZoom = true;
oControls.minDistance = 300;
oControls.maxDistance = 8000;
oControls.update();

let t = 0;
const render = function () {
  t++;
  requestAnimationFrame(render);
  mainloop()
  renderer.render(scene, camera);
};

const yearScale = 10e-4;
let activePlanet;

function sunrotate(p, i) {
  const rad = p.mesh.geometry.boundingSphere.radius;
  const { x, z } = p.mesh.position;
  const rdeg = yearScale * (system.planets[i].orbitalPeriod / 365) * Math.PI / 180;
  const a = system.planets[i].a;
  // const point = { x: p.mesh.position.x, y: p.mesh.position.z };
  // const center = {x: 0, y: 0};
  // const { x, y } = rotateAround(point, center, rdeg)
  p.mesh.position.x = x * Math.cos(rdeg) - z * Math.sin(rdeg);
  p.mesh.position.z = z * Math.cos(rdeg) + x * Math.sin(rdeg);
  return p;
}

console.lastLog = Date.now();

console.dlog = function(fn, min = 1000) {
  if (Date.now() - console.lastLog < min) return;
  console.log(fn());
  console.lastLog = Date.now();
}

let zoomTo;
let lookAt;
let changedTarget = false;
let dragging = false;

window.onmousedown = () => dragging = true;
window.onmouseup = () => dragging = false;

function mainloop() {
  if (zoomTo && lookAt && changedTarget) {
    const dist = camera.position.clone().sub(zoomTo).length();

    if (dist > 1) {
      camera.position.lerp(zoomTo, Math.min(1, progress += 0.001));
    } else {
      changedTarget = false;
    }
  }

  if (lookAt && !dragging) {
    camera.lookAt('getWorldPosition' in lookAt ? lookAt.getWorldPosition() : lookAt);
  }

  for (var i = 0; i < planets.length; i++) {
    const planet = planets[i];
    sunrotate(planet, i);
    planet.mesh.rotation.y += Math.PI / 180;

    if (planet.ring) {
      planet.ring.system.rotation.z -= planet.ring.rdeg;
      planet.ring.system.position.x = planet.mesh.position.x
      planet.ring.system.position.y = planet.mesh.position.y
      planet.ring.system.position.z = planet.mesh.position.z
    }
  }
  // astSystem.rotation.y -= deg(0.05)
}

render();

window.addEventListener('resize', onWindowResize, false );

function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

document.addEventListener('click', handleClick, false);

function showInfo() {
  const i = planets.findIndex(p => p.mesh === activePlanet);
  const info = system.planets[i].toJSON();

  const infoContainer = document.createElement('div');
  infoContainer.style.cssText = `
    border: 1px solid white;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    display: relative;
    padding: 10px;
    color: chartreuse;
    font: 18px/1.6 monospace;
    position: absolute;
    top: 20px;
    left: 20px;
    height: 75vh;
    width: 20vw;
  `;

  const planetName = `Planet #${i+1}`;
  const title = document.createElement('h3');
  title.innerText = planetName;
  infoContainer.appendChild(title);
  title.style.cssText = `
    flex: 0 1 10%;
    margin: 0 0 0.6em;
  `;

  const stats = document.createElement('div');
  stats.style.cssText = `
    padding: 10px;
    overflow: scroll;
    flex: 1 0 90%;
  `;

  infoContainer.appendChild(stats);

  infoContainer.appendChild(
    Object.entries(info).reduce((container, [k, v]) => {
      const isList = Array.isArray(v) || typeof v === 'object';
      const el = document.createElement('div');
      let title, value;

      if (isList) {
        title = document.createElement('h4');
        title.innerText = (`${k.charAt(0).toUpperCase()}${k.substr(1)}`).replace(/([a-z])([A-Z])/g, '$1 $2')
        el.appendChild(title);
        el.appendChild(
          Object.entries(v).reduce((parent, [i, val]) => {
            const li = document.createElement('li');
            if (!parseInt(i)) {
              const label = document.createElement('span');
              label.style.cssText = 'font-weight:bold;';
              label.innerText = `${i}: `;
              li.appendChild(label);
            }
            const span = document.createElement('span');
            span.innerText = val;
            li.appendChild(span);
            parent.appendChild(li);
            return parent;
          }, document.createElement('ul'))
        );
      }
      else {
        title = document.createElement('span');
        title.style.cssText = 'font-weight: bold;';
        title.innerText = `${(`${k.charAt(0).toUpperCase()}${k.substr(1)}`).replace(/([a-z])([A-Z])/g, '$1 $2')}: `;
        el.appendChild(title);
        value = document.createElement('span');
        value.innerText = v;
        el.appendChild(value);
      }

      container.appendChild(el);
      return container;
    }, stats)
  );

  document.body.appendChild(infoContainer);
}

function hideInfo() {
  const el = document.querySelector('body > div');
  if (el) document.body.removeChild(el);
}

var raycaster = new THREE.Raycaster();

function handleClick(event) {
  event.preventDefault();
  const mouse = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1);
  raycaster.setFromCamera( mouse, camera );
  // calculate objects intersecting the picking ray
  var intersects = (raycaster.intersectObjects(scene.children) || []).find(i => i.object !== sun.mesh);

  if(intersects) {
    progress = 0;
    activePlanet = intersects.object;
    zoomTo = activePlanet.getWorldPosition();
    zoomTo = zoomTo.sub(zoomTo.normalize().multiplyScalar(activePlanet.geometry.boundingSphere.radius / 2));
    lookAt = activePlanet;
    changedTarget = true;
    hideInfo();
    showInfo();
  } else {
    activePlanet = null;
    progress = 0;
    zoomTo = new THREE.Vector3(0, 5000, 0);
    lookAt = new THREE.Vector3(0, 0, 0);
    // camera.position.y = 5000;
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    changedTarget = true;
    hideInfo();
  }
}
