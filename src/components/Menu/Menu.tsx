import { Button } from '../ui';

type MenuProps = {
  children: ReactNode;
};

export const Menu = ({ children }: MenuProps) => {
  // const [isExpanded, setIsExpanded] = useState(false);
  // const toggleIsExpanded = useCallback(() => {
  //   setIsExpanded(isExpanded => !isExpanded);
  // }, []);

  return (
    <div className="  text-[#ddd]  font-mono   rounded">
      <Button className="imos-drag-handle w-full">Drag me</Button>
      {/* <div className="button" onClick={toggleIsExpanded}>
        {isExpanded ? <HiChevronUp className="icon" /> : <HiOutlineMenu className="icon border" />}
      </div>
      {isExpanded ? children : null} */}
      <div className="px-2">{children}</div>
    </div>
  );
};
