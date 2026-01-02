'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

export function useCategories() {
  const { data } = useSuspenseQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return {
    categories: data,
  };
}
