export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}
