declare module 'lucide-react/dist/esm/icons/*.js' {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

  export interface LucideProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  const icon: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;
  export default icon;
}