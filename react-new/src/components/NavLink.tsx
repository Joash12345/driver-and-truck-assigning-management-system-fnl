import React from 'react';
import { NavLink as RouterNavLink, NavLinkProps as RouterNavLinkProps } from 'react-router-dom';

type Props = RouterNavLinkProps & {
  activeClassName?: string;
};

export const NavLink: React.FC<Props> = ({ activeClassName = '', className = '', children, ...rest }) => {
  return (
    <RouterNavLink
      {...rest}
      className={({ isActive }) => [className, isActive ? activeClassName : ''].filter(Boolean).join(' ')}
    >
      {children}
    </RouterNavLink>
  );
};

export default NavLink;
