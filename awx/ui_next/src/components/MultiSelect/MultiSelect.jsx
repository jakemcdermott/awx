import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { withI18n } from '@lingui/react';
import { withRouter } from 'react-router-dom';
import { Chip, ChipGroup } from '@components/Chip';
import {
  Dropdown as PFDropdown,
  DropdownItem,
  TextInput as PFTextInput,
  DropdownToggle,
} from '@patternfly/react-core';
import styled from 'styled-components';

const InputGroup = styled.div`
  border: 1px solid black;
  margin-top: 2px;
`;
const TextInput = styled(PFTextInput)`
  border: none;
  width: 100%;
  padding-left: 8px;
`;
const Dropdown = styled(PFDropdown)`
  width: 100%;
  .pf-c-dropdown__toggle.pf-m-plain {
    display: none;
  }
  display: block;
  .pf-c-dropdown__menu {
    max-height: 200px;
    overflow: scroll;
  }
  && button[disabled] {
    color: var(--pf-c-button--m-plain--Color);
    pointer-events: initial;
    cursor: not-allowed;
    color: var(--pf-global--disabled-color--200);
  }
`;

class MultiSelect extends Component {
  static propTypes = {
    associatedItems: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
      })
    ).isRequired,
    onAddNewItem: PropTypes.func.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      input: '',
      chipItems: this.getInitialChipItems(),
      isExpanded: false,
    };
    this.handleAddItem = this.handleAddItem.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.removeChip = this.removeChip.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    // The event listener added below is used to check whether the user clicks inside, or outside
    // the multiSelect component and then close the dropdown as necessary.
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  getInitialChipItems() {
    const { associatedItems } = this.props;
    return associatedItems.map(item => ({
      name: item.name,
      id: item.id,
    }));
  }

  handleClick(event) {
    if (event.target.value) {
      this.handleSelection(event, event.target.value);
    } else {
      this.setState({ isExpanded: false });
    }
  }

  handleSelection(e, item) {
    const { chipItems } = this.state;
    const { onAddNewItem } = this.props;
    const isIncluded = chipItems.some(
      chipItem => chipItem.name === item.name || chipItem.name === item
    );
    if (isIncluded) {
      this.setState({ input: '', isExpanded: false });
      return;
    }
    this.setState({
      chipItems: chipItems.concat({
        name: item.name || item,
        id: item.id || item,
      }),
      isExpanded: false,
      input: '',
    });
    onAddNewItem(item);
  }

  handleAddItem(event) {
    const { input, chipItems } = this.state;
    const { onAddNewItem } = this.props;
    const isIncluded = chipItems.some(chipItem => chipItem.name === input);
    if (isIncluded) {
      // This event.preventDefault prevents the form from submitting
      // if the user tries to create 2 chips of the same name
      event.preventDefault();
      this.setState({ input: '', isExpanded: false });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.setState({
        chipItems: chipItems.concat({ name: input, id: input }),
        isExpanded: false,
        input: '',
      });
      onAddNewItem(input);
    }
  }

  handleInputChange(e) {
    this.setState({ input: e, isExpanded: true });
  }

  removeChip(e, item) {
    const { onRemoveItem } = this.props;
    const { chipItems } = this.state;
    const chips = chipItems.filter(chip => chip.id !== item.id);

    this.setState({ chipItems: chips });
    onRemoveItem(item);
  }

  render() {
    const { options } = this.props;
    const { chipItems, input, isExpanded } = this.state;

    const list = options
      .filter(filteredOption => filteredOption.name.includes(input))
      .map(option => (
        <DropdownItem
          key={option.id}
          component="button"
          isDisabled={chipItems.some(item => item.id === option.id)}
          value={option.name}
          onClick={this.handleClick}
        >
          {option.name}
        </DropdownItem>
      ));

    const chips = (
      <ChipGroup>
        {chipItems &&
          chipItems.map(item => (
            <Chip
              key={item.id}
              onClick={e => {
                this.removeChip(e, item);
              }}
            >
              {item.name}
            </Chip>
          ))}
      </ChipGroup>
    );
    return (
      <Fragment>
        <InputGroup>
          <div
            ref={node => {
              this.node = node;
            }}
          >
            <TextInput
              type="text"
              aria-label="labels"
              value={input}
              onClick={() => this.setState({ isExpanded: true })}
              onChange={this.handleInputChange}
              onKeyDown={this.handleAddItem}
            />
            <Dropdown
              type="button"
              isPlain
              value={chipItems}
              toggle={<DropdownToggle isPlain>Labels</DropdownToggle>}
              // Above is not rendered but is a required prop from Patternfly
              isOpen={isExpanded}
              dropdownItems={
                list.length > 0
                  ? list
                  : [
                      <DropdownItem
                        key={input}
                        value={input}
                        component="button"
                        onClick={this.handleClick}
                      >
                        {input}
                      </DropdownItem>,
                    ]
              }
            />
          </div>
          <div css="margin: 10px">{chips}</div>
        </InputGroup>
      </Fragment>
    );
  }
}
export { MultiSelect as _MultiSelect };
export default withI18n()(withRouter(MultiSelect));
