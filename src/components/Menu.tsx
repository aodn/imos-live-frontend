import { useState, useCallback, ReactNode } from "react";
import { HiChevronUp, HiOutlineMenu } from "react-icons/hi";

type MenuProps = {
  children: ReactNode;
};

const Menu = ({ children }: MenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleIsExpanded = useCallback(() => {
    setIsExpanded((isExpanded) => !isExpanded);
  }, []);

  return (
    <div className="menu">
      <div className="button" onClick={toggleIsExpanded}>
        {isExpanded ? (
          <HiChevronUp className="icon" />
        ) : (
          <HiOutlineMenu className="icon border" />
        )}
      </div>
      {isExpanded ? children : null}
    </div>
  );
};

export default Menu;
