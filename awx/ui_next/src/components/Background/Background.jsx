import React, { Fragment } from 'react';

import { BackgroundImage, BackgroundImageSrc } from '@patternfly/react-core';

const backgroundImageConfig = {
  [BackgroundImageSrc.xs]: '/static/media/pfbg_576.jpg',
  [BackgroundImageSrc.xs2x]: '/static/media/pfbg_576@2x.jpg',
  [BackgroundImageSrc.sm]: '/static/media/pfbg_768.jpg',
  [BackgroundImageSrc.sm2x]: '/static/media/pfbg_768@2x.jpg',
  [BackgroundImageSrc.lg]: '/static/media/pfbg_2000.jpg',
};

export default ({ children }) => (
  <Fragment>
    <BackgroundImage src={backgroundImageConfig} />
    {children}
  </Fragment>
);
