import styled from 'styled-components';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  InfiniteLoader,
  List,
} from 'react-virtualized';

import React, { Component } from 'react';
import { CardBody } from '@patternfly/react-core';

import { JobsAPI } from '@api';
import ContentError from '@components/ContentError';
import ContentLoading from '@components/ContentLoading';
import JobEvent from './JobEvent';
import MenuControls from './shared/MenuControls';

const OutputToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const OutputWrapper = styled.div`
  height: calc(100vh - 325px);
  background-color: #fafafa;
  margin-top: 24px;
  font-family: monospace;
  font-size: 15px;
  border: 1px solid #b7b7b7;
  display: flex;
  flex-direction: column;
`;
const OutputFooter = styled.div`
  background-color: #ebebeb;
  border-right: 1px solid #b7b7b7;
  width: 75px;
  flex: 1;
`;

function range(low, high) {
  const numbers = [];
  for (let n = low; n <= high; n++) {
    numbers.push(n);
  }
  return numbers;
}

class JobOutput extends Component {
  listRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      contentError: null,
      hasContentLoading: true,
      results: {},
      loadedRowCount: 0,
      currentlyLoading: [],
      loadingRowCount: 0,
      remoteRowCount: 0,
    };

    this.cache = new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 25,
    });

    this.loadJobEvents = this.loadJobEvents.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.handleScrollTop = this.handleScrollTop.bind(this);
    this.handleScrollBottom = this.handleScrollBottom.bind(this);
    this.handleScrollNext = this.handleScrollNext.bind(this);
    this.handleScrollPrevious = this.handleScrollPrevious.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.isRowLoaded = this.isRowLoaded.bind(this);
    this.loadMoreRows = this.loadMoreRows.bind(this);
  }

  componentDidMount() {
    this.loadJobEvents();
  }

  componentDidUpdate(prevProps, prevState) {
    // recompute row heights for any job events that have transitioned
    // from loading to loaded
    const { currentlyLoading } = this.state;
    let shouldRecomputeRowHeights = false;
    prevState.currentlyLoading
      .filter(n => !currentlyLoading.includes(n))
      .forEach(n => {
        shouldRecomputeRowHeights = true;
        this.cache.clear(n);
      });
    if (shouldRecomputeRowHeights) {
      this.listRef.recomputeRowHeights();
    }
  }

  async loadJobEvents() {
    const { job } = this.props;

    const loadRange = range(1, 50);
    this.setState(({ currentlyLoading }) => ({
      hasContentLoading: true,
      currentlyLoading: currentlyLoading.concat(loadRange),
    }));
    try {
      const {
        data: { results: newResults = [], count },
      } = await JobsAPI.readEvents(job.id, job.type, {
        page_size: 50,
        order_by: 'start_line',
      });
      this.setState(({ results }) => {
        newResults.forEach(jobEvent => {
          results[jobEvent.counter] = jobEvent;
        });
        return { results, remoteRowCount: count + 1 };
      });
    } catch (err) {
      this.setState({ contentError: err });
    } finally {
      this.setState(({ currentlyLoading }) => ({
        hasContentLoading: false,
        currentlyLoading: currentlyLoading.filter(n => !loadRange.includes(n)),
      }));
    }
  }

  isRowLoaded({ index }) {
    const { results, currentlyLoading } = this.state;
    if (!!results[index]) {
      return true;
    }
    return currentlyLoading.includes(index);
  }

  rowRenderer({ index, parent, key, style, isScrolling }) {
    const { results } = this.state;
    const {
      event = 'MISSING', // this event type is client-only
      created,
      stdout,
      start_line,
    } = results[index] || {};
    return (
      <CellMeasurer
        key={key}
        cache={this.cache}
        parent={parent}
        rowIndex={index}
        columnIndex={0}
      >
        <JobEvent
          className="row"
          style={style}
          created={created}
          event={event}
          start_line={start_line}
          stdout={stdout}
          counter={index}
        />
      </CellMeasurer>
    );
  }

  async loadMoreRows({ startIndex, stopIndex }) {
    const { job } = this.props;

    const loadRange = range(startIndex, stopIndex);
    this.setState(({ currentlyLoading }) => ({
      currentlyLoading: currentlyLoading.concat(loadRange),
    }));
    const params = {
      counter__gte: startIndex,
      counter__lte: stopIndex,
      order_by: 'start_line',
    };
    return await JobsAPI.readEvents(job.id, job.type, params).then(response => {
      this.setState(({ results, currentlyLoading }) => {
        response.data.results.forEach(jobEvent => {
          results[jobEvent.counter] = jobEvent;
        });
        return {
          results,
          currentlyLoading: currentlyLoading.filter(
            n => !loadRange.includes(n)
          ),
        };
      });
    });
  }

  handleScrollPrevious() {
    const startIndex = this.listRef.Grid._renderedRowStartIndex;
    const stopIndex = this.listRef.Grid._renderedRowStopIndex;
    const range = stopIndex - startIndex + 1;
    this.listRef.scrollToRow(Math.max(0, startIndex - range));
  }

  handleScrollNext() {
    const stopIndex = this.listRef.Grid._renderedRowStopIndex;
    this.listRef.scrollToRow(stopIndex - 1);
  }

  handleScrollTop() {
    this.listRef.scrollToRow(0);
  }

  handleScrollBottom() {
    const { remoteRowCount } = this.state;
    this.listRef.scrollToRow(remoteRowCount - 1);
  }

  handleResize({ width }) {
    if (width !== this._previousWidth) {
      this.cache.clearAll();
      this.listRef.recomputeRowHeights();
    }
    this._previousWidth = width;
  }

  render() {
    const { job } = this.props;
    const { hasContentLoading, contentError, remoteRowCount } = this.state;

    if (hasContentLoading) {
      return <ContentLoading />;
    }

    if (contentError) {
      return <ContentError error={contentError} />;
    }

    return (
      <CardBody>
        <b>{job.name}</b>
        <OutputToolbar>
          <MenuControls
            onScrollTop={this.handleScrollTop}
            onScrollBottom={this.handleScrollBottom}
            onScrollNext={this.handleScrollNext}
            onScrollPrevious={this.handleScrollPrevious}
          />
        </OutputToolbar>
        <OutputWrapper>
          <InfiniteLoader
            isRowLoaded={this.isRowLoaded}
            loadMoreRows={this.loadMoreRows}
            rowCount={remoteRowCount}
          >
            {({ onRowsRendered, registerChild }) => (
              <AutoSizer onResize={this.handleResize}>
                {({ width, height }) => {
                  return (
                    <List
                      ref={ref => {
                        this.listRef = ref;
                        registerChild(ref);
                      }}
                      deferredMeasurementCache={this.cache}
                      height={height}
                      onRowsRendered={onRowsRendered}
                      rowCount={remoteRowCount}
                      rowHeight={this.cache.rowHeight}
                      rowRenderer={this.rowRenderer}
                      scrollToAlignment="start"
                      width={width}
                      overscanRowCount={20}
                    />
                  );
                }}
              </AutoSizer>
            )}
          </InfiniteLoader>
          <OutputFooter />
        </OutputWrapper>
      </CardBody>
    );
  }
}

export default JobOutput;
