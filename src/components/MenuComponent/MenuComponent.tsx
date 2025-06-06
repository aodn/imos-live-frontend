import { MenuPane } from '../MenuPane';
import { Tabs } from '../Tab/Tabs';
import { NavSelect } from '../NavSelect';
import { styles } from '../../styles';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

export const MenuComponent = () => {
  const {
    style,
    numParticles,
    distanceMeasurement,
    dataset,
    datasets,
    setStyle,
    setNumParticles,
    setDistanceMeasurement,
    setDataset,
  } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
      numParticles: s.numParticles,
      distanceMeasurement: s.distanceMeasurement,
      dataset: s.dataset,
      datasets: s.datasets,
      setStyle: s.setStyle,
      setNumParticles: s.setNumParticles,
      setDistanceMeasurement: s.setDistanceMeasurement,
      setDataset: s.setDataset,
    })),
  );

  return (
    <div className="bg-[rgba(35,55,75,1)]">
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
    </div>
  );
};
