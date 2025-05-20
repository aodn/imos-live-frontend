import { MenuPane } from '../MenuPane';
import { Tabs } from '../Tab/Tabs';
import { NavSelect } from '../NavSelect';
import { Menu } from '../Menu';
import { styles } from '../../styles';
import { useMapUIStore } from '@/store';

export const MenuComponent = () => {
  const {
    style,
    overlay,
    circle,
    particles,
    numParticles,
    distanceMeasurement,
    dataset,
    datasets,
    setStyle,
    setOverlay,
    setCircle,
    setParticles,
    setNumParticles,
    setDistanceMeasurement,
    setDataset,
  } = useMapUIStore();

  return (
    <div>
      <Menu>
        <MenuPane title={'Styles'}>
          <Tabs
            tabs={styles.map(({ title }) => ({
              title,
              handleClick: setStyle,
              value: title,
            }))}
            active={style}
          />
        </MenuPane>
        <MenuPane title={'Overlay'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: setOverlay, value: true },
              { title: 'Off', handleClick: setOverlay, value: false },
            ]}
            active={overlay}
          />
        </MenuPane>
        <MenuPane title={'Circle'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: setCircle, value: true },
              { title: 'Off', handleClick: setCircle, value: false },
            ]}
            active={circle}
          />
        </MenuPane>
        <MenuPane title={'Particles'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: setParticles, value: true },
              { title: 'Off', handleClick: setParticles, value: false },
            ]}
            active={particles}
          />
        </MenuPane>
        <MenuPane title={'Measurement'}>
          <Tabs
            tabs={[
              { title: 'On', handleClick: setDistanceMeasurement, value: true },
              { title: 'Off', handleClick: setDistanceMeasurement, value: false },
            ]}
            active={distanceMeasurement}
          />
        </MenuPane>
        <MenuPane title={'Number'}>
          <Tabs
            tabs={[
              {
                title: '1000',
                handleClick: setNumParticles,
                value: 1000,
              },
              {
                title: '10,000',
                handleClick: setNumParticles,
                value: 10000,
              },
              {
                title: '100,000',
                handleClick: setNumParticles,
                value: 100000,
              },
            ]}
            active={numParticles}
          />
        </MenuPane>
        <MenuPane title={'Date'}>
          <NavSelect options={datasets} selected={dataset} handleClick={setDataset} />
        </MenuPane>
      </Menu>
    </div>
  );
};
