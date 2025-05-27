import { MainSidebarContent } from './MainSidebarContent';
import { headderDataMock, featuredDatasetMock, layerProductsMock } from './mock';
export default {
  title: 'Components/MainSidebar/MainSidebarContent',
  component: MainSidebarContent,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    width: {
      control: { type: 'select' },
      options: ['w-64', 'w-72', 'w-80', 'w-96'],
    },
    showFeaturedSection: {
      control: { type: 'boolean' },
    },
  },
};

export const Default = {
  args: {
    headerData: headderDataMock,
    featuredDatasets: featuredDatasetMock,
    layerProducts: layerProductsMock,
  },
};
