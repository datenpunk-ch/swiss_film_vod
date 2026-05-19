/** Hält Bayes-Tooltips im sichtbaren Chart-/Embed-Bereich. */
export function bayesTooltipPosition(width = 200, height = 96) {
  return ({ coordinate, viewBox }) => {
    if (!coordinate || !viewBox) return undefined;
    const pad = 8;
    const maxX = viewBox.x + viewBox.width;
    const maxY = viewBox.y + viewBox.height;
    let x = coordinate.x + 14;
    let y = coordinate.y - height * 0.45;
    if (x + width > maxX - pad) x = coordinate.x - width - 14;
    if (x < viewBox.x + pad) x = viewBox.x + pad;
    if (y < viewBox.y + pad) y = viewBox.y + pad;
    if (y + height > maxY - pad) y = maxY - height - pad;
    return { x, y };
  };
}
