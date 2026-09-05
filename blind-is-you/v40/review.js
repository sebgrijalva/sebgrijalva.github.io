// Plain DOM-independent reconstruction, shown only after both trials are complete.
export function reviewPair(pair) {
  return (
    '<div class="trace-comparison">' +
    pair.records
      .map((r) => {
        const targets = Array.isArray(r.target) ? r.target : [r.target];
        const response = Array.isArray(r.response)
          ? r.response
          : r.response?.locations || [r.response];
        const cells = Array.from(
          { length: r.gridSize * r.gridSize },
          (_, i) => {
            const row = Math.floor(i / r.gridSize),
              col = i % r.gridSize;
            const at = (xs) =>
              xs
                .flatMap((p, j) =>
                  p?.r === row && p?.c === col ? [j + 1] : [],
                )
                .join(",");
            const a = at(targets),
              b = at(response);
            return `<span class="trace-cell ${a && a === b ? "match" : ""}"><b>${a}</b><i>${b}</i></span>`;
          },
        ).join("");
        return `<section><h3>${r.condition}</h3><div class="trace-grid" style="--n:${r.gridSize}">${cells}</div></section>`;
      })
      .join("") +
    '</div><div class="trace-key"><b>● Original order</b><i>● Your reconstruction</i></div>'
  );
}
