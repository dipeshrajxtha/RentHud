import React from 'react';
import logoOriginal from '@/assets/Logo/renthub-logo-original.png';
import logoWhite from '@/assets/Logo/renthub-logo-white.png';
import iconOriginal from '@/assets/Logo/renthub-icon-original.png';
import iconWhite from '@/assets/Logo/renthub-icon-white.png';

export interface RentHubLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * 'original' for light backgrounds (blue icon + dark blue text).
   * 'white' for dark backgrounds (white icon + white text).
   */
  variant?: 'original' | 'white';
  /** Preset height sizes or custom via className */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const LOGO_HEIGHTS = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

/**
 * RentHub full brand logo (icon mark + typography).
 */
export const RentHubLogo: React.FC<RentHubLogoProps> = ({
  variant = 'original',
  size = 'md',
  className = '',
  alt = 'RentHub',
  ...props
}) => {
  const src = variant === 'white' ? logoWhite : logoOriginal;
  const sizeClass = LOGO_HEIGHTS[size] || 'h-8';

  return (
    <img
      src={src}
      alt={alt}
      className={`w-auto object-contain select-none ${sizeClass} ${className}`.trim()}
      loading="eager"
      {...props}
    />
  );
};

export interface RentHubIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * 'original' for brand blue icon.
   * 'white' for white icon.
   */
  variant?: 'original' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ICON_SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

/**
 * RentHub standalone icon mark (house-pin emblem).
 */
export const RentHubIcon: React.FC<RentHubIconProps> = ({
  variant = 'original',
  size = 'md',
  className = '',
  alt = 'RentHub Icon',
  ...props
}) => {
  const src = variant === 'white' ? iconWhite : iconOriginal;
  const sizeClass = ICON_SIZES[size] || 'w-8 h-8';

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none ${sizeClass} ${className}`.trim()}
      loading="eager"
      {...props}
    />
  );
};

export default RentHubLogo;
