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
