import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ControlSize } from '@/types/control';

export type ButtonVariant = 'primary' | 'glass' | 'quiet' | 'unstyled';

interface SharedProps {
  variant?: ButtonVariant;
  size?: ControlSize;
  className?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

type ContentProps =
  { label: ReactNode; children?: never } | { label?: never; children?: ReactNode };

type ActionProps = SharedProps &
  ContentProps &
  Omit<ComponentPropsWithRef<'button'>, keyof SharedProps | 'children'> & {
    as?: 'button';
    loading?: boolean;
    to?: never;
    href?: never;
  };

type RouterLinkProps = SharedProps &
  ContentProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof SharedProps | 'children'> & {
    as: 'link';
    disabled?: never;
    loading?: never;
    type?: never;
    href?: never;
  };

type AnchorProps = SharedProps &
  ContentProps &
  Omit<ComponentPropsWithRef<'a'>, keyof SharedProps | 'href' | 'type' | 'children'> & {
    as: 'anchor';
    href: string;
    disabled?: never;
    loading?: never;
    type?: never;
    to?: never;
  };

export type ButtonProps = ActionProps | RouterLinkProps | AnchorProps;

export function Button(props: ButtonProps) {
  const { variant = 'primary', className = '', startIcon, endIcon, label, children } = props;
  const hasStartIcon = startIcon != null && startIcon !== false;
  const hasEndIcon = endIcon != null && endIcon !== false;
  const hasIcons = hasStartIcon || hasEndIcon;
  const body = label !== undefined ? label : children;
  const hasBody = body != null && body !== false && body !== '';
  const content = hasIcons ? (
    <>
      {hasStartIcon && (
        <span className="aw-button-icon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {hasBody && <span className="aw-button-label">{body}</span>}
      {hasEndIcon && (
        <span className="aw-button-icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </>
  ) : (
    body
  );
  const classes = [
    variant === 'unstyled' ? 'aw-button-unstyled' : `btn aw-button aw-btn-${variant}`,
    variant !== 'unstyled' || props.size ? `aw-control-${props.size ?? 'md'}` : '',
    hasIcons ? 'aw-button-with-icons' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (props.as === 'link') {
    const {
      as: _,
      variant: _variant,
      size: _size,
      className: _className,
      startIcon: _start,
      endIcon: _end,
      label: _label,
      children: _children,
      ...linkProps
    } = props;
    return (
      <Link {...linkProps} className={classes}>
        {content}
      </Link>
    );
  }
  if (props.as === 'anchor') {
    const {
      as: _,
      variant: _variant,
      size: _size,
      className: _className,
      startIcon: _start,
      endIcon: _end,
      label: _label,
      children: _children,
      ...anchorProps
    } = props;
    return (
      <a {...anchorProps} className={classes}>
        {content}
      </a>
    );
  }
  const {
    as: _,
    variant: _variant,
    size: _size,
    className: _className,
    startIcon: _start,
    endIcon: _end,
    label: _label,
    children: _children,
    type = 'button',
    loading = false,
    disabled,
    ...buttonProps
  } = props;
  return (
    <button
      {...buttonProps}
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || buttonProps['aria-busy'] || undefined}
    >
      {content}
    </button>
  );
}
