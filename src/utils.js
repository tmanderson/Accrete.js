// Random (distributed with `n`) numbers for node/browser
export const rand = (min = 0, max = min + 1, n = 2) => {
  const vals = new Uint16Array(Math.round(n));

  if (typeof module !== "undefined" && module.exports) {
    let i = Math.round(n);
    while (i-- > 0)
      vals[i] = parseInt(
        require("crypto")
          .randomBytes(2)
          .toString("hex"),
        16
      );
  } else {
    crypto.getRandomValues(vals);
  }

  return Math.max(
    min,
    Math.min(max, (max * vals.reduce((out, v) => out + v / 65536, 0)) / n)
  );
};

export const convert = {
  metric: {
    temp: k => k - 273.15,
    dist: km => km,
    weight: kg => kg
  },
  empirical: {
    temp: k => 1.8 * (k - 273) + 32,
    dist: km => km / 1.609,
    weight: kg => kg * 2.205,
  }
};

convert.metric.temp.label = '°C';
convert.metric.dist.label = 'km';
convert.metric.weight.label = 'kg';

convert.empirical.temp.label = '°F';
convert.empirical.dist.label = 'mi';
convert.empirical.weight.label = 'lbs';