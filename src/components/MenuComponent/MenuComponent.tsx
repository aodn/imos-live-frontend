import { MenuPane } from '../MenuPane';
import { Tabs } from '../Tab/Tabs';
import { NavSelect } from '../NavSelect';
import { Menu } from '../Menu';
import { styles, StyleTitle } from '../../styles';

type MenuComponentProps = {
  style: StyleTitle;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  numParticles: number;
  dataset: string;
  datasets: string[];
  handleSetStyle: (style: StyleTitle) => void;
  handleSetOverlay: (v: boolean) => void;
  handleSetCircle: (v: boolean) => void;
  handleSetParticles: (v: boolean) => void;
  handleSetNumParticles: (v: number) => void;
  handleSetDataset: (dataset: string) => void;
};

export const MenuComponent = ({
  style,
  overlay,
  circle,
  particles,
  numParticles,
  dataset,
  datasets,
  handleSetStyle,
  handleSetOverlay,
  handleSetCircle,
  handleSetParticles,
  handleSetNumParticles,
  handleSetDataset,
}: MenuComponentProps) => {
  return (
    <div>
      <Menu>
        <MenuPane title={'Styles'}>
          <Tabs
            tabs={styles.map(({ title }) => ({
              title,
              handleClick: handleSetStyle,
              value: title,
            }))}
            active={style}
          />
        </MenuPane>
        <MenuPane title={'Overlay'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: handleSetOverlay, value: true },
              { title: 'Off', handleClick: handleSetOverlay, value: false },
            ]}
            active={overlay}
          />
        </MenuPane>
        <MenuPane title={'Circle'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: handleSetCircle, value: true },
              { title: 'Off', handleClick: handleSetCircle, value: false },
            ]}
            active={circle}
          />
        </MenuPane>
        <MenuPane title={'Particles'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: handleSetParticles, value: true },
              { title: 'Off', handleClick: handleSetParticles, value: false },
            ]}
            active={particles}
          />
        </MenuPane>
        <MenuPane title={'Number'}>
          <Tabs
            tabs={[
              {
                title: '1000',
                handleClick: handleSetNumParticles,
                value: 1000,
              },
              {
                title: '10,000',
                handleClick: handleSetNumParticles,
                value: 10000,
              },
              {
                title: '100,000',
                handleClick: handleSetNumParticles,
                value: 100000,
              },
            ]}
            active={numParticles}
          />
        </MenuPane>
        <MenuPane title={'Date'}>
          <NavSelect options={datasets} selected={dataset} handleClick={handleSetDataset} />
        </MenuPane>
      </Menu>
    </div>
  );
};
