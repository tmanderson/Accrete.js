System
  - center mass (star)

  Dust Cloud
    - eccentricity

    - mass ( Γ = n => (n - 1)! ) // n minus one factorial
      4 * π * K * A * n * Γ(3n)
      ------------------------- * cos( π/2 - θ )
              ⍺^(3n)

    - overall density
      K * Varying density (with r = 0)

    - Varying density (r = distance from center)
      A * e^(-⍺ * r^(1/n))

  Planetary Nuclei
    - inclination: 0
    - semimajor axis: a_i = 50 * RAND[0, 1]
    - eccentricity: e_j = 1 - (1 - RAND[0, 1]) ^ Q

    (a - ae), (a + ae) = orital "sweep" boundary (captures all particles here)

    # Also captures other particles via gravitation
    x = [distance of particle from planetismal] * ([mass of particle]/(1 + [mass of particle])]^1/4 = r੫^1/4

    total band width =
    2 * a * e + x_a + x_p + W(r_a + x_a)/(1 - W) + W(r_p + x_p)/(1 + W)

    _a = aphelion position, _p = perihelion position

    band volume = 2π(total band width)(x_a + x_p)
    (band volume) * (density at _a)

    Growth stops when the mass increase between any two serial iterations falls below (mass * 1e-4)
