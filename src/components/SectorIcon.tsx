import { Wheat, Fish, HardHat, Shirt, Package, Briefcase, type LucideIcon } from 'lucide-react';

export const SECTOR_ICONS: Record<string, LucideIcon> = {
  wheat: Wheat,
  fish: Fish,
  'hard-hat': HardHat,
  shirt: Shirt,
  package: Package,
  briefcase: Briefcase,
};

export function SectorIcon({
  sector,
  className,
}: {
  sector: string;
  className?: string;
}) {
  const map: Record<string, LucideIcon> = {
    agriculture: Wheat,
    peche: Fish,
    btp: HardHat,
    textile: Shirt,
    agroalimentaire: Package,
    services: Briefcase,
  };
  const Icon = map[sector] ?? Package;
  return <Icon className={className} />;
}
