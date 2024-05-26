import { type FC } from 'react';
import { List } from '@telegram-apps/telegram-ui';

import { DisplayData } from '@/components/DisplayData/DisplayData.tsx';

import './InitDataPage.css';

export const TryMobilePage: FC = () => {
  return (
    <List>
      <DisplayData
        rows={[
          { title: 'No desctop', value: "Just play on mobile" },
        ]}
      />
    </List>
  );
};
