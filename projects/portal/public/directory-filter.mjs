export function matchesRow(kind, text, category, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return (category === 'All' || kind === category) && text.toLocaleLowerCase().includes(normalizedQuery);
}

export function resultLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
