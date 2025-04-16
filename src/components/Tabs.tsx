type TabsProps = {
  tabs: any[];
  active: number | string | boolean;
};
const Tabs = ({ tabs, active }: TabsProps) => (
  <div className="tabs">
    {tabs.map(({ title, handleClick, value }) => (
      <button
        key={title}
        onClick={() => handleClick(value)}
        className={value === active ? "active" : ""}
        value={value}
      >
        {title}
      </button>
    ))}
  </div>
);

export default Tabs;
