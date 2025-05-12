import { ReactNode } from 'react';
type props = {
  title: string;
  children: ReactNode;
};
export const MenuPane = ({ title, children }: props) => (
  <div className="text-center">
    <p>{title}</p>
    {children}
  </div>
);
