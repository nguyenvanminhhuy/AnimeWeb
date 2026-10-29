import { config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { iconDefinitions } from './iconDefinitions';
import type { IconName } from './iconDefinitions';
import type { ControlSize } from './control.types';

// The project's CSS entry imports the package stylesheet once, in the right layer.
config.autoAddCss = false;

export type IconProps = Omit<
  FontAwesomeIconProps,
  'icon' | 'size' | 'title' | 'titleId' | 'role' | 'aria-label' | 'aria-hidden' | 'focusable'
> & {
  name: IconName;
  size?: ControlSize;
  label?: string;
};

export function Icon({ name, size = 'md', label, className = '', ...props }: IconProps) {
  const accessibleLabel = label?.trim();
  return (
    <FontAwesomeIcon
      {...props}
      icon={iconDefinitions[name]}
      className={['aw-icon', `aw-icon-${size}`, className].filter(Boolean).join(' ')}
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={!accessibleLabel}
      focusable="false"
    />
  );
}
