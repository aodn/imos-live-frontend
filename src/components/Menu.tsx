import { useState, useCallback, ReactNode } from 'react';
import { HiChevronUp, HiOutlineMenu } from 'react-icons/hi';

type MenuProps = {
  children: ReactNode;
};

const Menu = ({ children }: MenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleIsExpanded = useCallback(() => {
    setIsExpanded(isExpanded => !isExpanded);
  }, []);

  return (
    <div className="bg-[rgba(35,55,75,0.9)] text-[#ddd] px-3 py-1.5 font-mono z-[1] absolute top-0 right-0 m-3 rounded max-w-[25vw">
      <div className="button" onClick={toggleIsExpanded}>
        {isExpanded ? <HiChevronUp className="icon" /> : <HiOutlineMenu className="icon border" />}
      </div>
      {isExpanded ? children : null}
    </div>
  );
};

export default Menu;
