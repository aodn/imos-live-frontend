import { ReactNode } from "react";
type props = {
  title: string;
  children: ReactNode;
};
const MenuPane = ({ title, children }: props) => (
  <div className="menu-pane centre">
    <p>{title}</p>
    {children}
  </div>
);

export default MenuPane;
