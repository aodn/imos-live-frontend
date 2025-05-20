type TabsProps = {
  tabs: any[];
  active: number | string | boolean;
};
export const Tabs = ({ tabs, active }: TabsProps) => {
  return (
    <div className="tabs">
      {tabs.map(({ title, handleClick, value }) => (
        <button
          key={title}
          onClick={() => handleClick(value)}
          className={`bg-inherit text-[#ddd] px-3 py-1.5 font-mono border-none outline-none  ${active === value ? '!bg-[rgba(50,85,120,0.9)]' : 'bg-none'}`}
          value={value}
        >
          {title}
        </button>
      ))}
    </div>
  );
};
