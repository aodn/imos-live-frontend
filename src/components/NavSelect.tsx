import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

type NavSelectProps = {
  options: any[];
  selected: string;
  handleClick: (v: string) => void;
};

const NavSelect = ({ options, selected, handleClick }: NavSelectProps) => {
  const index = options.indexOf(selected);
  return (
    <div className="select">
      <button
        onClick={() => handleClick(options[0])}
        className={
          index > 0
            ? "bg-inherit text-[#ddd] px-1.5 py-1.5 font-mono border-none outline-none inline-block align-middle"
            : "hidden"
        }
      >
        <HiChevronDoubleLeft />
      </button>
      <button
        onClick={() => handleClick(options[index - 1])}
        className={
          index > 0
            ? "bg-inherit text-[#ddd] px-1.5 py-1.5 font-mono border-none outline-none inline-block align-middle"
            : "hidden"
        }
      >
        <HiChevronLeft />
      </button>
      {selected}
      <button
        onClick={() => handleClick(options[index + 1])}
        className={
          index < options.length - 1
            ? "bg-inherit text-[#ddd] px-1.5 py-1.5 font-mono border-none outline-none inline-block align-middle"
            : "hidden"
        }
      >
        <HiChevronRight />
      </button>
      <button
        onClick={() => handleClick(options.at(-1))}
        className={
          index < options.length - 1
            ? "bg-inherit text-[#ddd] px-1.5 py-1.5 font-mono border-none outline-none inline-block align-middle"
            : "hidden"
        }
      >
        <HiChevronDoubleRight />
      </button>
    </div>
  );
};

export default NavSelect;
