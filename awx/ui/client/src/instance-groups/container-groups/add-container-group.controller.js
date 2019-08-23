function AddContainerGroupController($state, models, strings, i18n, CredTypesList) {
  const vm = this || {};
  const {
    instanceGroup,
  } = models;


  vm.mode = 'add'
  vm.strings = strings
  vm.panelTitle = strings.get('state.ADD_CONTAINER_GROUP_BREADCRUMB_LABEL')
  vm.lookUpTitle = strings.get('credential.LOOK_UP_TITLE')
  vm.form = instanceGroup.createFormSchema('post')
  console.log(vm.form, 'form')
  vm.form.credential = {
    type: 'field',
    label: i18n._('Credential Type'),
    id: 'credential'
  };
  vm.form.credential._placeholder = strings.get('credential.CREDENTIAL_TYPE_PLACEHOLDER')
  vm.form.credential._route = "instanceGroups.addContainerGroup.credentialType"
  vm.form.credential._model = instanceGroup
  vm.form.credential._resource = 'credential_types';
  vm.form.credential.required = true
  vm.panelTitle = strings.get('credential.PANEL_TITLE');
  // vm.credTypes_dataset = CredTypesList.data;
  // vm.credTypes = CredTypesList.data.results;
  // vm.list = {
  //   name: 'credential_types',
  //   iterator: 'add_credential_type',
  //   basePath: `/api/v2/credential_types/`
  // };

  vm.form.save = (data) => {
    console.log(vm, 'selected save');
    console.log(data, 'data');
    if (vm.selectedRow) {
      return instanceGroup.http.post(config);
    }
    $state.go('instanceGroups.addContainerGroup')
  };
}

AddContainerGroupController.$inject = [
  '$state',
  'resolvedModels',
  'InstanceGroupsStrings',
  'i18n',
  'CredTypesList'
];

export default AddContainerGroupController;
