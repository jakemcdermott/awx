import React, { Fragment } from 'react';

import { BackgroundImage } from '@patternfly/react-core';

export default ({ children }) => (
  <Fragment>
    <BackgroundImage
      src={{
        xs: '/static/media/pfbg_576.jpg',
        xs2x: '/static/media/pfbg_576@2x.jpg',
        sm: '/static/media/pfbg_768.jpg',
        sm2x: '/static/media/pfbg_768@2x.jpg',
        lg: '/static/media/pfbg_768.jpg',
      }}
    />
    {children}
  </Fragment>
);
