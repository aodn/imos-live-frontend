export const isScrollableElement = (element: Element): boolean => {
  const computedStyle = window.getComputedStyle(element);
  return ['auto', 'scroll'].some(value =>
    [computedStyle.overflow, computedStyle.overflowY, computedStyle.overflowX].includes(value),
  );
};
