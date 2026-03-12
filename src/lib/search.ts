export function globalSearch<T>(items: T[], searchTerm: string): T[] {
  if (!searchTerm || searchTerm.trim() === '') return items;

  const lowerSearch = searchTerm.toLowerCase();

  return items.filter((item) => {
    return recursiveSearch(item, lowerSearch);
  });
}

function recursiveSearch(obj: any, searchTerm: string): boolean {
  if (obj === null || obj === undefined) return false;

  if (typeof obj === 'string') {
    return obj.toLowerCase().includes(searchTerm);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj).toLowerCase().includes(searchTerm);
  }

  if (Array.isArray(obj)) {
    return obj.some(element => recursiveSearch(element, searchTerm));
  }

  if (typeof obj === 'object') {
    return Object.values(obj).some(val => recursiveSearch(val, searchTerm));
  }

  return false;
}
