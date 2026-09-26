import type { AppInfo } from './types';
import { fitnfree } from '../apps/fitnfree/app';

// Every app on the site. Add new apps here; order is the order shown.
export const apps: AppInfo[] = [fitnfree];

export function getApp(slug: string): AppInfo | undefined {
  return apps.find((a) => a.slug === slug);
}
