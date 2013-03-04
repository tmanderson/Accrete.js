var Renderer = function() {
  var container, stats, controls;
  var camera, scene, renderer;
  var mesh;

  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    stats.update();    
  }

  function render() {
    renderer.render( scene, camera );
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
    render();
  }

  return {
    init: function(container, planets) {
      this.container = container;

      var width = window.innerWidth,
          height = window.innerHeight;

      camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 5000 );
      camera.position.z = 800;

      controls = new THREE.TrackballControls( camera );

      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.8;

      controls.noZoom = false;
      controls.noPan = false;

      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;

      controls.keys = [ 65, 83, 68 ];

      controls.addEventListener( 'change', render );

      //

      scene = new THREE.Scene();

      renderer = new THREE.WebGLRenderer();
      renderer.setSize( width, height );

      container.appendChild( renderer.domElement );

      //////////////
      var material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

      for(var i = 0; i < planets.length; i++) {
        var planet  = planets[i],
          au    = Math.log(planet.axis) / Math.log(10),
          rad   = Math.pow(planet.getEarthMass(), 1/3),
          r     = rad * (width / 3) / 40,
          x0    = au * width / 3,
          x     = x0 + width / 3 - width/2,
          y     = height / 3 - r;
        
        var geometry = new THREE.SphereGeometry( Math.ceil( r ), 64, 64 );
        var mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = x;
        mesh.position.z = 0;

        scene.add( mesh );
      }
      //////////////

      window.addEventListener('resize', resize, false);
    },
    animate: function() {
      animate();
    }
  }
}();
